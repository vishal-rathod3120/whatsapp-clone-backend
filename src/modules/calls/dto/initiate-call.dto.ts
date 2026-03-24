import { IsEnum, IsString, IsUUID } from 'class-validator';
import { CallType } from '../../../common/enums';

export class InitiateCallDto {
  @IsUUID()
  chatId: string;

  @IsEnum(CallType)
  type: CallType;
}
