import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

@Module({
  imports: [ConfigModule],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}