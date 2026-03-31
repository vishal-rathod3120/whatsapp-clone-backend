import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../modules/search/search.service';

/**
 * Backfill script to index existing messages in Meilisearch
 * Run this once after deploying the search feature to index historical messages
 */
@Injectable()
export class SearchBackfillService {
  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
  ) {}

  /**
   * Backfill all non-deleted messages to the search index
   * Processes in batches to avoid memory issues
   */
  async backfillMessages(batchSize: number = 1000): Promise<{
    totalIndexed: number;
    encryptedSkipped: number;
    errors: number;
  }> {
    let cursor: string | null = null;
    let totalIndexed = 0;
    let encryptedSkipped = 0;
    let errors = 0;

    console.log('Starting message backfill to Meilisearch...');

    do {
      const messages = await this.prisma.message.findMany({
        where: {
          isDeleted: false,
        },
        take: batchSize,
        ...(cursor && {
          skip: 1,
          cursor: { id: cursor },
        }),
        orderBy: { createdAt: 'desc' },
      });

      if (messages.length === 0) break;

      for (const message of messages) {
        try {
          await this.searchService.indexMessage(message);
          totalIndexed++;

          if (message.isEncrypted) {
            encryptedSkipped++;
          }

          if (totalIndexed % 100 === 0) {
            console.log(`Indexed ${totalIndexed} messages...`);
          }
        } catch (error) {
          console.error(`Failed to index message ${message.id}:`, error);
          errors++;
        }
      }

      cursor = messages[messages.length - 1]?.id || null;
    } while (cursor);

    console.log(`\nBackfill complete:`);
    console.log(`- Total indexed: ${totalIndexed}`);
    console.log(`- Encrypted messages (content not indexed): ${encryptedSkipped}`);
    console.log(`- Errors: ${errors}`);

    return { totalIndexed, encryptedSkipped, errors };
  }

  /**
   * Backfill messages for a specific chat only
   */
  async backfillChatMessages(chatId: string, batchSize: number = 500): Promise<{
    totalIndexed: number;
    encryptedSkipped: number;
    errors: number;
  }> {
    let cursor: string | null = null;
    let totalIndexed = 0;
    let encryptedSkipped = 0;
    let errors = 0;

    console.log(`Starting message backfill for chat ${chatId}...`);

    do {
      const messages = await this.prisma.message.findMany({
        where: {
          chatId,
          isDeleted: false,
        },
        take: batchSize,
        ...(cursor && {
          skip: 1,
          cursor: { id: cursor },
        }),
        orderBy: { createdAt: 'desc' },
      });

      if (messages.length === 0) break;

      for (const message of messages) {
        try {
          await this.searchService.indexMessage(message);
          totalIndexed++;

          if (message.isEncrypted) {
            encryptedSkipped++;
          }
        } catch (error) {
          console.error(`Failed to index message ${message.id}:`, error);
          errors++;
        }
      }

      cursor = messages[messages.length - 1]?.id || null;
    } while (cursor);

    console.log(`Chat ${chatId} backfill complete: ${totalIndexed} messages indexed`);

    return { totalIndexed, encryptedSkipped, errors };
  }
}
