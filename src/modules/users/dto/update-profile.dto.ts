import { IsString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  aboutText?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
