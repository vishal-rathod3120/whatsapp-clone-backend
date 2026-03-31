import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactDiscoveryService } from './contact-discovery.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContactsController],
  providers: [ContactDiscoveryService],
  exports: [ContactDiscoveryService],
})
export class ContactsModule {}
