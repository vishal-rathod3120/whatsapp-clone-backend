import { IsString, MinLength, IsOptional, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchMessagesDto {
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters' })
  q: string;

  @IsOptional()
  @IsUUID()
  chatId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
