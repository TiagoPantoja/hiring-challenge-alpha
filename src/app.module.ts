import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from './modules/agent/agent.module';
import { ToolsModule } from './modules/tools/tools.module';
import { HistoryModule } from './modules/history/history.module';
import { WebSocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AgentModule,
    ToolsModule,
    HistoryModule,
    WebSocketModule,
  ],
})
export class AppModule {}