import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SignedPreKeyDto, PreKeyDto } from './dto';

@Injectable()
export class PrekeyStoreService {
  constructor(private prisma: PrismaService) {}

  /**
   * Store initial prekeys when device registers
   */
  async storeInitialPrekeys(
    deviceId: string,
    identityKey: string,
    registrationId: number,
    signedPreKey: SignedPreKeyDto,
    oneTimePreKeys: PreKeyDto[]
  ): Promise<void> {
    await this.prisma.$transaction([
      // Update device with identity key and registration ID
      this.prisma.device.update({
        where: { id: deviceId },
        data: {
          publicKey: identityKey,
          registrationId,
        },
      }),
      
      // Store signed prekey
      this.prisma.signedPreKey.create({
        data: {
          deviceId,
          keyId: signedPreKey.keyId,
          publicKey: signedPreKey.publicKey,
          signature: signedPreKey.signature,
        },
      }),
      
      // Store one-time prekeys
      ...oneTimePreKeys.map(key => 
        this.prisma.oneTimePreKey.create({
          data: {
            deviceId,
            keyId: key.keyId,
            publicKey: key.publicKey,
            isUsed: false,
          },
        })
      ),
    ]);
  }

  /**
   * Get a prekey bundle for a user (one-time use)
   * Returns the signed prekey and one unused one-time prekey
   */
  async getPrekeyBundle(deviceId: string): Promise<{
    registrationId: number;
    deviceId: string;
    identityKey: string;
    signedPreKey: {
      keyId: number;
      publicKey: string;
      signature: string;
    };
    preKey: {
      keyId: number;
      publicKey: string;
    } | null;
  } | null> {
    // Get device with latest signed prekey
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      select: {
        id: true,
        publicKey: true,
        registrationId: true,
        signedPreKeys: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        oneTimePreKeys: {
          where: { isUsed: false },
          take: 1,
        },
      },
    });

    if (!device || !device.publicKey || !device.registrationId) {
      return null;
    }

    const signedPreKey = device.signedPreKeys[0];
    if (!signedPreKey) {
      return null;
    }

    // Mark one-time prekey as used if available
    let preKey: { keyId: number; publicKey: string } | null = null;
    if (device.oneTimePreKeys.length > 0) {
      const oneTimePreKey = device.oneTimePreKeys[0];
      preKey = {
        keyId: oneTimePreKey.keyId,
        publicKey: oneTimePreKey.publicKey,
      };
      
      // Mark as used asynchronously (don't block response)
      this.prisma.oneTimePreKey.update({
        where: { id: oneTimePreKey.id },
        data: { isUsed: true, usedAt: new Date() },
      }).catch(err => console.error('Failed to mark prekey as used:', err));
    }

    return {
      registrationId: device.registrationId,
      deviceId: device.id,
      identityKey: device.publicKey,
      signedPreKey: {
        keyId: signedPreKey.keyId,
        publicKey: signedPreKey.publicKey,
        signature: signedPreKey.signature,
      },
      preKey,
    };
  }

  /**
   * Replenish one-time prekeys when count is low
   */
  async replenishPrekeys(
    deviceId: string,
    newPreKeys: PreKeyDto[]
  ): Promise<{ added: number }> {
    const currentCount = await this.prisma.oneTimePreKey.count({
      where: { deviceId, isUsed: false },
    });

    // Only add if count is low
    if (currentCount < 10) {
      await this.prisma.oneTimePreKey.createMany({
        data: newPreKeys.map(key => ({
          deviceId,
          keyId: key.keyId,
          publicKey: key.publicKey,
          isUsed: false,
        })),
      });

      return { added: newPreKeys.length };
    }

    return { added: 0 };
  }

  /**
   * Rotate signed prekey periodically
   */
  async rotateSignedPrekey(
    deviceId: string,
    newSignedPreKey: SignedPreKeyDto
  ): Promise<void> {
    // Add new signed prekey
    await this.prisma.signedPreKey.create({
      data: {
        deviceId,
        keyId: newSignedPreKey.keyId,
        publicKey: newSignedPreKey.publicKey,
        signature: newSignedPreKey.signature,
      },
    });

    // Delete old signed prekeys (keep last 2)
    const oldKeys = await this.prisma.signedPreKey.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      skip: 2,
      select: { id: true },
    });

    if (oldKeys.length > 0) {
      await this.prisma.signedPreKey.deleteMany({
        where: { id: { in: oldKeys.map(k => k.id) } },
      });
    }
  }

  /**
   * Get remaining one-time prekey count
   */
  async getPrekeyCount(deviceId: string): Promise<number> {
    return this.prisma.oneTimePreKey.count({
      where: { deviceId, isUsed: false },
    });
  }

  /**
   * Get user's primary device or any available device
   */
  async getUserDevice(userId: string, deviceId?: string): Promise<string | null> {
    if (deviceId) {
      const device = await this.prisma.device.findFirst({
        where: { id: deviceId, userId, isRevoked: false },
      });
      return device?.id || null;
    }

    // Get most recently active device
    const device = await this.prisma.device.findFirst({
      where: { userId, isRevoked: false },
      orderBy: { lastActiveAt: 'desc' },
    });

    return device?.id || null;
  }

  /**
   * Store Double Ratchet session
   */
  async storeSession(
    deviceId: string,
    remoteUserId: string,
    remoteDeviceId: string,
    sessionState: string
  ): Promise<void> {
    await this.prisma.session.upsert({
      where: {
        deviceId_remoteUserId_remoteDeviceId: {
          deviceId,
          remoteUserId,
          remoteDeviceId,
        },
      },
      update: {
        sessionState,
        updatedAt: new Date(),
      },
      create: {
        deviceId,
        remoteUserId,
        remoteDeviceId,
        sessionState,
      },
    });
  }

  /**
   * Get Double Ratchet session
   */
  async getSession(
    deviceId: string,
    remoteUserId: string,
    remoteDeviceId: string
  ): Promise<string | null> {
    const session = await this.prisma.session.findUnique({
      where: {
        deviceId_remoteUserId_remoteDeviceId: {
          deviceId,
          remoteUserId,
          remoteDeviceId,
        },
      },
    });

    return session?.sessionState || null;
  }

  /**
   * Delete session
   */
  async deleteSession(
    deviceId: string,
    remoteUserId: string,
    remoteDeviceId: string
  ): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        deviceId,
        remoteUserId,
        remoteDeviceId,
      },
    });
  }

  /**
   * Get all sessions for a device
   */
  async getAllSessions(deviceId: string): Promise<{
    sessions: Array<{
      remoteUserId: string;
      remoteDeviceId: string;
      updatedAt: Date;
    }>;
  }> {
    const sessions = await this.prisma.session.findMany({
      where: { deviceId },
      select: {
        remoteUserId: true,
        remoteDeviceId: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return { sessions };
  }
}
