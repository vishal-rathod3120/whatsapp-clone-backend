import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueModule } from '../common/queue/queue.module';
import { CallTimeoutJob } from './call-timeout.job';
import { CleanupPresenceJob } from './cleanup-presence.job';
import { UnreadCounterJob } from './unread-counter.job';
import { MessageProcessor } from './message.processor';
import { ScheduledMessagesJob } from './scheduled-messages.job';
import { MessagesModule } from '../modules/messages/messages.module';
import { MediaModule } from '../modules/media/media.module';
import { GatewayModule } from '../modules/gateway/gateway.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    QueueModule,
    forwardRef(() => MessagesModule),
    MediaModule,
    forwardRef(() => GatewayModule),
  ],
  providers: [CallTimeoutJob, CleanupPresenceJob, UnreadCounterJob, MessageProcessor, ScheduledMessagesJob],
  exports: [CallTimeoutJob, CleanupPresenceJob, UnreadCounterJob, MessageProcessor, ScheduledMessagesJob],
})
export class JobsModule {}
