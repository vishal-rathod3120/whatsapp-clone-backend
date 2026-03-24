import { Injectable, Logger } from '@nestjs/common';
import { FcmProvider } from './providers/fcm.provider';
import { ApnsProvider } from './providers/apns.provider';
import { DeviceType } from '@prisma/client';

export interface PushNotificationPayload {
  deviceToken: string;
  deviceType: DeviceType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly fcmProvider: FcmProvider,
    private readonly apnsProvider: ApnsProvider,
  ) {}

  async sendNotification(payload: PushNotificationPayload): Promise<void> {
    try {
      switch (payload.deviceType) {
        case DeviceType.ANDROID:
          await this.fcmProvider.sendPushNotification(
            payload.deviceToken,
            payload.title,
            payload.body,
            payload.data,
          );
          break;
        case DeviceType.IOS:
          await this.apnsProvider.sendPushNotification(
            payload.deviceToken,
            payload.title,
            payload.body,
            payload.data,
          );
          break;
        default:
          this.logger.warn(`Push notifications not supported for ${payload.deviceType}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
    }
  }

  async sendMulticast(
    payloads: PushNotificationPayload[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const androidTokens = payloads
      .filter((p) => p.deviceType === DeviceType.ANDROID)
      .map((p) => p.deviceToken);
    
    const iosTokens = payloads
      .filter((p) => p.deviceType === DeviceType.IOS)
      .map((p) => p.deviceToken);

    if (androidTokens.length > 0) {
      await this.fcmProvider.sendMulticast(androidTokens, title, body, data);
    }

    if (iosTokens.length > 0) {
      await this.apnsProvider.sendMulticast(iosTokens, title, body, data);
    }
  }

  async notifyNewMessage(
    deviceToken: string,
    deviceType: DeviceType,
    senderName: string,
    messagePreview: string,
    chatId: string,
    messageId: string,
  ): Promise<void> {
    await this.sendNotification({
      deviceToken,
      deviceType,
      title: senderName,
      body: messagePreview || 'New message',
      data: {
        chatId,
        messageId,
        type: 'new_message',
      },
    });
  }

  async notifyMissedCall(
    deviceToken: string,
    deviceType: DeviceType,
    callerName: string,
    callId: string,
    chatId: string,
  ): Promise<void> {
    await this.sendNotification({
      deviceToken,
      deviceType,
      title: 'Missed call',
      body: `Call from ${callerName}`,
      data: {
        callId,
        chatId,
        type: 'missed_call',
      },
    });
  }
}
