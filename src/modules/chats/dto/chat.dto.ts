import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDirectChatDto {
  @IsString()
  targetUserId: string;
}

export class MarkChatReadDto {
  @IsString()
  @IsOptional()
  lastReadMessageId?: string;
}

export class GetChatsQueryDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsString()
  @IsOptional()
  cursor?: string;
}
