import { Controller, Get, Post, Delete, Query, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import type { HistoryEntry, HistoryStats } from './history.service';
import { ExportHistoryDto } from './dto/export-history.dto';

@ApiTags('history')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Obter histórico de conversas',
    description: 'Retorna o histórico de conversas com limite opcional'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número máximo de entradas a retornar',
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico obtido com sucesso'
  })
  getHistory(@Query('limit') limit?: string): HistoryEntry[] {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.historyService.getHistory(limitNum);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Buscar no histórico',
    description: 'Busca por um termo específico no histórico de conversas'
  })
  @ApiQuery({
    name: 'term',
    required: true,
    description: 'Termo a ser buscado',
    example: 'economia'
  })
  @ApiResponse({
    status: 200,
    description: 'Busca realizada com sucesso'
  })
  searchHistory(@Query('term') term: string): HistoryEntry[] {
    if (!term) {
      throw new HttpException('Termo de busca é obrigatório', HttpStatus.BAD_REQUEST);
    }
    return this.historyService.searchHistory(term);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Obter estatísticas do histórico',
    description: 'Retorna estatísticas detalhadas do histórico de conversas'
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas obtidas com sucesso'
  })
  getStats(): HistoryStats {
    return this.historyService.getStats();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter entrada específica do histórico',
    description: 'Retorna uma entrada específica do histórico pelo ID'
  })
  @ApiParam({ name: 'id', description: 'ID da entrada do histórico' })
  @ApiResponse({
    status: 200,
    description: 'Entrada encontrada'
  })
  @ApiResponse({
    status: 404,
    description: 'Entrada não encontrada'
  })
  getEntryById(@Param('id') id: string): HistoryEntry {
    const entry = this.historyService.getEntryById(id);
    if (!entry) {
      throw new HttpException('Entrada não encontrada', HttpStatus.NOT_FOUND);
    }
    return entry;
  }

  @Post('export')
  @ApiOperation({
    summary: 'Exportar histórico',
    description: 'Exporta o histórico em diferentes formatos (JSON, TXT, MD)'
  })
  @ApiBody({ type: ExportHistoryDto })
  @ApiResponse({
    status: 200,
    description: 'Histórico exportado com sucesso',
    schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', example: '/path/to/exported/file.json' },
        message: { type: 'string', example: 'Histórico exportado com sucesso' }
      }
    }
  })
  async exportHistory(@Body() exportHistoryDto: ExportHistoryDto): Promise<{ filePath: string; message: string }> {
    try {
      const filePath = await this.historyService.exportHistory(exportHistoryDto.format);
      return {
        filePath,
        message: 'Histórico exportado com sucesso'
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao exportar histórico: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete()
  @ApiOperation({
    summary: 'Limpar histórico completo',
    description: 'Remove todas as entradas do histórico de conversas'
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico limpo com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Histórico limpo com sucesso' }
      }
    }
  })
  async clearHistory(): Promise<{ message: string }> {
    try {
      await this.historyService.clearHistory();
      return { message: 'Histórico limpo com sucesso' };
    } catch (error) {
      throw new HttpException(
        `Erro ao limpar histórico: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover entrada específica',
    description: 'Remove uma entrada específica do histórico pelo ID'
  })
  @ApiParam({ name: 'id', description: 'ID da entrada a ser removida' })
  @ApiResponse({
    status: 200,
    description: 'Entrada removida com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Entrada não encontrada'
  })
  async removeEntry(@Param('id') id: string): Promise<{ message: string; removedEntry: HistoryEntry }> {
    try {
      const removedEntry = await this.historyService.removeEntry(id);
      if (!removedEntry) {
        throw new HttpException('Entrada não encontrada', HttpStatus.NOT_FOUND);
      }
      return {
        message: 'Entrada removida com sucesso',
        removedEntry
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erro ao remover entrada: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}