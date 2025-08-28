import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tool } from '@langchain/core/tools';
import { exec } from 'child_process';

@Injectable()
export class BashService {
  private readonly logger = new Logger(BashService.name);
  private readonly enableBashCommands: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enableBashCommands = this.configService.get('ENABLE_BASH_COMMANDS') === 'true';
  }

  async createTool(): Promise<Tool> {
    return new BashTool(this.enableBashCommands);
  }

  async executeCommand(command: string, description?: string): Promise<any> {
    if (!this.enableBashCommands) {
      throw new Error('Comandos bash estão desabilitados');
    }

    if (this.isDangerousCommand(command)) {
      throw new Error('Comando bloqueado por motivos de segurança');
    }

    return new Promise((resolve, reject) => {
      exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Erro ao executar comando: ${error.message}`));
          return;
        }

        resolve({
          comando: command,
          descricao: description,
          saida_padrao: stdout,
          saida_erro: stderr,
          sucesso: true,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  private isDangerousCommand(command: string): boolean {
    const dangerousPatterns = [
      /rm\s+-rf/,
      /sudo/,
      /passwd/,
      /chmod\s+777/,
      />/,
      /dd\s+if=/,
      /mkfs/,
      /fdisk/,
      /format/,
      /del\s+/,
      /shutdown/,
      /reboot/,
      /halt/,
      /kill\s+-9/,
      /killall/
    ];

    return dangerousPatterns.some(pattern => pattern.test(command.toLowerCase()));
  }
}

class BashTool extends Tool {
  name = "bash_command";
  description = `
    Execute bash commands to gather external data (requires user approval).
    Input should be a JSON string with 'command' and 'description' fields.
    Example: {"command": "curl -s https://api.github.com/users/octocat", "description": "Fetch GitHub user data"}
    Common use cases: curl for web APIs, wget for downloads, grep for text processing.
  `;

  constructor(private enableBashCommands: boolean) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      if (!this.enableBashCommands) {
        return "Erro: Comandos bash estão desabilitados. Configure ENABLE_BASH_COMMANDS=true no .env para habilitar.";
      }

      const { command, description } = JSON.parse(input);

      if (!command) {
        throw new Error('Comando é obrigatório');
      }

      if (this.isDangerousCommand(command)) {
        return "Erro: Comando bloqueado por motivos de segurança. Comandos perigosos não são permitidos.";
      }

      return new Promise((resolve, reject) => {
        exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
          if (error) {
            resolve(`Erro ao executar comando: ${error.message}`);
            return;
          }

          const result = {
            comando: command,
            descricao: description,
            saida_padrao: stdout,
            saida_erro: stderr,
            sucesso: true,
            timestamp: new Date().toISOString()
          };

          resolve(JSON.stringify(result, null, 2));
        });
      });

    } catch (error) {
      return `Erro: ${(error as Error).message}`;
    }
  }

  private isDangerousCommand(command: string): boolean {
    const dangerousPatterns = [
      /rm\s+-rf/,
      /sudo/,
      /passwd/,
      /chmod\s+777/,
      />/,
      /dd\s+if=/,
      /mkfs/,
      /fdisk/,
      /format/,
      /del\s+/,
      /shutdown/,
      /reboot/,
      /halt/,
      /kill\s+-9/,
      /killall/
    ];

    return dangerousPatterns.some(pattern => pattern.test(command.toLowerCase()));
  }
}