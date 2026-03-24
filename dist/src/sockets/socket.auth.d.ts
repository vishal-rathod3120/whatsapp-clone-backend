import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
export interface SocketAuthPayload {
    userId: string;
    deviceId?: string;
}
export declare function createSocketAuthMiddleware(jwtService: JwtService): (socket: Socket, next: (err?: Error) => void) => void;
