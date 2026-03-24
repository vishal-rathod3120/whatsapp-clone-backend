import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthTokenService } from '../../modules/auth/auth-token.service';
import { Socket } from 'socket.io';

@Injectable()
export class SocketAuthGuard implements CanActivate {
  constructor(private authTokenService: AuthTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromSocket(client);

    if (!token) {
      client.disconnect();
      return false;
    }

    try {
      const payload = await this.authTokenService.verifyAccessToken(token);
      (client as any).user = payload;
      return true;
    } catch {
      client.disconnect();
      return false;
    }
  }

  private extractTokenFromSocket(client: Socket): string | undefined {
    return (
      client.handshake.auth.token ||
      client.handshake.query.token ||
      client.handshake.headers.authorization?.replace('Bearer ', '')
    ) as string | undefined;
  }
}
