#  Multi-Source AI Agent API

Uma API REST que responde perguntas consultando bancos de dados SQLite, documentos de texto e comandos Bash. 

## O que o projeto faz?

- **Consulta banco de dados** para encontrar informações
- **Busca em documentos** para responder perguntas
- **Executa comandos Bash** para obter dados do sistema
- **Escolhe** a melhor fonte de informação
- **Conversa naturalmente** através de uma API REST ou WebSocket

## Pré-requisitos
- Node.js 18
- Chave API OpenAI
- Docker

### Instalação Rápida

1. **Clone o projeto**
```bash
git clone https://github.com/TiagoPantoja/hiring-challenge-alpha.git
cd hiring-challenge-alpha
```

2. **Configure a chave API OpenAI**
```bash
cp .env.example .env
```

Edite o arquivo .env e adicione sua chave da OpenAI:

```bash
OPENAI_API_KEY=sk-sua-chave-aqui
OPENAI_MODEL=gpt-4o-mini
ENABLE_BASH_COMMANDS=true
```

3. **Execute com Docker**
```bash
docker-compose up --build
```

ou execute localmente:

```bash
npm install
npm run start:dev
```

4. **Teste se está funcionando**
```bash
curl http://localhost:3000/api/v1/agent/health
```

## Usando a API

**Documentação Swagger**

Acesse: http://localhost:3000/api/docs

**Endpoints Principais**

1. **Fazer uma Pergunta**
```bash
curl -X POST http://localhost:3000/api/v1/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "O que você sabe sobre Adam Smith?"
  }'
```

**Resposta**:
```json
{
  "answer": "Adam Smith foi um economista escocês...",
  "success": true,
  "duration": 2500,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

2. **Verificar Estatísticas**
```bash
curl http://localhost:3000/api/v1/agent/stats
```

**Resposta**:
```json
{
  "sqlite": {
    "count": 2,
    "databases": ["vendas.db", "clientes.db"]
  },
  "documents": {
    "count": 3,
    "files": ["manual.txt", "faq.md", "politicas.txt"]
  },
  "bash": {
    "enabled": true
  }
}
```

**3. Obter Sugestões**
```bash
curl http://localhost:3000/api/v1/agent/suggestions
```

**Resposta**:
```json
{
  "suggestions": [
    "Quem é Adam Smith?",
    "Qual é a política de devolução?",
    "Quantos clientes temos no banco de dados?"
  ]
}
```

### Exemplos de Perguntas
**Para Documentos**
```bash
# Buscar informações específicas
curl -X POST http://localhost:3000/api/v1/agent/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Qual é a política de férias da empresa?"}'

# Buscar por pessoa ou conceito
curl -X POST http://localhost:3000/api/v1/agent/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Me fale sobre economia clássica"}'
```

**Para Banco de Dados**
```bash
# Explorar estrutura
curl -X POST http://localhost:3000/api/v1/agent/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Que tabelas existem no banco vendas.db?"}'

# Consultar dados
curl -X POST http://localhost:3000/api/v1/agent/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Quantos clientes temos cadastrados?"}'

# Análises
curl -X POST http://localhost:3000/api/v1/agent/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Quais foram as vendas do último mês?"}'
```

**Para Comandos Bash**
```bash
# Informações do sistema
curl -X POST http://localhost:3000/api/v1/agent/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Qual é a data e hora atual?"}'
```

### Histórico de Conversas (feature adicional)

**Ver Histórico**
```bash
curl "http://localhost:3000/api/v1/history?limit=5"
```

**Buscar no Histórico**
```bash
curl http://localhost:3000/api/v1/history/stats
```

**Estatísticas do Histórico**
```bash
curl http://localhost:3000/api/v1/history/stats
```

### Chat em Tempo Real com WebSocket (feature adicional)

**Conectar via JavaScript**
```javascript
const socket = io('http://localhost:3000');

// Conectar
socket.on('welcome', (data) => {
  console.log('Conectado:', data.message);
});

// Enviar pergunta
socket.emit('chat_message', {
  query: 'O que você sabe sobre economia?'
});

// Receber resposta
socket.on('chat_response', (response) => {
  console.log('Resposta:', response.answer);
});
```

### Configurações de Segurança
```bash
# Desabilitar comandos bash
ENABLE_BASH_COMMANDS=false

# Configurar CORS
CORS_ORIGINS=http://localhost:3000,https://meusite.com

# Rate limiting
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX=60
```

### Configurações de Performance
```bash 
# Temperatura (0.0 = mais determinístico, 1.0 = mais criativo)
OPENAI_TEMPERATURE=0.1

# Máximo de tokens por resposta
OPENAI_MAX_TOKENS=1500

# Cache de respostas
ENABLE_RESPONSE_CACHE=true
CACHE_TTL=300
```

### Docker (feature adicional)

**API REST**
```bash
docker build -t ai-agent-api .
docker run -p 3000:3000 --env-file .env ai-agent-api
```


