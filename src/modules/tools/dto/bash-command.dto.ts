import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class BashCommandDto {
  @ApiProperty({
    description: 'Comando bash a ser executado',
    example: 'date'
  })
  @IsString()
  @IsNotEmpty()
  command: string;

  @ApiProperty({
    description: 'Descrição do comando (opcional)',
    example: 'Obter data e hora atual',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;
}