import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FcmProvider } from './providers/fcm.provider';
import { ApnsProvider } from './providers/apns.provider';

@Module({
  providers: [NotificationsService, FcmProvider, ApnsProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
