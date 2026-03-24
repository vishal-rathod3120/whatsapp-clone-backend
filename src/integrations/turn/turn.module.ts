import { Module } from '@nestjs/common';
import { TurnService } from './turn.service';

@Module({
  providers: [TurnService],
  exports: [TurnService],
})
export class TurnModule {}
