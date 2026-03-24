import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PresenceGateway } from './presence.gateway';
import { PresenceService } from './presence.service';
import { RedisModule } from '../../redis/redis.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [RedisModule, GatewayModule, JwtModule],
  providers: [PresenceGateway, PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
