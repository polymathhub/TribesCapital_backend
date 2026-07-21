import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  private isDatabaseDisabled(): boolean {
    const value =
      process.env.DB_SKIP ||
      process.env.NO_DATABASE_MODE ||
      process.env.DATABASE_SKIP ||
      process.env.NO_DB;

    if (!value) {
      return false;
    }

    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }

  async onModuleInit() {
    if (this.isDatabaseDisabled()) {
      this.logger.warn('Database connection skipped because DB_SKIP/NO_DATABASE_MODE is enabled.');
      return;
    }

    try {
      this.logger.log(`${new Date().toISOString()} [PRISMA][1] Connecting to database`);
      const t = Date.now();
      await this.$connect();
      this.logger.log(`${new Date().toISOString()} [PRISMA][2] Database connected (duration=${Date.now()-t}ms)`);
    } catch (error) {
      this.logger.error('Database connection failed during startup. Application cannot continue without a database.', error instanceof Error ? error.stack : String(error));
      throw error;
    }
    // Prisma query middleware to log all queries, durations and errors
    this.$use(async (params, next) => {
      const start = Date.now();
      // Log query details (model & action). Avoid logging raw params that may contain secrets.
      const ctx = `[PRISMA] ${params.model || '<generic>'}.${params.action}`;
      this.logger.log(`${new Date().toISOString()} ${ctx} [Q1] Executing`);
      try {
        const result = await next(params);
        this.logger.log(`${new Date().toISOString()} ${ctx} [Q2] Completed (duration=${Date.now()-start}ms)`);
        return result;
      } catch (e) {
        this.logger.error(`${new Date().toISOString()} ${ctx} [ERR] Query failed (duration=${Date.now()-start}ms)`, e instanceof Error ? e.stack : String(e));
        throw e;
      }
    });
  }

  async onModuleDestroy() {
    if (this.isDatabaseDisabled()) {
      this.logger.warn('Database disconnect skipped because DB_SKIP/NO_DATABASE_MODE is enabled.');
      return;
    }

    try {
      await this.$disconnect();
    } catch (error) {
      this.logger.warn('Database disconnect failed.', error);
    }
  }
}
