import { MessageResponse } from './message.response';

export class PaginatedMessagesResponse {
  items: MessageResponse[];
  nextCursor: string | null;

  constructor(messages: any[], nextCursor: string | null = null) {
    this.items = messages.map((m) => new MessageResponse(m));
    this.nextCursor = nextCursor;
  }
}
