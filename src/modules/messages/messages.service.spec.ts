import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageQueueService } from '../../common/queue/message-queue.service';
import { ModuleRef } from '@nestjs/core';
import { MediaService } from '../media/media.service';
import { E2EECryptoService } from '../e2ee/e2ee-crypto.service';
import { SearchService } from '../search/search.service';
import { MetricsService } from '../monitoring/metrics.service';
import { MessageType } from '../../common/enums';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('MessagesService', () => {
  let service: MessagesService;
  let prisma: PrismaService;
  let messageQueue: MessageQueueService;
  let searchService: SearchService;

  const mockPrisma = {
    chat: {
      findUnique: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    chatMember: {
      findMany: jest.fn(),
    },
  };

  const mockMessageQueue = {
    enqueue: jest.fn(),
    bulkEnqueue: jest.fn(),
  };

  const mockSearchService = {
    indexMessage: jest.fn(),
  };

  const mockMetricsService = {
    incrementMessagesSent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MessageQueueService, useValue: mockMessageQueue },
        { provide: ModuleRef, useValue: { get: jest.fn() } },
        { provide: MediaService, useValue: {} },
        { provide: E2EECryptoService, useValue: { encryptMessage: jest.fn() } },
        { provide: SearchService, useValue: mockSearchService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prisma = module.get<PrismaService>(PrismaService);
    messageQueue = module.get<MessageQueueService>(MessageQueueService);
    searchService = module.get<SearchService>(SearchService);
    
    jest.clearAllMocks();
  });

  describe('createMessage', () => {
    const chatId = 'chat-1';
    const senderId = 'user-1';

    it('should throw NotFoundException if chat not found', async () => {
      mockPrisma.chat.findUnique.mockResolvedValue(null);
      await expect(service.createMessage(chatId, senderId, { type: MessageType.TEXT, textContent: 'Hi', clientTempId: 'temp-1' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should trigger BullMQ bulkEnqueue for large fan-out', async () => {
      mockPrisma.chat.findUnique.mockResolvedValue({ id: chatId, type: 'GROUP' });
      // 60 members to trigger background fan-out (> 50)
      const members = Array.from({ length: 60 }).map((_, i) => ({ userId: `user-${i}` }));
      mockPrisma.chatMember.findMany.mockResolvedValue(members);
      mockPrisma.message.create.mockResolvedValue({ id: 'msg-1', chatId, senderId, textContent: 'Hi' });

      await service.createMessage(chatId, senderId, { type: MessageType.TEXT, textContent: 'Hi', clientTempId: 'temp-2' });

      expect(messageQueue.bulkEnqueue).toHaveBeenCalled();
      // Should have 1 receipt job chunk + 1 fanout job chunk (since 60 users fit in 100-batch)
      // Actually it's more complicated based on implementation, but bulkEnqueue must be called.
    });

    it('should index message in SearchService', async () => {
      mockPrisma.chat.findUnique.mockResolvedValue({ id: chatId });
      mockPrisma.chatMember.findMany.mockResolvedValue([{ userId: senderId }, { userId: 'user-2' }]);
      const msg = { id: 'msg-2', chatId, senderId, textContent: 'Search me' };
      mockPrisma.message.create.mockResolvedValue(msg);

      await service.createMessage(chatId, senderId, { type: MessageType.TEXT, textContent: 'Search me', clientTempId: 'temp-1' });

      expect(searchService.indexMessage).toHaveBeenCalledWith(msg);
      expect(mockMetricsService.incrementMessagesSent).toHaveBeenCalled();
    });
  });
});
