import { DeviceType } from '../../../common/enums';
export declare class DeviceDto {
    deviceType: DeviceType;
    deviceName?: string;
    pushToken?: string;
}
export declare class RegisterDto {
    displayName: string;
    phoneNumber?: string;
    email?: string;
    password: string;
    device: DeviceDto;
}
export declare class LoginDto {
    phoneNumber: string;
    password: string;
    device: DeviceDto;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class LogoutDto {
    deviceId?: string;
}
