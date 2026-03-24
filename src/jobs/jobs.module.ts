import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueModule } from '../common/queue/queue.module';
import { CallTimeoutJob } from './call-timeout.job';
import { CleanupPresenceJob } from './cleanup-presence.job';
import { UnreadCounterJob } from './unread-counter.job';
import { MessageReceiptWorker } from './message-receipt.worker';

@Module({
  imports: [ScheduleModule.forRoot(), QueueModule],
  providers: [CallTimeoutJob, CleanupPresenceJob, UnreadCounterJob, MessageReceiptWorker],
  exports: [CallTimeoutJob, CleanupPresenceJob, UnreadCounterJob, MessageReceiptWorker],
})
export class JobsModule {}
