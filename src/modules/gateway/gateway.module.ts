import { Global, Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { CallGateway } from './call.gateway';
import { SocketSessionService } from './socket-session.service';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisService } from '../../redis/redis.service';

import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [AuthModule],
  providers: [ChatGateway, CallGateway, SocketSessionService],
  exports: [SocketSessionService],
})
export class GatewayModule {
  private readonly redisIoAdapter: RedisIoAdapter;

  constructor(private readonly redisService: RedisService) {
    this.redisIoAdapter = new RedisIoAdapter(redisService);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    return this.redisIoAdapter.createIOServer(port, options);
  }
}

class RedisIoAdapter extends IoAdapter {
  private readonly redisService: RedisService;

  constructor(redisService: RedisService) {
    super();
    this.redisService = redisService;
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    const pubClient = this.redisService.getClient();
    const subClient = pubClient.duplicate();
    server.adapter(createAdapter(pubClient, subClient));
    return server;
  }
}
