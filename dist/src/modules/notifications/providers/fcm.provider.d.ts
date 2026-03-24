export declare class FcmProvider {
    private readonly logger;
    sendPushNotification(deviceToken: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
    sendMulticast(deviceTokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void>;
}
