export declare class CallResponse {
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
    constructor(call: any);
}
