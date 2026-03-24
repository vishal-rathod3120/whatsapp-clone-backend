export class ChatDetailResponse {
  id: string;
  type: string;
  title?: string;
  avatarUrl?: string;
  createdById: string;
  createdAt: Date;
  members: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    role: string;
  }[];

  constructor(chat: any) {
    this.id = chat.id;
    this.type = chat.type;
    this.title = chat.title;
    this.avatarUrl = chat.avatarUrl;
    this.createdById = chat.createdById;
    this.createdAt = chat.createdAt;
    this.members = chat.members?.map((member: any) => ({
      userId: member.userId,
      displayName: member.user?.displayName,
      avatarUrl: member.user?.avatarUrl,
      role: member.role,
    })) || [];
  }
}
