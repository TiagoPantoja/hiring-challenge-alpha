import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsObject } from 'class-validator';

export class ProcessQueryDto {
  @ApiProperty({
    description: 'Pergunta ou consulta para o agente processar',
    example: 'O que você sabe sobre Adam Smith?',
    minLength: 1,
    maxLength: 1000
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  query: string;

  @ApiProperty({
    description: 'Contexto adicional para a consulta (opcional)',
    example: { source: 'web', priority: 'high' },
    required: false
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @ApiProperty({
    description: 'ID da sessão para manter contexto (opcional)',
    example: 'session-123',
    required: false
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}