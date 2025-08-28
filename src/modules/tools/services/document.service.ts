import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tool } from '@langchain/core/tools';
import * as fs from 'fs';
import * as path from 'path';

interface MatchContext {
  numero_linha: number;
  linha_encontrada: string;
  contexto: string;
  linha_inicio: number;
  linha_fim: number;
}

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private readonly documentsPath: string;

  constructor(private readonly configService: ConfigService) {
    this.documentsPath = this.configService.get('DOCUMENTS_PATH', './data/documents');
  }

  async createTool(): Promise<Tool> {
    return new DocumentTool(this.documentsPath);
  }

  async getStats(): Promise<{ count: number; files: string[] }> {
    try {
      const files = fs.readdirSync(this.documentsPath);
      const documents = files.filter(file => file.endsWith('.txt') || file.endsWith('.md'));
      return {
        count: documents.length,
        files: documents
      };
    } catch (error) {
      this.logger.error('Erro ao obter estatísticas de documentos:', error);
      return { count: 0, files: [] };
    }
  }

  async listDocuments(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.documentsPath);
      return files.filter(file => file.endsWith('.txt') || file.endsWith('.md'));
    } catch (error) {
      this.logger.error('Erro ao listar documentos:', error);
      return [];
    }
  }

  async searchDocument(filename: string, searchTerm?: string): Promise<any> {
    const filePath = path.join(this.documentsPath, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Documento ${filename} não encontrado`);
    }

    const content = fs.readFileSync(filePath, 'utf8');

    if (!searchTerm) {
      return {
        nome_arquivo: filename,
        conteudo: content,
        tamanho: content.length
      };
    }

    const lines = content.split('\n');
    const matchingLines: MatchContext[] = [];
    const contextLines = 2;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(searchTerm.toLowerCase())) {
        const start = Math.max(0, i - contextLines);
        const end = Math.min(lines.length - 1, i + contextLines);

        const contextObj: MatchContext = {
          numero_linha: i + 1,
          linha_encontrada: lines[i],
          contexto: lines.slice(start, end + 1).join('\n'),
          linha_inicio: start + 1,
          linha_fim: end + 1
        };

        matchingLines.push(contextObj);
      }
    }

    return {
      nome_arquivo: filename,
      termo_busca: searchTerm,
      correspondencias_encontradas: matchingLines.length,
      correspondencias: matchingLines
    };
  }
}

class DocumentTool extends Tool {
  name = "document_search";
  description = `
    Search and retrieve information from text documents in the data/documents folder.
    Input should be a JSON string with 'filename' and optional 'search_term' fields.
    Example: {"filename": "economy_books.txt", "search_term": "Adam Smith"}
    If no search_term is provided, returns the full document content.
  `;

  constructor(private documentsPath: string) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const { filename, search_term } = JSON.parse(input);

      if (!filename) {
        throw new Error('Nome do arquivo é obrigatório');
      }

      const filePath = path.join(this.documentsPath, filename);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Documento ${filename} não encontrado em ${this.documentsPath}`);
      }

      const content = fs.readFileSync(filePath, 'utf8');

      if (!search_term) {
        return JSON.stringify({
          nome_arquivo: filename,
          conteudo: content,
          tamanho: content.length
        }, null, 2);
      }

      const lines = content.split('\n');
      const matchingLines: MatchContext[] = [];
      const contextLines = 2;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(search_term.toLowerCase())) {
          const start = Math.max(0, i - contextLines);
          const end = Math.min(lines.length - 1, i + contextLines);

          const contextObj: MatchContext = {
            numero_linha: i + 1,
            linha_encontrada: lines[i],
            contexto: lines.slice(start, end + 1).join('\n'),
            linha_inicio: start + 1,
            linha_fim: end + 1
          };

          matchingLines.push(contextObj);
        }
      }

      return JSON.stringify({
        nome_arquivo: filename,
        termo_busca: search_term,
        correspondencias_encontradas: matchingLines.length,
        correspondencias: matchingLines
      }, null, 2);

    } catch (error) {
      return `Erro: ${(error as Error).message}`;
    }
  }
}