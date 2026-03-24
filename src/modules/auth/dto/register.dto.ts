import { IsString, IsNotEmpty, IsOptional, IsPhoneNumber, IsEnum } from 'class-validator';
import { DeviceType } from '../../../common/enums';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(DeviceType)
  deviceType: DeviceType;

  @IsString()
  @IsOptional()
  deviceName?: string;

  @IsString()
  @IsOptional()
  pushToken?: string;
}
