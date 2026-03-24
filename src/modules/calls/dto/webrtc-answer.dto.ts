import { IsString, IsUUID } from 'class-validator';

export class WebrtcAnswerDto {
  @IsUUID()
  callId: string;

  @IsString()
  answer: string;
}
