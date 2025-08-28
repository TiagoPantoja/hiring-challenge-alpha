import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { ProcessQueryDto } from '../agent/dto/process-query.dto';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedClients = new Map<string, Socket>();

  constructor(private readonly agentService: AgentService) {}

  handleConnection(client: Socket): void {
    this.logger.log(`Cliente conectado: ${client.id}`);
    this.connectedClients.set(client.id, client);

    // Enviar mensagem de boas-vindas
    client.emit('welcome', {
      message: 'Conectado ao Multi-Source AI Agent',
      clientId: client.id,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('chat_message')
  async handleChatMessage(
    @MessageBody() data: ProcessQueryDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      this.logger.log(`Mensagem recebida de ${client.id}: ${data.query}`);

      client.emit('processing', {
        message: 'Processando sua pergunta...',
        timestamp: new Date().toISOString()
      });

      const response = await this.agentService.processQuery(data);

      client.emit('chat_response', {
        ...response,
        clientId: client.id
      });

      this.logger.log(`Resposta enviada para ${client.id}`);

    } catch (error) {
      this.logger.error(`Erro ao processar mensagem de ${client.id}:`, error);

      client.emit('error', {
        message: `Erro ao processar mensagem: ${(error as Error).message}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  @SubscribeMessage('get_suggestions')
  async handleGetSuggestions(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      const suggestions = await this.agentService.getSuggestedQuestions();

      client.emit('suggestions', {
        suggestions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      client.emit('error', {
        message: `Erro ao obter sugestões: ${(error as Error).message}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  @SubscribeMessage('get_stats')
  async handleGetStats(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      const stats = await this.agentService.getDataSourceStats();

      client.emit('stats', {
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      client.emit('error', {
        message: `Erro ao obter estatísticas: ${(error as Error).message}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  broadcastMessage(event: string, data: any): void {
    this.server.emit(event, data);
  }

  sendToClient(clientId: string, event: string, data: any): void {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}