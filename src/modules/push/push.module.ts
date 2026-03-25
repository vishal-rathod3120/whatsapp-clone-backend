import { Module } from '@nestjs/common';
import { PushController } from './push.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PushController],
})
export class PushModule {}
