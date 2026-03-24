import { IsString, IsUUID } from 'class-validator';

export class WebrtcOfferDto {
  @IsUUID()
  callId: string;

  @IsString()
  offer: string;
}
