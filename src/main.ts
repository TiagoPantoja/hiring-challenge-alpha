import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  try {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('Multi-Source AI Agent API')
      .setDescription('API para assistente IA com múltiplas fontes de dados')
      .setVersion('1.0')
      .addTag('agent', 'Operações do agente IA')
      .addTag('tools', 'Ferramentas do agente')
      .addTag('history', 'Histórico de conversas')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    app.setGlobalPrefix('api/v1');

    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log(
      `Multi-Source AI Agent API rodando em: http://localhost:${port}`,
    );
    console.log(`Documentação Swagger: http://localhost:${port}/api/docs`);
  } catch (error) {
    console.error('Erro ao inicializar a aplicação:', error);
    process.exit(1);
  }
}

void bootstrap();
