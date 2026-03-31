import { Module } from '@nestjs/common';
import { E2EEController } from './e2ee.controller';
import { E2EEService } from './e2ee.service';
import { PrekeyStoreService } from './prekey-store.service';
import { E2EECryptoService } from './e2ee-crypto.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [E2EEController],
  providers: [
    E2EEService,
    PrekeyStoreService,
    E2EECryptoService,
  ],
  exports: [E2EEService, PrekeyStoreService, E2EECryptoService],
})
export class E2EEModule {}
