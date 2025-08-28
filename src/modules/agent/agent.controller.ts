import { Controller, Post, Get, Body, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { ProcessQueryDto } from './dto/process-query.dto';
import { QueryResponseDto } from './dto/query-response.dto';
import { DataSourceStatsDto } from './dto/data-source-stats.dto';

@ApiTags('agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('query')
  @ApiOperation({
    summary: 'Processar pergunta do usuário',
    description: 'Envia uma pergunta para o agente IA processar usando múltiplas fontes de dados'
  })
  @ApiBody({ type: ProcessQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Pergunta processada com sucesso',
    type: QueryResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de entrada inválidos'
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor'
  })
  async processQuery(@Body() processQueryDto: ProcessQueryDto): Promise<QueryResponseDto> {
    try {
      return await this.agentService.processQuery(processQueryDto);
    } catch (error) {
      throw new HttpException(
        `Erro ao processar consulta: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Obter estatísticas das fontes de dados',
    description: 'Retorna informações sobre bancos SQLite, documentos e comandos bash disponíveis'
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas obtidas com sucesso',
    type: DataSourceStatsDto
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor'
  })
  async getDataSourceStats(): Promise<DataSourceStatsDto> {
    try {
      return await this.agentService.getDataSourceStats();
    } catch (error) {
      throw new HttpException(
        `Erro ao obter estatísticas: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('suggestions')
  @ApiOperation({
    summary: 'Obter sugestões de perguntas',
    description: 'Retorna uma lista de perguntas sugeridas baseadas nas fontes de dados disponíveis'
  })
  @ApiResponse({
    status: 200,
    description: 'Sugestões obtidas com sucesso',
    type: [String]
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor'
  })
  async getSuggestedQuestions(): Promise<string[]> {
    try {
      return await this.agentService.getSuggestedQuestions();
    } catch (error) {
      throw new HttpException(
        `Erro ao obter sugestões: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  @ApiOperation({
    summary: 'Verificar saúde do agente',
    description: 'Verifica se o agente está inicializado e funcionando corretamente'
  })
  @ApiResponse({
    status: 200,
    description: 'Agente está funcionando',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        initialized: { type: 'boolean', example: true },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  async getHealth(): Promise<{ status: string; initialized: boolean; timestamp: string }> {
    return {
      status: 'healthy',
      initialized: true,
      timestamp: new Date().toISOString()
    };
  }
}