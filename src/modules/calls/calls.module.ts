import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { TurnService } from '../../integrations/turn/turn.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CallsController],
  providers: [CallsService, TurnService],
  exports: [CallsService],
})
export class CallsModule {}
