import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { FcmProvider } from './providers/fcm.provider';
import { ApnsProvider } from './providers/apns.provider';
import * as admin from 'firebase-admin';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  silent?: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private fcmProvider: FcmProvider,
    private apnsProvider: ApnsProvider,
  ) {
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        this.logger.log('Firebase Admin SDK initialized');
      } catch (error) {
        this.logger.warn(`Failed to initialize Firebase Admin: ${error.message}. Push notifications will be mocked.`);
      }
    }
  }

  async sendPushNotification(userId: string, payload: PushNotificationPayload): Promise<void> {
    // Get user's devices with push tokens
    const devices = await this.prisma.device.findMany({
      where: {
        userId,
        pushToken: { not: null },
      },
    });

    // Send notification to each device
    for (const device of devices) {
      if (device.pushToken) {
        await this.sendToDevice(device.pushToken, payload, device.deviceType);
      }
    }
  }

  async sendSilentPushNotification(userId: string, data: Record<string, string>): Promise<void> {
    // Get user's mobile devices with push tokens
    const devices = await this.prisma.device.findMany({
      where: {
        userId,
        pushToken: { not: null },
        deviceType: { in: ['ANDROID', 'IOS'] },
      },
    });

    // Send silent notification to each device for background sync
    for (const device of devices) {
      if (device.pushToken) {
        await this.sendSilentToDevice(device.pushToken, data, device.deviceType);
      }
    }
  }

  private async sendSilentToDevice(
    token: string,
    data: Record<string, string>,
    deviceType: string,
  ): Promise<void> {
    if (!admin.apps.length) {
      this.logger.debug(`[Mock SILENT Push] to ${token}`);
      return;
    }

    if (deviceType === 'ANDROID') {
      await this.fcmProvider.sendPushNotification(token, '', '', data);
    } else if (deviceType === 'IOS') {
      await this.apnsProvider.sendPushNotification(token, '', '', data);
    }
  }

  private async sendToDevice(
    token: string,
    payload: PushNotificationPayload,
    deviceType: string,
  ): Promise<void> {
    if (!admin.apps.length) {
      this.logger.debug(`[Mock Push] to ${token}: ${payload.title}`);
      return;
    }

    if (deviceType === 'ANDROID') {
      await this.fcmProvider.sendPushNotification(token, payload.title, payload.body, payload.data);
    } else if (deviceType === 'IOS') {
      await this.apnsProvider.sendPushNotification(token, payload.title, payload.body, payload.data);
    } else if (deviceType === 'WEB') {
      this.logger.debug(`Sending Web Push to ${token}`);
    }
  }
}
