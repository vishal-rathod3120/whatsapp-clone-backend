import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

export interface SocketAuthPayload {
  userId: string;
  deviceId?: string;
}

export function createSocketAuthMiddleware(jwtService: JwtService) {
  return (socket: Socket, next: (err?: Error) => void): void => {
    try {
      const token = socket.handshake.auth.token as string;
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const payload = jwtService.verify(token) as SocketAuthPayload;
      
      socket.data.userId = payload.userId;
      socket.data.deviceId = payload.deviceId;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  };
}
