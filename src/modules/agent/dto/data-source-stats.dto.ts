import { ApiProperty } from '@nestjs/swagger';

export class SqliteStatsDto {
  @ApiProperty({
    description: 'Número de banco de dados SQLite disponíveis',
    example: 1
  })
  count: number;

  @ApiProperty({
    description: 'Lista de nomes dos bancos de dados',
    example: ['music.db']
  })
  databases: string[];
}

export class DocumentStatsDto {
  @ApiProperty({
    description: 'Número de documentos de texto disponíveis',
    example: 1
  })
  count: number;

  @ApiProperty({
    description: 'Lista de nomes dos arquivos de documentos',
    example: ['economy_books.txt']
  })
  files: string[];
}

export class BashStatsDto {
  @ApiProperty({
    description: 'Indica se comandos bash estão habilitados',
    example: true
  })
  enabled: boolean;
}

export class DataSourceStatsDto {
  @ApiProperty({
    description: 'Estatísticas dos bancos de dados SQLite',
    type: SqliteStatsDto
  })
  sqlite: SqliteStatsDto;

  @ApiProperty({
    description: 'Estatísticas dos documentos de texto',
    type: DocumentStatsDto
  })
  documents: DocumentStatsDto;

  @ApiProperty({
    description: 'Estatísticas dos comandos bash',
    type: BashStatsDto
  })
  bash: BashStatsDto;
}