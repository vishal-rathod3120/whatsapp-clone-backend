import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { S3Storage } from './storage/s3.storage';

@Module({
  controllers: [MediaController],
  providers: [MediaService, S3Storage],
  exports: [MediaService],
})
export class MediaModule {}
