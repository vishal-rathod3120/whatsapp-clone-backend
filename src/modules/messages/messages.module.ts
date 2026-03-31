import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { SearchService } from './search.service';
import { QueueModule } from '../../common/queue/queue.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { MediaModule } from '../media/media.module';
import { E2EEModule } from '../e2ee/e2ee.module';

@Module({
  imports: [QueueModule, PrismaModule, MediaModule, E2EEModule],
  controllers: [MessagesController],
  providers: [MessagesService, SearchService],
  exports: [MessagesService, SearchService],
})
export class MessagesModule {}

