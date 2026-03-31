import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { MessagesService } from '../../src/modules/messages/messages.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { MessageType } from '../../src/common/enums';

async function stressTest() {
  const logger = new Logger('GroupFanoutStressTest');
  const app = await NestFactory.createApplicationContext(AppModule);
  const messagesService = app.get(MessagesService);
  const prisma = app.get(PrismaService);

  logger.log('Starting Group Fan-out Stress Test...');

  const chatId = uuidv7();
  const members = Array.from({ length: 500 }).map(() => ({
    userId: uuidv7(),
    role: 'MEMBER',
  }));

  const senderId = members[0].userId;

  // 1. Create a dummy group with 500 members
  logger.log('Generating 500 dummy members in DB...');
  await prisma.chat.create({
    data: {
      id: chatId,
      type: 'GROUP',
      title: 'Stress Test Group',
      createdById: senderId,
      members: {
        create: members.map(m => ({
          userId: m.userId,
          role: 'MEMBER' as any,
        }))
      }
    }
  });

  // 2. Trigger high-fanout message
  logger.log(`Sending message to ${members.length} members...`);
  const startTime = Date.now();
  
  await messagesService.createMessage(chatId, senderId, {
    type: MessageType.TEXT,
    textContent: 'Stress test message for BullMQ fan-out',
    clientTempId: 'stress-test-1',
  });

  const duration = Date.now() - startTime;
  logger.log(`Message creation and queueing completed in ${duration}ms`);
  logger.log('Check Bull-Board at /admin/queues to see the jobs.');

  await app.close();
}

stressTest().catch(err => {
  console.error('Stress test failed:', err);
  process.exit(1);
});
