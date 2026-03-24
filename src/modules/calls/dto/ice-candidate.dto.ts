import { IsString, IsUUID } from 'class-validator';

export class IceCandidateDto {
  @IsUUID()
  callId: string;

  @IsString()
  candidate: string;
}
