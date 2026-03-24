import { DeviceType } from '../../../common/enums';
export declare class RegisterDto {
    displayName: string;
    phoneNumber?: string;
    email?: string;
    password: string;
    deviceType: DeviceType;
    deviceName?: string;
    pushToken?: string;
}
