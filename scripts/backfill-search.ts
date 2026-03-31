import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SearchService } from '../src/modules/search/search.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Logger } from '@nestjs/common';

async function backfill() {
  const logger = new Logger('BackfillSearch');
  const app = await NestFactory.createApplicationContext(AppModule);
  const searchService = app.get(SearchService);
  const prisma = app.get(PrismaService);

  logger.log('Starting backfill for Meilisearch...');

  const batchSize = 1000;
  let skip = 0;

  while (true) {
    const messages = await prisma.message.findMany({
      where: { isDeleted: false },
      take: batchSize,
      skip: skip,
      orderBy: { createdAt: 'asc' },
    });

    if (messages.length === 0) break;

    logger.log(`Indexing batch of ${messages.length} messages (offset: ${skip})...`);
    
    // Index each message
    // Note: SearchService.indexMessage handles the formatting
    for (const msg of messages) {
      await searchService.indexMessage(msg);
    }

    skip += batchSize;
    if (messages.length < batchSize) break;
  }

  logger.log('Backfill completed successfully.');
  await app.close();
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
