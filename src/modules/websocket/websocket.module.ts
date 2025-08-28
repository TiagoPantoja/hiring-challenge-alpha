import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { HistoryModule } from '../history/history.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [AgentModule, HistoryModule],
  providers: [ChatGateway],
})
export class WebSocketModule {}