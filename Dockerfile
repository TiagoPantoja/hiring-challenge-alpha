# Multi-stage build para NestJS
FROM node:18-alpine AS builder

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++ sqlite

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY src/ ./src/

# Build da aplicação
RUN npm run build

# Stage de produção
FROM node:18-alpine AS production

# Instalar dependências do sistema para runtime
RUN apk add --no-cache sqlite curl bash

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Copiar build da aplicação
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar dados e configurações
COPY --chown=nodejs:nodejs data/ ./data/
COPY --chown=nodejs:nodejs .env.example ./

# Criar diretórios necessários
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/v1/agent/health || exit 1

# Comando padrão
CMD ["node", "dist/main"]