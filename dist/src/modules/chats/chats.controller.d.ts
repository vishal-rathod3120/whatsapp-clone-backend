import { ChatsService } from './chats.service';
import { CreateDirectChatDto, MarkChatReadDto, GetChatsQueryDto } from './dto/chat.dto';
export declare class ChatsController {
    private chatsService;
    constructor(chatsService: ChatsService);
    createDirectChat(dto: CreateDirectChatDto): Promise<{
        message: string;
    }>;
    getChats(query: GetChatsQueryDto): Promise<{
        message: string;
    }>;
    getChatById(chatId: string): Promise<{
        message: string;
    }>;
    markChatAsRead(chatId: string, dto: MarkChatReadDto): Promise<{
        message: string;
    }>;
}
