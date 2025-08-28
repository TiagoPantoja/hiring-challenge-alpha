import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  query: string;
  response: string;
  success: boolean;
  duration: number;
}

export interface HistoryStats {
  total: number;
  successful: number;
  failed: number;
  successRate: string;
  todayEntries: number;
  topKeywords: Array<{ word: string; count: number }>;
  oldestEntry: string | null;
  newestEntry: string | null;
}

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);
  private readonly maxEntries: number;
  private history: HistoryEntry[] = [];
  private readonly historyFile: string;

  constructor(private readonly configService: ConfigService) {
    this.maxEntries = parseInt(this.configService.get('MAX_HISTORY_ENTRIES', '50'));
    this.historyFile = path.join(process.cwd(), 'data', 'conversation_history.json');
    this.loadHistory();
  }

  async addEntry(
    query: string,
    response: string,
    timestamp: Date,
    duration: number,
    success: boolean
  ): Promise<string> {
    const entry: HistoryEntry = {
      id: this.generateId(),
      timestamp: timestamp.toISOString(),
      query: query.trim(),
      response: response.trim(),
      success,
      duration
    };

    this.history.unshift(entry);

    // Manter apenas as últimas N entradas
    if (this.history.length > this.maxEntries) {
      this.history = this.history.slice(0, this.maxEntries);
    }

    await this.saveHistory();
    return entry.id;
  }

  getHistory(limit?: number): HistoryEntry[] {
    if (limit && limit > 0) {
      return this.history.slice(0, limit);
    }
    return [...this.history];
  }

  searchHistory(searchTerm: string): HistoryEntry[] {
    const term = searchTerm.toLowerCase();
    return this.history.filter(entry =>
      entry.query.toLowerCase().includes(term) ||
      entry.response.toLowerCase().includes(term)
    );
  }

  getStats(): HistoryStats {
    const total = this.history.length;
    const successful = this.history.filter(entry => entry.success).length;
    const failed = total - successful;

    const today = new Date().toDateString();
    const todayEntries = this.history.filter(entry =>
      new Date(entry.timestamp).toDateString() === today
    ).length;

    // Tópicos mais comuns
    const keywords: Record<string, number> = {};
    this.history.forEach(entry => {
      const words = entry.query.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['qual', 'como', 'onde', 'quando', 'porque', 'para', 'sobre'].includes(word));

      words.forEach(word => {
        keywords[word] = (keywords[word] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(keywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : '0',
      todayEntries,
      topKeywords,
      oldestEntry: this.history.length > 0 ? this.history[this.history.length - 1].timestamp : null,
      newestEntry: this.history.length > 0 ? this.history[0].timestamp : null
    };
  }

  async clearHistory(): Promise<void> {
    this.history = [];
    await this.saveHistory();
    this.logger.log('Histórico de conversas limpo');
  }

  async exportHistory(format: 'json' | 'txt' | 'md' = 'json'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `conversation_history_${timestamp}.${format}`;
    const exportPath = path.join(process.cwd(), 'data', filename);

    try {
      if (format === 'json') {
        fs.writeFileSync(exportPath, JSON.stringify(this.history, null, 2));
      } else if (format === 'txt') {
        const content = this.history.map(entry => {
          const date = new Date(entry.timestamp).toLocaleString('pt-BR');
          return `[${date}] ${entry.success ? '✅' : '❌'}\nPergunta: ${entry.query}\nResposta: ${entry.response}\n${'='.repeat(80)}\n`;
        }).join('\n');
        fs.writeFileSync(exportPath, content);
      } else if (format === 'md') {
        const content = [
          '# Histórico de Conversas',
          `Exportado em: ${new Date().toLocaleString('pt-BR')}`,
          `Total de entradas: ${this.history.length}\n`,
          ...this.history.map(entry => {
            const date = new Date(entry.timestamp).toLocaleString('pt-BR');
            const status = entry.success ? '✅' : '❌';
            return `## ${status} ${date}\n\n**Pergunta:** ${entry.query}\n\n**Resposta:** ${entry.response}\n\n---\n`;
          })
        ].join('\n');
        fs.writeFileSync(exportPath, content);
      }

      this.logger.log(`Histórico exportado para: ${filename}`);
      return exportPath;
    } catch (error) {
      this.logger.error('Erro ao exportar histórico:', error);
      throw error;
    }
  }

  getEntryById(id: string): HistoryEntry | undefined {
    return this.history.find(entry => entry.id === id);
  }

  async removeEntry(id: string): Promise<HistoryEntry | null> {
    const index = this.history.findIndex(entry => entry.id === id);
    if (index !== -1) {
      const removed = this.history.splice(index, 1)[0];
      await this.saveHistory();
      return removed;
    }
    return null;
  }

  private loadHistory(): void {
    try {
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf8');
        this.history = JSON.parse(data);
        this.logger.debug(`Histórico carregado: ${this.history.length} entradas`);
      } else {
        this.history = [];
        this.logger.debug('Nenhum histórico anterior encontrado');
      }
    } catch (error) {
      this.logger.warn('Erro ao carregar histórico:', error);
      this.history = [];
    }
  }

  private async saveHistory(): Promise<void> {
    try {
      const dir = path.dirname(this.historyFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
      this.logger.debug('Histórico salvo com sucesso');
    } catch (error) {
      this.logger.error('Erro ao salvar histórico:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}