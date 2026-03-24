import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class ApnsProvider {
  private readonly logger = new Logger(ApnsProvider.name);

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
        apns: {
          payload: { aps: { 'content-available': 1 } }
        }
      };

      if (title && body) {
        payload.notification = { title, body };
      }

      await admin.messaging().send(payload);
    } catch (e) {
      this.logger.error(`APNS failed: ${e.message}`);
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
        apns: {
          payload: { aps: { 'content-available': 1 } }
        }
      };

      if (title && body) {
        payload.notification = { title, body };
      }

      await admin.messaging().sendEachForMulticast(payload);
    } catch (e) {
      this.logger.error(`APNS Multicast failed: ${e.message}`);
    }
  }
}
