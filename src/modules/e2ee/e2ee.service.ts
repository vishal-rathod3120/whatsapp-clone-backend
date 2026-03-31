import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrekeyStoreService } from './prekey-store.service';
import { SubmitPrekeysDto, RotateSignedPrekeyDto, ReplenishPrekeysDto } from './dto';

export interface PrekeyBundleResponse {
  registrationId: number;
  deviceId: string;
  identityKey: string;
  signedPreKey: {
    keyId: number;
    publicKey: string;
    signature: string;
  };
  preKey?: {
    keyId: number;
    publicKey: string;
  } | null;
}

@Injectable()
export class E2EEService {
  constructor(
    private prisma: PrismaService,
    private prekeyStore: PrekeyStoreService,
  ) {}

  /**
   * Called by a client device upon E2EE initialization to publish their Identity
   * and initial set of PreKeys to the Server (Key Distribution Center).
   */
  async uploadPrekeys(deviceId: string, userId: string, dto: SubmitPrekeysDto): Promise<void> {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.userId !== userId) {
      throw new NotFoundException('Device not found or does not belong to user');
    }

    await this.prekeyStore.storeInitialPrekeys(
      deviceId,
      dto.identityKey,
      dto.registrationId,
      dto.signedPreKey,
      dto.oneTimePreKeys
    );
  }

  /**
   * Called when Alice wants to message Bob. Alice requests Bob's prekey bundle to start an X3DH session.
   * If `targetDeviceId` is omitted, this theoretically should return bundles for ALL of Bob's devices.
   */
  async getPrekeyBundle(
    userId: string,
    deviceId?: string
  ): Promise<PrekeyBundleResponse[]> {
    const devices = await this.prisma.device.findMany({
      where: {
        userId,
        isRevoked: false,
        ...(deviceId && { id: deviceId }),
      },
    });

    if (devices.length === 0) {
      throw new NotFoundException('No active devices found for user');
    }

    const bundles: PrekeyBundleResponse[] = [];

    for (const device of devices) {
      const bundle = await this.prekeyStore.getPrekeyBundle(device.id);
      if (bundle) {
        bundles.push(bundle);
      }
    }

    if (bundles.length === 0) {
      throw new BadRequestException('E2EE not initialized on target devices');
    }

    return bundles;
  }

  async getAllSessions(deviceId: string) {
    return this.prekeyStore.getAllSessions(deviceId);
  }

  async getSession(deviceId: string, remoteUserId: string, remoteDeviceId: string) {
    const state = await this.prekeyStore.getSession(deviceId, remoteUserId, remoteDeviceId);
    return { sessionState: state };
  }

  async storeSession(deviceId: string, remoteUserId: string, remoteDeviceId: string, sessionState: string) {
    await this.prekeyStore.storeSession(deviceId, remoteUserId, remoteDeviceId, sessionState);
    return { success: true };
  }

  async deleteSession(deviceId: string, remoteUserId: string, remoteDeviceId: string) {
    await this.prekeyStore.deleteSession(deviceId, remoteUserId, remoteDeviceId);
    return { success: true };
  }

  async getPrekeyCount(deviceId: string) {
    const count = await this.prekeyStore.getPrekeyCount(deviceId);
    return { count, needsReplenish: count < 10 };
  }

  async replenishPrekeys(deviceId: string, dto: ReplenishPrekeysDto) {
    return this.prekeyStore.replenishPrekeys(deviceId, dto.oneTimePreKeys);
  }

  async rotateSignedPrekey(deviceId: string, dto: RotateSignedPrekeyDto) {
    await this.prekeyStore.rotateSignedPrekey(deviceId, dto.signedPreKey);
    return { success: true };
  }
}

