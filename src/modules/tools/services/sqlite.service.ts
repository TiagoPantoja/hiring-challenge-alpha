import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tool } from '@langchain/core/tools';
import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SqliteService {
  private readonly logger = new Logger(SqliteService.name);
  private readonly sqlitePath: string;

  constructor(private readonly configService: ConfigService) {
    this.sqlitePath = this.configService.get('SQLITE_PATH', './data/sqlite');
  }

  async createTool(): Promise<Tool> {
    return new SqliteTool(this.sqlitePath);
  }

  async getStats(): Promise<{ count: number; databases: string[] }> {
    try {
      const files = fs.readdirSync(this.sqlitePath);
      const databases = files.filter(file => file.endsWith('.db'));
      return {
        count: databases.length,
        databases
      };
    } catch (error) {
      this.logger.error('Erro ao obter estatísticas SQLite:', error);
      return { count: 0, databases: [] };
    }
  }

  async listDatabases(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.sqlitePath);
      return files.filter(file => file.endsWith('.db'));
    } catch (error) {
      this.logger.error('Erro ao listar bancos de dados:', error);
      return [];
    }
  }

  async getTables(database: string): Promise<string[]> {
    const dbPath = path.join(this.sqlitePath, database);

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows: any[]) => {
        db.close();
        if (err) {
          reject(err);
          return;
        }
        resolve(rows.map(row => row.name));
      });
    });
  }

  async executeQuery(database: string, query: string): Promise<any> {
    const dbPath = path.join(this.sqlitePath, database);

    if (!fs.existsSync(dbPath)) {
      throw new Error(`Banco de dados ${database} não encontrado`);
    }

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

      db.all(query, (err, rows) => {
        db.close();
        if (err) {
          reject(new Error(`Consulta falhou: ${err.message}`));
          return;
        }

        resolve({
          banco_de_dados: database,
          consulta: query,
          resultados: rows,
          total_registros: rows.length
        });
      });
    });
  }
}

class SqliteTool extends Tool {
  name = "sqlite_query";
  description = `
    Execute SQL queries on SQLite databases in the data/sqlite folder.
    Input should be a JSON string with 'database' and 'query' fields.
    Example: {"database": "music.db", "query": "SELECT * FROM artists LIMIT 5"}
  `;

  constructor(private sqlitePath: string) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const { database, query } = JSON.parse(input);

      if (!database || !query) {
        throw new Error('Tanto o banco de dados quanto a consulta são obrigatórios');
      }

      const dbPath = path.join(this.sqlitePath, database);

      if (!fs.existsSync(dbPath)) {
        throw new Error(`Banco de dados ${database} não encontrado em ${this.sqlitePath}`);
      }

      return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
          if (err) {
            reject(new Error(`Falha ao abrir o banco de dados: ${err.message}`));
            return;
          }
        });

        db.all(query, (err, rows) => {
          db.close();
          if (err) {
            reject(new Error(`Consulta falhou: ${err.message}`));
            return;
          }

          const result = {
            banco_de_dados: database,
            consulta: query,
            resultados: rows,
            total_registros: rows.length
          };

          resolve(JSON.stringify(result, null, 2));
        });
      });

    } catch (error) {
      return `Erro: ${(error as Error).message}`;
    }
  }
}