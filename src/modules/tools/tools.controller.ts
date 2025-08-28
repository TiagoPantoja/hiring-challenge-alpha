import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { SqliteService } from './services/sqlite.service';
import { DocumentService } from './services/document.service';
import { BashService } from './services/bash.service';
import { SqliteQueryDto } from './dto/sqlite-query.dto';
import { DocumentSearchDto } from './dto/document-search.dto';
import { BashCommandDto } from './dto/bash-command.dto';

@ApiTags('tools')
@Controller('tools')
export class ToolsController {
  constructor(
    private readonly sqliteService: SqliteService,
    private readonly documentService: DocumentService,
    private readonly bashService: BashService,
  ) {}

  @Get('sqlite/databases')
  @ApiOperation({
    summary: 'Listar bancos de dados SQLite',
    description: 'Retorna lista de todos os bancos de dados SQLite disponíveis'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de bancos obtida com sucesso',
    schema: {
      type: 'array',
      items: { type: 'string' }
    }
  })
  async listDatabases(): Promise<string[]> {
    try {
      return await this.sqliteService.listDatabases();
    } catch (error) {
      throw new HttpException(
        `Erro ao listar bancos: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('sqlite/:database/tables')
  @ApiOperation({
    summary: 'Listar tabelas de um banco',
    description: 'Retorna lista de tabelas de um banco de dados específico'
  })
  @ApiParam({ name: 'database', description: 'Nome do banco de dados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tabelas obtida com sucesso',
    schema: {
      type: 'array',
      items: { type: 'string' }
    }
  })
  async getTables(@Param('database') database: string): Promise<string[]> {
    try {
      return await this.sqliteService.getTables(database);
    } catch (error) {
      throw new HttpException(
        `Erro ao obter tabelas: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sqlite/query')
  @ApiOperation({
    summary: 'Executar consulta SQL',
    description: 'Executa uma consulta SQL em um banco de dados específico'
  })
  @ApiBody({ type: SqliteQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Consulta executada com sucesso'
  })
  async executeQuery(@Body() sqliteQueryDto: SqliteQueryDto): Promise<any> {
    try {
      return await this.sqliteService.executeQuery(
        sqliteQueryDto.database,
        sqliteQueryDto.query
      );
    } catch (error) {
      throw new HttpException(
        `Erro ao executar consulta: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('documents')
  @ApiOperation({
    summary: 'Listar documentos',
    description: 'Retorna lista de todos os documentos de texto disponíveis'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos obtida com sucesso',
    schema: {
      type: 'array',
      items: { type: 'string' }
    }
  })
  async listDocuments(): Promise<string[]> {
    try {
      return await this.documentService.listDocuments();
    } catch (error) {
      throw new HttpException(
        `Erro ao listar documentos: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('documents/search')
  @ApiOperation({
    summary: 'Buscar em documento',
    description: 'Busca por um termo específico em um documento ou retorna o conteúdo completo'
  })
  @ApiBody({ type: DocumentSearchDto })
  @ApiResponse({
    status: 200,
    description: 'Busca realizada com sucesso'
  })
  async searchDocument(@Body() documentSearchDto: DocumentSearchDto): Promise<any> {
    try {
      return await this.documentService.searchDocument(
        documentSearchDto.filename,
        documentSearchDto.searchTerm
      );
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar documento: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('bash/execute')
  @ApiOperation({
    summary: 'Executar comando bash',
    description: 'Executa um comando bash seguro (comandos perigosos são bloqueados)'
  })
  @ApiBody({ type: BashCommandDto })
  @ApiResponse({
    status: 200,
    description: 'Comando executado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Comando bloqueado por segurança'
  })
  async executeCommand(@Body() bashCommandDto: BashCommandDto): Promise<any> {
    try {
      return await this.bashService.executeCommand(
        bashCommandDto.command,
        bashCommandDto.description
      );
    } catch (error) {
      throw new HttpException(
        `Erro ao executar comando: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}