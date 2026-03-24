import { MessagesService } from './messages.service';
import { GetMessagesQueryDto, SendMessageDto } from './dto/message.dto';
export declare class MessagesController {
    private messagesService;
    constructor(messagesService: MessagesService);
    getMessages(chatId: string, query: GetMessagesQueryDto): Promise<{
        message: string;
    }>;
    sendMessage(chatId: string, dto: SendMessageDto): Promise<{
        message: string;
    }>;
    deleteMessage(chatId: string, messageId: string): Promise<{
        message: string;
    }>;
}
