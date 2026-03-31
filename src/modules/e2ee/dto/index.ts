import { IsArray, IsBase64, IsInt, IsNotEmpty, IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PreKeyDto {
  @IsInt()
  @IsNotEmpty()
  keyId: number;

  @IsString()
  @IsBase64()
  @IsNotEmpty()
  publicKey: string;
}

export class SignedPreKeyDto extends PreKeyDto {
  @IsString()
  @IsBase64()
  @IsNotEmpty()
  signature: string;
}

export class SubmitPrekeysDto {
  @ValidateNested()
  @Type(() => SignedPreKeyDto)
  signedPreKey: SignedPreKeyDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreKeyDto)
  oneTimePreKeys: PreKeyDto[];

  @IsInt()
  @IsNotEmpty()
  registrationId: number;

  @IsString()
  @IsBase64()
  @IsNotEmpty()
  identityKey: string;
}

export class PrekeyBundleDto {
  @IsInt()
  registrationId: number;

  @IsString()
  deviceId: string;

  @IsString()
  @IsBase64()
  identityKey: string;

  signedPreKey: {
    keyId: number;
    publicKey: string;
    signature: string;
  };

  preKey: {
    keyId: number;
    publicKey: string;
  } | null;
}

export class EncryptedMessageDto {
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsString()
  @IsOptional()
  recipientDeviceId?: string;

  @IsString()
  @IsBase64()
  @IsNotEmpty()
  ciphertext: string;

  @IsString()
  @IsOptional()
  ephemeralKey?: string;

  @IsInt()
  @IsOptional()
  preKeyId?: number;
}

export class SessionDto {
  @IsString()
  @IsNotEmpty()
  remoteUserId: string;

  @IsString()
  @IsNotEmpty()
  remoteDeviceId: string;

  @IsString()
  @IsBase64()
  @IsNotEmpty()
  sessionState: string;
}

export class RotateSignedPrekeyDto {
  @ValidateNested()
  @Type(() => SignedPreKeyDto)
  signedPreKey: SignedPreKeyDto;
}

export class ReplenishPrekeysDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreKeyDto)
  oneTimePreKeys: PreKeyDto[];
}
