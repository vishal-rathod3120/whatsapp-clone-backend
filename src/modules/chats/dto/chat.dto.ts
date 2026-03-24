import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ChatMemberRole } from '../../../common/enums';

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

export class CreateGroupChatDto {
  @IsString()
  title: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  memberUserIds: string[];

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class AddMembersDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  userIds: string[];
}

export class UpdateMemberRoleDto {
  @IsEnum(ChatMemberRole)
  role: ChatMemberRole;
}

export class UpdateGroupDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
