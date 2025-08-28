export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.1'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1500', 10),
  },
  agent: {
    name: process.env.AGENT_NAME || 'MultiSourceAgent',
    maxIterations: parseInt(process.env.MAX_ITERATIONS || '10', 10),
    enableBashCommands: process.env.ENABLE_BASH_COMMANDS === 'true',
  },
  paths: {
    sqlite: process.env.SQLITE_PATH || './data/sqlite',
    documents: process.env.DOCUMENTS_PATH || './data/documents',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  history: {
    maxEntries: parseInt(process.env.MAX_HISTORY_ENTRIES || '50', 10),
  },
});