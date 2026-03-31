import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthTokenService } from './auth-token.service';
import { RedisService } from '../../redis/redis.service';
import { SecurityLogService } from './security-log.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let securityLog: SecurityLogService;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    device: {
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockAuthToken = {
    generateTokens: jest.fn(),
    hashRefreshToken: jest.fn(),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockSecurityLog = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthTokenService, useValue: mockAuthToken },
        { provide: RedisService, useValue: mockRedis },
        { provide: SecurityLogService, useValue: mockSecurityLog },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    securityLog = module.get<SecurityLogService>(SecurityLogService);
    
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictException if user exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: '1' });
      const dto = { phoneNumber: '12345', password: 'pass', displayName: 'User', device: { deviceType: 'WEB' } } as any;
      
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login & lockout', () => {
    const mockUser = {
      id: 'user-1',
      phoneNumber: '12345',
      passwordHash: 'hashed-pass',
      failedLoginAttempts: 0,
      lockedUntil: null,
      displayName: 'Test User',
    };

    it('should throw UnauthorizedException if account is locked', async () => {
      const lockedUser = { ...mockUser, lockedUntil: new Date(Date.now() + 10000) };
      mockPrisma.user.findUnique.mockResolvedValue(lockedUser);

      await expect(service.login({ phoneNumber: '12345', password: 'any', device: {} as any }))
        .rejects.toThrow('Account is locked');
    });

    it('should increment failed attempts and lock after 5 tries', async () => {
      const userWith4Attempts = { ...mockUser, failedLoginAttempts: 4 };
      mockPrisma.user.findUnique.mockResolvedValue(userWith4Attempts);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login({ phoneNumber: '12345', password: 'wrong', device: {} as any }))
        .rejects.toThrow('Account is locked for 15 minutes');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date),
        }),
      });
      expect(mockSecurityLog.log).toHaveBeenCalledWith('LOGIN_FAILED', 'user-1', expect.anything(), expect.anything(), expect.objectContaining({ locked: true }));
    });

    it('should reset attempts on successful login', async () => {
      const userWithAttempts = { ...mockUser, failedLoginAttempts: 2 };
      mockPrisma.user.findUnique.mockResolvedValue(userWithAttempts);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockAuthToken.generateTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
      mockPrisma.device.create.mockResolvedValue({ id: 'dev-1' });

      await service.login({ phoneNumber: '12345', password: 'correct', device: {} as any });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      expect(mockSecurityLog.log).toHaveBeenCalledWith('LOGIN_SUCCESS', 'user-1');
    });
  });
});
