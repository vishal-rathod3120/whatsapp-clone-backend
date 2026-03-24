export class CallResponse {
  id: string;
  chatId: string;
  callerId: string;
  type: string;
  status: string;
  startedAt?: Date;
  answeredAt?: Date;
  endedAt?: Date;
  endReason?: string;
  createdAt: Date;
  participants: {
    userId: string;
    joinedAt?: Date;
    leftAt?: Date;
  }[];

  constructor(call: any) {
    this.id = call.id;
    this.chatId = call.chatId;
    this.callerId = call.callerId;
    this.type = call.type;
    this.status = call.status;
    this.startedAt = call.startedAt;
    this.answeredAt = call.answeredAt;
    this.endedAt = call.endedAt;
    this.endReason = call.endReason;
    this.createdAt = call.createdAt;
    this.participants = call.participants?.map((p: any) => ({
      userId: p.userId,
      joinedAt: p.joinedAt,
      leftAt: p.leftAt,
    })) || [];
  }
}
