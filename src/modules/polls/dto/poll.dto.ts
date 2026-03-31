import { IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsBoolean, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreatePollDto {
  @IsUUID()
  chatId: string;

  @IsString()
  question: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'Poll must have at least 2 options' })
  @ArrayMaxSize(12, { message: 'Poll can have at most 12 options' })
  @IsString({ each: true })
  options: string[];

  @IsOptional()
  @IsBoolean()
  isMultiple?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class VotePollDto {
  @IsArray()
  @IsString({ each: true })
  optionIds: string[];
}
