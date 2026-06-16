import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

export interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failure';
  metadata?: Record<string, any>;
}

export interface LoginAttemptData {
  userId?: string;
  email: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log authentication-related audit event
   */
  async logAuthEvent(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId || '',
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          changes: data.changes,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          status: data.status || 'success',
          metadata: data.metadata,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
    }
  }

  /**
   * Log login attempt (successful or failed)
   */
  async logLoginAttempt(data: LoginAttemptData): Promise<void> {
    try {
      await this.prisma.loginAttempt.create({
        data: {
          userId: data.userId,
          email: data.email,
          success: data.success,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          failureReason: data.failureReason,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log login attempt', error);
      // Don't throw - logging should never break the auth flow
    }
  }

  /**
   * Get login attempts for rate limiting
   */
  async getRecentLoginAttempts(
    email: string,
    minutes: number = 15,
  ): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const count = await this.prisma.loginAttempt.count({
      where: {
        email,
        success: false,
        createdAt: {
          gte: since,
        },
      },
    });

    return count;
  }

  /**
   * Get login attempts by IP for DDoS protection
   */
  async getLoginAttemptsByIp(
    ipAddress: string,
    minutes: number = 15,
  ): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const count = await this.prisma.loginAttempt.count({
      where: {
        ipAddress,
        success: false,
        createdAt: {
          gte: since,
        },
      },
    });

    return count;
  }

  /**
   * Get suspicious login activity
   */
  async getSuspiciousActivity(
    userId: string,
    hours: number = 24,
  ): Promise<any[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const attempts = await this.prisma.loginAttempt.findMany({
      where: {
        userId,
        success: false,
        createdAt: {
          gte: since,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return attempts;
  }

  /**
   * Get audit logs for user
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 50,
  ): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get audit logs by action (e.g., "login", "register", "password_reset")
   */
  async getAuditLogsByAction(
    action: string,
    limit: number = 50,
  ): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
