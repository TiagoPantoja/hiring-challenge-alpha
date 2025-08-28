import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum ExportFormat {
  JSON = 'json',
  TXT = 'txt',
  MD = 'md'
}

export class ExportHistoryDto {
  @ApiProperty({
    description: 'Formato de exportação do histórico',
    enum: ExportFormat,
    example: ExportFormat.JSON,
    enumName: 'ExportFormat'
  })
  @IsEnum(ExportFormat, {
    message: 'Formato deve ser um dos seguintes: json, txt, md'
  })
  format: ExportFormat;
}