import { Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthResilienceService {
  private readonly logger = new Logger(AuthResilienceService.name);

  async execute<T>(
    operationName: string,
    operation: () => Promise<T>,
    options?: {
      fallbackValue?: T;
      fallbackError?: Error;
      context?: Record<string, unknown>;
      logLevel?: 'warn' | 'error';
    },
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const level = options?.logLevel ?? 'error';
      const context = options?.context ?? {};
      const detail = error instanceof Error ? error.message : String(error);

      if (level === 'warn') {
        this.logger.warn(`Auth dependency warning [${operationName}] ${detail}`, context);
      } else {
        this.logger.error(`Auth dependency failure [${operationName}] ${detail}`, context);
      }

      if (options?.fallbackValue !== undefined) {
        return options.fallbackValue;
      }

      if (options?.fallbackError) {
        throw options.fallbackError;
      }

      throw new ServiceUnavailableException('Authentication is temporarily unavailable. Please try again later.');
    }
  }

  async sendOptionalEmailNotification(message: string, recipient: string): Promise<boolean> {
    try {
      this.logger.log(`Optional email notification requested for ${recipient}: ${message}`);
      return true;
    } catch (error) {
      this.logger.warn(`Email notification skipped for ${recipient}`, error);
      return false;
    }
  }

  async handleCredentialCheckFailure(operationName: string, error: unknown): Promise<never> {
    const detail = error instanceof Error ? error.message : String(error);
    this.logger.error(`Credential verification failed during ${operationName}: ${detail}`);
    throw new UnauthorizedException('Invalid email or password');
  }
}
