export class ChatListItemResponse {
  id: string;
  type: string;
  title: string;
  avatarUrl?: string;
  lastMessage?: {
    id: string;
    type: string;
    textContent?: string;
    senderId: string;
    createdAt: Date;
  };
  unreadCount: number;
  lastMessageAt?: Date;

  constructor(chat: any, unreadCount: number = 0) {
    this.id = chat.id;
    this.type = chat.type;
    this.title = chat.title;
    this.avatarUrl = chat.avatarUrl;
    this.lastMessage = chat.messages?.[0] ? {
      id: chat.messages[0].id,
      type: chat.messages[0].type,
      textContent: chat.messages[0].textContent,
      senderId: chat.messages[0].senderId,
      createdAt: chat.messages[0].createdAt,
    } : undefined;
    this.unreadCount = unreadCount;
    this.lastMessageAt = chat.lastMessageAt;
  }
}
