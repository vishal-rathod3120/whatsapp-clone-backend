import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { MediaModule } from '../media/media.module';
import { DisappearingMessagesCron } from './disappearing-messages.cron';

@Module({
  imports: [MediaModule],
  controllers: [ChatsController],
  providers: [ChatsService, DisappearingMessagesCron],
  exports: [ChatsService],
})
export class ChatsModule {}
