import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../modules/auth/types/jwt-payload.type';

@Injectable()
export class ChatMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    const chatId = request.params.chatId;

    if (!user || !chatId) {
      throw new ForbiddenException('Access denied');
    }

    const member = await this.prisma.chatMember.findFirst({
      where: {
        chatId,
        userId: user.sub,
        leftAt: null,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    request['chatMember'] = member;
    return true;
  }
}
