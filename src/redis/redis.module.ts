import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { PresenceRepository } from './presence.repository';

@Global()
@Module({
  providers: [RedisService, PresenceRepository],
  exports: [RedisService, PresenceRepository],
})
export class RedisModule {}
