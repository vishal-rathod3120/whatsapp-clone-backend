import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { JwtPayload } from '../../modules/auth/types/jwt-payload.type';

export const SocketUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | any => {
    const client = ctx.switchToWs().getClient<Socket>();
    const user = (client as any).user as JwtPayload;

    return data ? user?.[data] : user;
  },
);
