import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export interface PushNotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    silent?: boolean;
}
export declare class NotificationsService {
    private prisma;
    private configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    sendPushNotification(userId: string, payload: PushNotificationPayload): Promise<void>;
    sendSilentPushNotification(userId: string, data: Record<string, string>): Promise<void>;
    private sendSilentToDevice;
    private sendToDevice;
}
