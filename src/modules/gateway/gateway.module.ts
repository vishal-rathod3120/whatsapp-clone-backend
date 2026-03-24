import { Global, Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { CallGateway } from './call.gateway';
import { SocketSessionService } from './socket-session.service';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisService } from '../../redis/redis.service';
import { ChatsModule } from '../chats/chats.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../../redis/redis.module';
import { MessagesModule } from '../messages/messages.module';

@Global()
@Module({
  imports: [
    ChatsModule, 
    NotificationsModule, 
    AuthModule, 
    RedisModule,
    forwardRef(() => MessagesModule)
  ],
  providers: [ChatGateway, CallGateway, SocketSessionService],
  exports: [SocketSessionService, ChatGateway],
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
