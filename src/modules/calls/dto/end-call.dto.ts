import { IsString, IsUUID, IsOptional } from 'class-validator';

export class EndCallDto {
  @IsUUID()
  callId: string;

  @IsString()
  @IsOptional()
  endReason?: string;
}
