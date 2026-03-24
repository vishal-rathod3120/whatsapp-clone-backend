export declare class LoginDto {
    phoneNumber: string;
    password: string;
    device: {
        deviceType: string;
        deviceName?: string;
        pushToken?: string;
    };
}
