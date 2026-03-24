import { IsString, IsUUID } from 'class-validator';

export class RejectCallDto {
  @IsUUID()
  callId: string;
}
