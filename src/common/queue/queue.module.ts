import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { MessageQueueService } from './message-queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'message_queue',
    }),
    BullBoardModule.forFeature({
      name: 'message_queue',
      adapter: BullMQAdapter,
    }),
  ],
  providers: [MessageQueueService],
  exports: [BullModule, MessageQueueService],
})
export class QueueModule {}
