import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketSessionService } from './socket-session.service';
import { PresenceRepository } from '../../redis/presence.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CallType, CallStatus } from '../../common/enums';

interface CallPayload {
  callId: string;
  chatId: string;
  type: CallType;
}

interface WebRTCPayload {
  callId: string;
  sdp?: string;
  candidate?: RTCIceCandidate;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class CallGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private socketSessionService: SocketSessionService,
    private presenceRepository: PresenceRepository,
    private prisma: PrismaService,
  ) {}

  @SubscribeMessage('call:initiate')
  async handleCallInitiate(socket: Socket, payload: { chatId: string; type: CallType }) {
    try {
      const userId = this.socketSessionService.getUserIdBySocket(socket.id);
      if (!userId) return;

      // Create call record
      const call = await this.prisma.call.create({
        data: {
          chatId: payload.chatId,
          callerId: userId,
          type: payload.type,
          status: CallStatus.RINGING,
        },
        include: {
          chat: {
            include: {
              members: {
                where: { leftAt: null },
                include: {
                  user: {
                    select: {
                      id: true,
                      displayName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Get callee
      const callee = call.chat.members.find((m) => m.userId !== userId);
      
      if (callee) {
        // Notify callee
        this.server.to(`user:${callee.userId}`).emit('call:incoming', {
          callId: call.id,
          chatId: payload.chatId,
          caller: {
            id: userId,
            displayName: call.chat.members.find((m) => m.userId === userId)?.user.displayName,
            avatarUrl: call.chat.members.find((m) => m.userId === userId)?.user.avatarUrl,
          },
          type: payload.type,
        });

        // Set call timeout
        setTimeout(async () => {
          const currentCall = await this.prisma.call.findUnique({
            where: { id: call.id },
          });
          
          if (currentCall?.status === CallStatus.RINGING) {
            await this.prisma.call.update({
              where: { id: call.id },
              data: {
                status: CallStatus.MISSED,
                endReason: 'timeout',
              },
            });

            this.server.to(`user:${userId}`).emit('call:timeout', {
              callId: call.id,
            });
          }
        }, 30000);
      }

      // Acknowledge to caller
      socket.emit('call:initiated', { callId: call.id });
    } catch (error) {
      console.error('Call initiate error:', error);
      socket.emit('call:error', { message: 'Failed to initiate call' });
    }
  }

  @SubscribeMessage('call:accept')
  async handleCallAccept(socket: Socket, payload: { callId: string }) {
    try {
      const userId = this.socketSessionService.getUserIdBySocket(socket.id);
      if (!userId) return;

      const call = await this.prisma.call.update({
        where: { id: payload.callId },
        data: {
          status: CallStatus.ACCEPTED,
          answeredAt: new Date(),
        },
        include: {
          caller: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });

      // Create participant entry
      await this.prisma.callParticipant.create({
        data: {
          callId: payload.callId,
          userId,
          joinedAt: new Date(),
        },
      });

      // Notify caller
      this.server.to(`user:${call.callerId}`).emit('call:accepted', {
        callId: payload.callId,
        acceptedBy: userId,
      });

      socket.emit('call:connected', { callId: payload.callId });
    } catch (error) {
      console.error('Call accept error:', error);
      socket.emit('call:error', { message: 'Failed to accept call' });
    }
  }

  @SubscribeMessage('call:reject')
  async handleCallReject(socket: Socket, payload: { callId: string; reason?: string }) {
    try {
      const userId = this.socketSessionService.getUserIdBySocket(socket.id);
      if (!userId) return;

      const call = await this.prisma.call.update({
        where: { id: payload.callId },
        data: {
          status: CallStatus.REJECTED,
          endReason: payload.reason || 'rejected',
        },
      });

      // Notify caller
      this.server.to(`user:${call.callerId}`).emit('call:rejected', {
        callId: payload.callId,
        rejectedBy: userId,
        reason: payload.reason,
      });
    } catch (error) {
      console.error('Call reject error:', error);
    }
  }

  @SubscribeMessage('call:end')
  async handleCallEnd(socket: Socket, payload: { callId: string; reason?: string }) {
    try {
      const userId = this.socketSessionService.getUserIdBySocket(socket.id);
      if (!userId) return;

      const call = await this.prisma.call.findUnique({
        where: { id: payload.callId },
        include: {
          participants: true,
        },
      });

      if (!call) return;

      // Update call status
      await this.prisma.call.update({
        where: { id: payload.callId },
        data: {
          status: CallStatus.ENDED,
          endReason: payload.reason || 'hangup',
          endedAt: new Date(),
        },
      });

      // Update participant left time
      await this.prisma.callParticipant.updateMany({
        where: {
          callId: payload.callId,
          userId,
          leftAt: null,
        },
        data: {
          leftAt: new Date(),
        },
      });

      // Notify other participants
      call.participants.forEach((p) => {
        if (p.userId !== userId) {
          this.server.to(`user:${p.userId}`).emit('call:ended', {
            callId: payload.callId,
            endedBy: userId,
            reason: payload.reason,
          });
        }
      });
    } catch (error) {
      console.error('Call end error:', error);
    }
  }

  @SubscribeMessage('call:offer')
  handleOffer(socket: Socket, payload: WebRTCPayload) {
    this.forwardSignaling('call:offer', socket, payload);
  }

  @SubscribeMessage('call:answer')
  handleAnswer(socket: Socket, payload: WebRTCPayload) {
    this.forwardSignaling('call:answer', socket, payload);
  }

  @SubscribeMessage('call:ice-candidate')
  handleIceCandidate(socket: Socket, payload: WebRTCPayload) {
    this.forwardSignaling('call:ice-candidate', socket, payload);
  }

  private async forwardSignaling(event: string, socket: Socket, payload: WebRTCPayload) {
    try {
      const userId = this.socketSessionService.getUserIdBySocket(socket.id);
      if (!userId) return;

      const call = await this.prisma.call.findUnique({
        where: { id: payload.callId },
        include: {
          participants: true,
        },
      });

      if (!call) return;

      // Forward to other participants
      call.participants.forEach((p) => {
        if (p.userId !== userId) {
          this.server.to(`user:${p.userId}`).emit(event, {
            callId: payload.callId,
            sdp: payload.sdp,
            candidate: payload.candidate,
            from: userId,
          });
        }
      });
    } catch (error) {
      console.error(`Signaling error (${event}):`, error);
    }
  }
}
