import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SearchResult {
  id: string;
  chatId: string;
  textContent: string;
  senderId: string;
  senderName: string;
  chatTitle: string | null;
  createdAt: Date;
  rank: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Full-text search messages using PostgreSQL ts_vector.
   * Only searches within chats the user is a member of.
   */
  async searchMessages(
    userId: string,
    query: string,
    options?: {
      chatId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ results: SearchResult[]; total: number }> {
    const limit = Math.min(options?.limit || 20, 50);
    const offset = options?.offset || 0;

    // Sanitize query for ts_query (replace spaces with & for AND matching)
    const tsQuery = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => `${word}:*`) // Prefix matching
      .join(' & ');

    if (!tsQuery) {
      return { results: [], total: 0 };
    }

    // Build the WHERE clause — must be member of the chat
    const chatFilter = options?.chatId
      ? `AND m."chatId" = '${options.chatId}'`
      : '';

    try {
      // Search with ranking
      const results = await this.prisma.$queryRawUnsafe<SearchResult[]>(`
        SELECT 
          m."id",
          m."chatId",
          m."textContent",
          m."senderId",
          u."displayName" as "senderName",
          c."title" as "chatTitle",
          m."createdAt",
          ts_rank(to_tsvector('english', COALESCE(m."textContent", '')), to_tsquery('english', $1)) as rank
        FROM messages m
        INNER JOIN chat_members cm ON cm."chatId" = m."chatId" AND cm."userId" = $2 AND cm."leftAt" IS NULL
        INNER JOIN users u ON u."id" = m."senderId"
        INNER JOIN chats c ON c."id" = m."chatId"
        WHERE 
          m."isDeleted" = false
          AND m."textContent" IS NOT NULL
          AND to_tsvector('english', COALESCE(m."textContent", '')) @@ to_tsquery('english', $1)
          ${chatFilter}
        ORDER BY rank DESC, m."createdAt" DESC
        LIMIT $3
        OFFSET $4
      `, tsQuery, userId, limit, offset);

      // Get total count
      const countResult = await this.prisma.$queryRawUnsafe<[{ count: bigint }]>(`
        SELECT COUNT(*) as count
        FROM messages m
        INNER JOIN chat_members cm ON cm."chatId" = m."chatId" AND cm."userId" = $2 AND cm."leftAt" IS NULL
        WHERE 
          m."isDeleted" = false
          AND m."textContent" IS NOT NULL
          AND to_tsvector('english', COALESCE(m."textContent", '')) @@ to_tsquery('english', $1)
          ${chatFilter}
      `, tsQuery, userId);

      const total = Number(countResult[0]?.count || 0);

      return { results, total };
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      // Fallback to LIKE search if ts_query fails (e.g., special characters)
      return this.fallbackSearch(userId, query, options?.chatId, limit, offset);
    }
  }

  /**
   * Fallback ILIKE search when full-text search fails.
   */
  private async fallbackSearch(
    userId: string,
    query: string,
    chatId?: string,
    limit = 20,
    offset = 0,
  ): Promise<{ results: SearchResult[]; total: number }> {
    const where: any = {
      isDeleted: false,
      textContent: { not: null, contains: query, mode: 'insensitive' },
      chat: {
        members: {
          some: {
            userId,
            leftAt: null,
          },
        },
      },
    };

    if (chatId) {
      where.chatId = chatId;
    }

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        select: {
          id: true,
          chatId: true,
          textContent: true,
          senderId: true,
          createdAt: true,
          sender: { select: { displayName: true } },
          chat: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      results: messages.map((m) => ({
        id: m.id,
        chatId: m.chatId,
        textContent: m.textContent!,
        senderId: m.senderId,
        senderName: m.sender.displayName,
        chatTitle: m.chat.title,
        createdAt: m.createdAt,
        rank: 0,
      })),
      total,
    };
  }
}
