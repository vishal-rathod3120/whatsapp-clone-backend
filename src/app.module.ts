import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ChatsModule } from './modules/chats/chats.module';
import { MessagesModule } from './modules/messages/messages.module';
import { MediaModule } from './modules/media/media.module';
import { CallsModule } from './modules/calls/calls.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PresenceModule } from './modules/presence/presence.module';
import { JobsModule } from './jobs/jobs.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { PushModule } from './modules/push/push.module';
import { StatusModule } from './modules/status/status.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { PollsModule } from './modules/polls/polls.module';
import { E2EEModule } from './modules/e2ee/e2ee.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { SearchModule } from './modules/search/search.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { appConfig, databaseConfig, jwtConfig, redisConfig, storageConfig } from './config';

@Module({
  imports: [
    PrometheusModule.register(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, storageConfig],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
        },
      }),
      inject: [ConfigService],
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    RedisModule,
    JobsModule,
    PresenceModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ChatsModule,
    MessagesModule,
    MediaModule,
    CallsModule,
    GatewayModule,
    NotificationsModule,
    PushModule,
    StatusModule,
    ContactsModule,
    PollsModule,
    E2EEModule,
    CommunitiesModule,
    SearchModule,
    MonitoringModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
