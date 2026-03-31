import { IsString, IsInt, IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class PreKeyDto {
  @IsInt()
  keyId: number;

  @IsString()
  publicKey: string;
}

export class SignedPreKeyDto extends PreKeyDto {
  @IsString()
  signature: string;
}

export class SubmitPrekeysDto {
  @IsInt()
  registrationId: number;

  @IsString()
  identityKey: string;

  @ValidateNested()
  @Type(() => SignedPreKeyDto)
  signedPreKey: SignedPreKeyDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreKeyDto)
  oneTimePreKeys: PreKeyDto[];
}

export class EncryptedMessageDto {
  @IsString()
  ciphertext: string;
  
  @IsString()
  @IsOptional()
  encryptionType?: string; // e.g. 'signal'
}
