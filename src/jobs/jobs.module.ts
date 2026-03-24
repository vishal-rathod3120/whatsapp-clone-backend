import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CallTimeoutJob } from './call-timeout.job';
import { CleanupPresenceJob } from './cleanup-presence.job';
import { UnreadCounterJob } from './unread-counter.job';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [CallTimeoutJob, CleanupPresenceJob, UnreadCounterJob],
  exports: [CallTimeoutJob, CleanupPresenceJob, UnreadCounterJob],
})
export class JobsModule {}
