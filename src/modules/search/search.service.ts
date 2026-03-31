import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';

export interface MessageDocument {
  id: string;
  chatId: string;
  senderId: string;
  type: string;
  textContent: string | null;
  createdAt: number; // Unix timestamp for easier filtering
  isEncrypted: boolean;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private client: MeiliSearch;
  private index: Index<MessageDocument>;
  private readonly logger = new Logger(SearchService.name);

  constructor(private configService: ConfigService) {
    this.client = new MeiliSearch({
      host: this.configService.get<string>('MEILI_HOST', 'http://localhost:7700'),
      apiKey: this.configService.get<string>('MEILI_MASTER_KEY', 'masterKey'),
    });
    this.index = this.client.index('messages');
  }

  async onModuleInit() {
    try {
      // Configure index settings
      await this.index.updateSettings({
        searchableAttributes: ['textContent'],
        filterableAttributes: ['chatId', 'senderId', 'type', 'createdAt', 'isEncrypted'],
        sortableAttributes: ['createdAt'],
      });
      this.logger.log('Meilisearch index "messages" initialized and configured.');
    } catch (error) {
      this.logger.error('Failed to initialize Meilisearch index:', error);
    }
  }

  async indexMessage(message: any) {
    if (message.isDeleted) return;

    const doc: MessageDocument = {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      type: message.type,
      // For encrypted messages, don't index the ciphertext content
      // Server cannot search encrypted content - only metadata
      textContent: message.isEncrypted ? null : message.textContent,
      createdAt: message.createdAt.getTime(),
      isEncrypted: message.isEncrypted || false,
    };

    try {
      await this.index.addDocuments([doc]);
    } catch (error) {
      this.logger.error(`Failed to index message ${message.id}:`, error);
    }
  }

  async removeMessage(messageId: string) {
    try {
      await this.index.deleteDocument(messageId);
    } catch (error) {
      this.logger.error(`Failed to remove message ${messageId} from index:`, error);
    }
  }

  async searchMessages(query: string, options: { 
    chatId?: string; 
    senderId?: string;
    limit?: number;
    offset?: number;
  }) {
    const filters: string[] = [];
    if (options.chatId) filters.push(`chatId = ${options.chatId}`);
    if (options.senderId) filters.push(`senderId = ${options.senderId}`);

    try {
      const result = await this.index.search(query, {
        filter: filters.length > 0 ? filters.join(' AND ') : undefined,
        limit: options.limit || 20,
        offset: options.offset || 0,
        sort: ['createdAt:desc'],
      });
      return result;
    } catch (error) {
      this.logger.error(`Search failed for query "${query}":`, error);
      throw error;
    }
  }
}
