import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { S3Storage } from './storage/s3.storage';
import { LocalStorage } from './storage/local.storage';
import { StorageInterface } from './storage/storage.interface';

const storageProvider = {
  provide: 'StorageInterface',
  useFactory: (configService: ConfigService) => {
    const storageType = configService.get('storage.type', 'local');
    if (storageType === 's3') {
      return new S3Storage(configService);
    }
    return new LocalStorage(configService);
  },
  inject: [ConfigService],
};

@Module({
  controllers: [MediaController],
  providers: [MediaService, storageProvider, S3Storage, LocalStorage],
  exports: [MediaService],
})
export class MediaModule {}
