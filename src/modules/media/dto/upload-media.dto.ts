import { IsEnum } from 'class-validator';
import { MessageType } from '../../../common/enums';

export class UploadMediaDto {
  @IsEnum(MessageType)
  type: MessageType;
}
