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
export declare class PushService {
    private readonly fcmProvider;
    private readonly apnsProvider;
    private readonly logger;
    constructor(fcmProvider: FcmProvider, apnsProvider: ApnsProvider);
    sendNotification(payload: PushNotificationPayload): Promise<void>;
    sendMulticast(payloads: PushNotificationPayload[], title: string, body: string, data?: Record<string, string>): Promise<void>;
    notifyNewMessage(deviceToken: string, deviceType: DeviceType, senderName: string, messagePreview: string, chatId: string, messageId: string): Promise<void>;
    notifyMissedCall(deviceToken: string, deviceType: DeviceType, callerName: string, callId: string, chatId: string): Promise<void>;
}
