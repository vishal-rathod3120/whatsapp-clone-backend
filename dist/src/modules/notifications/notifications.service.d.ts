import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { FcmProvider } from './providers/fcm.provider';
import { ApnsProvider } from './providers/apns.provider';
export interface PushNotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    silent?: boolean;
}
export declare class NotificationsService {
    private prisma;
    private configService;
    private fcmProvider;
    private apnsProvider;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, fcmProvider: FcmProvider, apnsProvider: ApnsProvider);
    sendPushNotification(userId: string, payload: PushNotificationPayload): Promise<void>;
    sendSilentPushNotification(userId: string, data: Record<string, string>): Promise<void>;
    private sendSilentToDevice;
    private sendToDevice;
}
