import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { SqliteService } from '../tools/services/sqlite.service';
import { DocumentService } from '../tools/services/document.service';
import { BashService } from '../tools/services/bash.service';
import { HistoryService } from '../history/history.service';
import { ProcessQueryDto } from './dto/process-query.dto';
import { QueryResponseDto } from './dto/query-response.dto';

interface SqliteStats {
  count: number;
  databases: string[];
}

interface DocumentStats {
  count: number;
  files: string[];
}

interface BashStats {
  enabled: boolean;
}

interface DataSourceStats {
  sqlite: SqliteStats;
  documents: DocumentStats;
  bash: BashStats;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private llm: ChatOpenAI;
  private agent: any;
  private agentExecutor: AgentExecutor;
  private tools: any[];
  private isInitialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly sqliteService: SqliteService,
    private readonly documentService: DocumentService,
    private readonly bashService: BashService,
    private readonly historyService: HistoryService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.logger.log('Inicializando MultiSourceAgent...');

      this.validateConfig();

      this.llm = new ChatOpenAI({
        openAIApiKey: this.configService.get('OPENAI_API_KEY'),
        modelName: this.configService.get('OPENAI_MODEL', 'gpt-4o-mini'),
        temperature: parseFloat(this.configService.get('OPENAI_TEMPERATURE', '0.1')),
        maxTokens: parseInt(this.configService.get('OPENAI_MAX_TOKENS', '1500')),
      });

      this.tools = [
        await this.sqliteService.createTool(),
        await this.documentService.createTool(),
        await this.bashService.createTool(),
      ];

      const prompt = ChatPromptTemplate.fromMessages([
        ["system", this.getSystemPrompt()],
        ["human", "{input}"],
        new MessagesPlaceholder("agent_scratchpad"),
      ]);

      this.agent = await createOpenAIFunctionsAgent({
        llm: this.llm,
        tools: this.tools,
        prompt: prompt,
      });

      this.agentExecutor = new AgentExecutor({
        agent: this.agent,
        tools: this.tools,
        maxIterations: parseInt(this.configService.get('MAX_ITERATIONS', '10')),
        verbose: this.configService.get('LOG_LEVEL') === 'debug',
        returnIntermediateSteps: true,
      });

      this.isInitialized = true;
      this.logger.log('MultiSourceAgent inicializado com sucesso!');

    } catch (error) {
      this.logger.error('Falha ao inicializar o agente:', (error as Error).message);
      throw error;
    }
  }

  async processQuery(processQueryDto: ProcessQueryDto): Promise<QueryResponseDto> {
    if (!this.isInitialized) {
      throw new Error('Agente não foi inicializado');
    }

    const startTime = Date.now();

    try {
      this.logger.log(`Processando consulta: "${processQueryDto.query}"`);

      const result = await this.agentExecutor.invoke({
        input: processQueryDto.query
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      const historyId = await this.historyService.addEntry(
        processQueryDto.query,
        result.output,
        new Date(),
        duration,
        true
      );

      const response: QueryResponseDto = {
        answer: result.output,
        intermediateSteps: result.intermediateSteps || [],
        success: true,
        duration,
        historyId,
        timestamp: new Date().toISOString(),
      };

      this.logger.log(`Consulta processada com sucesso em ${duration}ms`);
      return response;

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const errorMessage = `Desculpe, ocorreu um erro ao processar sua pergunta: ${(error as Error).message}`;

      const historyId = await this.historyService.addEntry(
        processQueryDto.query,
        errorMessage,
        new Date(),
        duration,
        false
      );

      this.logger.error('Erro ao processar consulta:', (error as Error).message);

      return {
        answer: errorMessage,
        intermediateSteps: [],
        success: false,
        duration,
        historyId,
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  }

  async getDataSourceStats(): Promise<DataSourceStats> {
    const stats: DataSourceStats = {
      sqlite: { count: 0, databases: [] as string[] },
      documents: { count: 0, files: [] as string[] },
      bash: { enabled: this.configService.get('ENABLE_BASH_COMMANDS') === 'true' }
    };

    try {
      const sqliteStats = await this.sqliteService.getStats();
      stats.sqlite = sqliteStats;
    } catch (error) {
      this.logger.debug('Erro ao obter stats SQLite:', (error as Error).message);
    }

    try {
      const documentStats = await this.documentService.getStats();
      stats.documents = documentStats;
    } catch (error) {
      this.logger.debug('Erro ao obter stats de documentos:', (error as Error).message);
    }

    return stats;
  }

  async getSuggestedQuestions(): Promise<string[]> {
    const suggestions: string[] = [];
    const stats = await this.getDataSourceStats();

    if (stats.sqlite.count > 0) {
      suggestions.push(
        `Que tabelas existem no banco ${stats.sqlite.databases[0]}?`,
        `Mostre alguns registros do banco ${stats.sqlite.databases[0]}`
      );
    }

    if (stats.documents.count > 0) {
      suggestions.push(
        `O que contém o documento ${stats.documents.files[0]}?`,
        `Busque por "economia" nos documentos disponíveis`
      );
    }

    if (stats.bash.enabled) {
      suggestions.push(
        'Qual é a data e hora atual?',
        'Busque informações sobre o clima em São Paulo'
      );
    }

    return suggestions;
  }

  private validateConfig(): void {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY é obrigatória no arquivo .env');
    }
  }

  private getSystemPrompt(): string {
    const agentName = this.configService.get('AGENT_NAME', 'MultiSourceAgent');

    return `Você é o ${agentName}, um assistente de IA inteligente que pode responder perguntas usando múltiplas fontes de dados.

Você tem acesso às seguintes ferramentas:

1. **sqlite_query**: Para consultar bancos de dados SQLite na pasta data/sqlite
2. **document_search**: Para buscar informações em documentos de texto na pasta data/documents  
3. **bash_command**: Para executar comandos bash e obter dados externos (com aprovação do usuário)

INSTRUÇÕES IMPORTANTES:

- Sempre analise a pergunta do usuário para determinar qual ferramenta é mais apropriada
- Para perguntas sobre dados estruturados, use sqlite_query
- Para perguntas sobre conteúdo de documentos, use document_search
- Para obter dados externos da web ou executar comandos do sistema, use bash_command
- Você pode combinar informações de múltiplas fontes quando necessário
- Sempre forneça respostas claras e úteis em português
- Se não tiver certeza sobre qual ferramenta usar, explique seu raciocínio ao usuário

Seja prestativo, preciso e sempre explique como você obteve as informações.`;
  }
}