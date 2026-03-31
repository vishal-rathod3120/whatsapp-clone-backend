import { IsArray, ArrayMaxSize, IsString, Length } from 'class-validator';

export class DiscoverContactsDto {
  @IsArray()
  @ArrayMaxSize(500, { message: 'Maximum 500 contacts per sync' })
  @IsString({ each: true })
  @Length(16, 16, { each: true, message: 'Each hash must be 16 characters' })
  hashes: string[];
}
