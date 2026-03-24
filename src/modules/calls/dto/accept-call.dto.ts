import { IsString, IsUUID } from 'class-validator';

export class AcceptCallDto {
  @IsUUID()
  callId: string;
}
