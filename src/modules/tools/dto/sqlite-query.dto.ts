import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SqliteQueryDto {
  @ApiProperty({
    description: 'Nome do banco de dados SQLite',
    example: 'music.db'
  })
  @IsString()
  @IsNotEmpty()
  database: string;

  @ApiProperty({
    description: 'Consulta SQL a ser executada',
    example: 'SELECT * FROM artists LIMIT 5'
  })
  @IsString()
  @IsNotEmpty()
  query: string;
}