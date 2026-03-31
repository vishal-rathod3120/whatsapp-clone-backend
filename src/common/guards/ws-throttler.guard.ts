import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    contextProps: any,
    limit: number,
    ttl: number,
    throttler: any,
  ): Promise<boolean> {
    const client = contextProps.switchToWs().getClient();
    // Socket.io usually maps the IP Address here
    const ip = client.handshake?.address || client.conn?.remoteAddress || 'unknown-ip';

    const key = this.generateKey(contextProps, ip, throttler.name);
    // In @nestjs/throttler v5, increment expects (key: string, ttl: number, limit: number, blockDuration: number, throttlerName: string)
    // Wait, let's just use the signature from the error (Expected 2 arguments): which means it expects (key: string, ttl: number)
    const { totalHits, timeToExpire } = await this.storageService.increment(
      key,
      ttl
    );

    if (totalHits > limit) {
      throw new WsException(`Rate limit exceeded. Too many requests.`);
    }

    return true;
  }
}
