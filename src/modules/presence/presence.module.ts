import { Module } from '@nestjs/common';
import { PresenceGateway } from './presence.gateway';
import { PresenceService } from './presence.service';
import { RedisModule } from '../../redis/redis.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [RedisModule, GatewayModule],
  providers: [PresenceGateway, PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
