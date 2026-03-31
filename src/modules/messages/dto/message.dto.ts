import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '../../../common/enums';

export class SendMessageDto {
  @IsString()
  clientTempId: string;

  @IsEnum(MessageType)
  type: MessageType;

  @IsString()
  @IsOptional()
  textContent?: string;

  @IsString()
  @IsOptional()
  attachmentId?: string;

  @IsString()
  @IsOptional()
  replyToMessageId?: string;

  @IsOptional()
  isEncrypted?: boolean;

  @IsString()
  @IsOptional()
  encryptionType?: string;
}

export class EditMessageDto {
  @IsString()
  textContent: string;
}

export class GetMessagesQueryDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 30;

  @IsString()
  @IsOptional()
  cursor?: string;
}

export class DeliveredDto {
  @IsString()
  messageId: string;

  @IsString()
  chatId: string;
}

export class SeenDto {
  @IsString()
  chatId: string;

  @IsString()
  messageId: string;
}

export class ScheduleMessageDto {
  @IsString()
  chatId: string;

  @IsEnum(MessageType)
  type: MessageType;

  @Type(() => Date)
  scheduledAt: Date;

  @IsString()
  @IsOptional()
  textContent?: string;

  @IsString()
  @IsOptional()
  attachmentId?: string;
}
