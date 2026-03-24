import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmProvider {
  private readonly logger = new Logger(FcmProvider.name);

  async sendPushNotification(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!admin.apps.length) return;
    try {
      const payload: any = {
        token: deviceToken,
        data,
        android: { priority: 'high' }
      };
      
      if (title && body) {
        payload.notification = { title, body };
      }
      
      await admin.messaging().send(payload);
    } catch (e) {
      this.logger.error(`FCM failed: ${e.message}`);
    }
  }

  async sendMulticast(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!admin.apps.length || !deviceTokens.length) return;
    try {
      const payload: any = {
        tokens: deviceTokens,
        data,
        android: { priority: 'high' }
      };

      if (title && body) {
        payload.notification = { title, body };
      }

      await admin.messaging().sendEachForMulticast(payload);
    } catch (e) {
      this.logger.error(`FCM Multicast failed: ${e.message}`);
    }
  }
}
