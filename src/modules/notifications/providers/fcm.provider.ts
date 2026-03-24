import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FcmProvider {
  private readonly logger = new Logger(FcmProvider.name);

  async sendPushNotification(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    // TODO: Implement FCM integration using firebase-admin
    this.logger.log(`Sending FCM notification to ${deviceToken}`);
  }

  async sendMulticast(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    this.logger.log(`Sending FCM multicast to ${deviceTokens.length} devices`);
  }
}
