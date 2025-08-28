import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class DocumentSearchDto {
  @ApiProperty({
    description: 'Nome do arquivo de documento',
    example: 'economy_books.txt'
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: 'Termo a ser buscado no documento (opcional)',
    example: 'Adam Smith',
    required: false
  })
  @IsOptional()
  @IsString()
  searchTerm?: string;
}