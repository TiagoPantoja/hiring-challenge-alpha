import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SqliteService } from './services/sqlite.service';
import { DocumentService } from './services/document.service';
import { BashService } from './services/bash.service';
import { ToolsController } from './tools.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ToolsController],
  providers: [SqliteService, DocumentService, BashService],
  exports: [SqliteService, DocumentService, BashService],
})
export class ToolsModule {}