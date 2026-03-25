import { IsString, IsOptional, IsNotEmpty, IsEnum, IsPhoneNumber, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceType } from '../../../common/enums';

export class DeviceDto {
  @IsEnum(DeviceType)
  deviceType: DeviceType;

  @IsString()
  @IsOptional()
  deviceName?: string;

  @IsString()
  @IsOptional()
  pushToken?: string;
}

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

  @IsObject()
  @ValidateNested()
  @Type(() => DeviceDto)
  device: DeviceDto;
}

export class LoginDto {
  @IsPhoneNumber()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsObject()
  @ValidateNested()
  @Type(() => DeviceDto)
  device: DeviceDto;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LogoutDto {
  @IsString()
  @IsOptional()
  deviceId?: string;
}
