import { ApiProperty } from '@nestjs/swagger';

export class IntermediateStepDto {
  @ApiProperty({
    description: 'Ação executada pelo agente',
    example: { tool: 'document_search', toolInput: '{"filename": "economy_books.txt"}' }
  })
  action: {
    tool: string;
    toolInput: string;
  };

  @ApiProperty({
    description: 'Observação ou resultado da ação',
    example: 'Documento encontrado com 150 linhas'
  })
  observation: string;
}

export class QueryResponseDto {
  @ApiProperty({
    description: 'Resposta do agente para a consulta',
    example: 'Adam Smith foi um economista escocês conhecido como o pai da economia moderna...'
  })
  answer: string;

  @ApiProperty({
    description: 'Passos intermediários executados pelo agente',
    type: [IntermediateStepDto]
  })
  intermediateSteps: IntermediateStepDto[];

  @ApiProperty({
    description: 'Indica se a consulta foi processada com sucesso',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Tempo de processamento em milissegundos',
    example: 2500
  })
  duration: number;

  @ApiProperty({
    description: 'ID da entrada no histórico',
    example: 'hist_123456789'
  })
  historyId: string;

  @ApiProperty({
    description: 'Timestamp da resposta',
    example: '2024-01-01T12:00:00.000Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Mensagem de erro (apenas se success = false)',
    example: 'Erro de conexão com a API',
    required: false
  })
  error?: string;
}