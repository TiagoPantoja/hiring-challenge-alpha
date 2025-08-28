import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { ToolsModule } from '../tools/tools.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    ConfigModule,
    ToolsModule,
    HistoryModule,
  ],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}