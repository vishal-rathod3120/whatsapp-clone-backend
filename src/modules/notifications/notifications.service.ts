import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  silent?: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

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
    try {
      if (deviceType === 'ANDROID') {
        // Silent push via FCM with data-only payload
        console.log(`Sending silent FCM notification to ${token}:`, data);
        // await admin.messaging().send({
        //   token,
        //   data,
        //   android: {
        //     priority: 'high',
        //   },
        // });
      } else if (deviceType === 'IOS') {
        // Silent push via APNs with content-available
        console.log(`Sending silent APNs notification to ${token}:`, data);
        // await apnProvider.send({
        //   token,
        //   payload: {
        //     ...data,
        //     'content-available': 1,
        //   },
        //   priority: 5,
        // });
      }
    } catch (error) {
      console.error('Failed to send silent push notification:', error);
    }
  }

  private async sendToDevice(
    token: string,
    payload: PushNotificationPayload,
    deviceType: string,
  ): Promise<void> {
    try {
      // In production, use Firebase Admin SDK for FCM or APNs for iOS
      // This is a simplified implementation
      if (deviceType === 'ANDROID' || deviceType === 'IOS') {
        // Send via FCM
        console.log(`Sending FCM notification to ${token}:`, payload);
        // await admin.messaging().send({
        //   token,
        //   notification: {
        //     title: payload.title,
        //     body: payload.body,
        //   },
        //   data: payload.data,
        // });
      } else if (deviceType === 'WEB') {
        // Send Web Push
        console.log(`Sending Web Push notification to ${token}:`, payload);
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }
}
