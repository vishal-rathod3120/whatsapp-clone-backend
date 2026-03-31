import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthTokenService } from './auth-token.service';
import { RegisterDto, LoginDto, DeviceDto } from './dto/auth.dto';
import { ContactDiscoveryService } from '../contacts/contact-discovery.service';
import { RedisService } from '../../redis/redis.service';
import { SecurityLogService } from './security-log.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private authTokenService: AuthTokenService,
    private redis: RedisService,
    private securityLog: SecurityLogService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const whereClause: any = {};
    if (dto.phoneNumber) whereClause.phoneNumber = dto.phoneNumber;
    if (dto.email) whereClause.email = dto.email;
    
    const existingUser = await this.prisma.user.findFirst({
      where: whereClause,
    });

    if (existingUser) {
      throw new ConflictException('User already exists with this phone number or email');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Compute phone hash for contact discovery
    const phoneHash = dto.phoneNumber
      ? ContactDiscoveryService.hashPhoneNumber(dto.phoneNumber)
      : undefined;

    // Create user with device
    const user = await this.prisma.user.create({
      data: {
        displayName: dto.displayName,
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        passwordHash,
        phoneHash,
        isVerified: true,
        devices: {
          create: {
            deviceType: dto.device.deviceType,
            deviceName: dto.device.deviceName,
            pushToken: dto.device.pushToken,
            lastActiveAt: new Date(),
          },
        },
      },
      include: {
        devices: true,
      },
    });

    // Generate tokens
    const tokens = await this.authTokenService.generateTokens(
      user.id,
      user.phoneNumber,
    );

    // Store refresh token hash
    const refreshTokenHash = await this.authTokenService.hashRefreshToken(tokens.refreshToken);
    await this.prisma.device.update({
      where: { id: user.devices[0].id },
      data: { refreshTokenHash },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
      },
      deviceId: user.devices[0].id,
    };
  }

  async login(dto: LoginDto) {
    // Find user by phone number
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Account is locked. Try again in ${minutesLeft} minute(s).`,
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      // Increment failed login attempts
      const newAttempts = user.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      // Lock account after 5 failed attempts (15-minute cooldown)
      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil,
        },
      });

      // Log failure
      await this.securityLog.log('LOGIN_FAILED', user.id, undefined, undefined, {
        phoneNumber: dto.phoneNumber,
        attempts: newAttempts,
        locked: !!lockedUntil,
      });

      if (lockedUntil) {
        throw new UnauthorizedException('Account is locked for 15 minutes due to multiple failed attempts.');
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts on success
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // Log success
    await this.securityLog.log('LOGIN_SUCCESS', user.id);

    // Create new device session
    const device = await this.prisma.device.create({
      data: {
        userId: user.id,
        deviceType: dto.device.deviceType,
        deviceName: dto.device.deviceName,
        pushToken: dto.device.pushToken,
        lastActiveAt: new Date(),
      },
    });

    // Generate tokens
    const tokens = await this.authTokenService.generateTokens(
      user.id,
      user.phoneNumber,
    );

    // Store refresh token hash
    const refreshTokenHash = await this.authTokenService.hashRefreshToken(tokens.refreshToken);
    await this.prisma.device.update({
      where: { id: device.id },
      data: { refreshTokenHash },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
      },
      deviceId: device.id,
    };
  }

  async refreshTokens(refreshToken: string) {
    // Verify refresh token
    const payload = await this.authTokenService.verifyRefreshToken(refreshToken);

    // Find device with this refresh token
    const devices = await this.prisma.device.findMany({
      where: { userId: payload.sub },
    });

    let matchingDevice: (typeof devices)[0] | null = null;
    for (const device of devices) {
      if (device.refreshTokenHash) {
        const isMatch = await this.authTokenService.compareRefreshToken(
          refreshToken,
          device.refreshTokenHash,
        );
        if (isMatch) {
          matchingDevice = device;
          break;
        }
      }
    }

    if (!matchingDevice) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = await this.authTokenService.generateTokens(
      payload.sub,
      payload.phoneNumber,
    );

    // Update refresh token hash
    const newRefreshTokenHash = await this.authTokenService.hashRefreshToken(tokens.refreshToken);
    await this.prisma.device.update({
      where: { id: matchingDevice.id },
      data: { 
        refreshTokenHash: newRefreshTokenHash,
        lastActiveAt: new Date(),
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string, deviceId?: string) {
    if (deviceId) {
      // Logout specific device
      await this.prisma.device.update({
        where: { 
          id: deviceId,
          userId,
        },
        data: { 
          refreshTokenHash: null,
          lastActiveAt: null,
        },
      });
    } else {
      // Logout all devices
      await this.prisma.device.updateMany({
        where: { userId },
        data: { 
          refreshTokenHash: null,
          lastActiveAt: null,
        },
      });
    }

    return { success: true };
  }
}
