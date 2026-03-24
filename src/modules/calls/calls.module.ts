import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { TurnService } from '../../integrations/turn/turn.service';

@Module({
  controllers: [CallsController],
  providers: [CallsService, TurnService],
  exports: [CallsService],
})
export class CallsModule {}
