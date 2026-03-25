import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { FcmProvider } from './providers/fcm.provider';
import { ApnsProvider } from './providers/apns.provider';
import * as admin from 'firebase-admin';
import * as webPush from 'web-push';

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

    const vapidPublic = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivate = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const vapidEmail = this.configService.get<string>('VAPID_EMAIL', 'mailto:example@yourdomain.com');

    if (vapidPublic && vapidPrivate) {
      webPush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);
      this.logger.log('Web Push (VAPID) initialized');
    } else {
      this.logger.warn('VAPID keys missing. Web Push will be mocked.');
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
        deviceType: { in: ['ANDROID', 'IOS', 'WEB'] },
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
    if (deviceType === 'WEB') {
      try {
        const sub = JSON.parse(token);
        await webPush.sendNotification(sub, JSON.stringify({
          title: 'New Message',
          body: 'You have a new message',
          data,
          silent: true
        }));
      } catch (err) {
        this.logger.error(`Failed to send Web Push silent: ${err.message}`);
      }
      return;
    }

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
    if (deviceType === 'WEB') {
        try {
            const sub = JSON.parse(token);
            await webPush.sendNotification(sub, JSON.stringify(payload));
            this.logger.log(`Web Push sent successfully`);
        } catch (err) {
            this.logger.error(`Web Push failed: ${err.message}`);
        }
        return;
    }

    if (!admin.apps.length) {
      this.logger.debug(`[Mock Push] to ${token}: ${payload.title}`);
      return;
    }

    if (deviceType === 'ANDROID') {
      await this.fcmProvider.sendPushNotification(token, payload.title, payload.body, payload.data);
    } else if (deviceType === 'IOS') {
      await this.apnsProvider.sendPushNotification(token, payload.title, payload.body, payload.data);
    }
  }
}
