import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export interface TokenPayload {
  sub: string; // User ID
  email?: string;
  roles?: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly bcryptRounds = 12; // Industry standard

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate JWT access token with user claims
   */
  generateAccessToken(payload: TokenPayload): string {
    const tokenConfig = this.configService.get('jwt.access');

    return this.jwtService.sign(payload, {
      secret: tokenConfig.secret,
      expiresIn: tokenConfig.expiry,
      algorithm: 'HS256',
    });
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(userId: string): string {
    const tokenConfig = this.configService.get('jwt.refresh');

    return this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: tokenConfig.secret,
        expiresIn: tokenConfig.expiry,
        algorithm: 'HS256',
      },
    );
  }

  /**
   * Generate paired access and refresh tokens
   */
  generateTokenPair(payload: TokenPayload): TokenPair {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload.sub);
    const tokenConfig = this.configService.get('jwt.access');

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiryToSeconds(tokenConfig.expiry),
    };
  }

  /**
   * Verify and decode JWT token
   */
  verifyAccessToken(token: string): TokenPayload {
    const tokenConfig = this.configService.get('jwt.access');

    return this.jwtService.verify(token, {
      secret: tokenConfig.secret,
      algorithms: ['HS256'],
    });
  }

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: string): TokenPayload {
    const tokenConfig = this.configService.get('jwt.refresh');

    return this.jwtService.verify(token, {
      secret: tokenConfig.secret,
      algorithms: ['HS256'],
    });
  }

  /**
   * Generate secure random token for email verification/password reset
   * Returns both plain token (for email) and hash (for storage)
   */
  generateSecureToken(): {
    token: string;
    hash: string;
  } {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = this.hashToken(token);

    return { token, hash };
  }

  /**
   * Hash token for storage
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Verify token matches hash
   */
  verifyTokenHash(token: string, hash: string): boolean {
    const computed = this.hashToken(token);
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(hash),
    );
  }

  /**
   * Verify Google OAuth ID token signature
   * In production, should call Google's tokeninfo endpoint
   */
  async verifyGoogleToken(idToken: string): Promise<any> {
    try {
      // In production, verify with Google's API
      // For now, decode without verification (MUST be fixed in production)
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8'),
      );

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      this.logger.error('Failed to verify Google token', error);
      throw new Error('Invalid Google token');
    }
  }

  /**
   * Extract user ID from JWT without verification (use with caution)
   * Only use for extracting user ID to look up for rate limiting
   */
  extractUserIdFromToken(token: string): string | null {
    try {
      const decoded = this.jwtService.decode(token) as any;
      return decoded?.sub || null;
    } catch {
      return null;
    }
  }

  /**
   * Convert expiry string (e.g., "15m", "7d") to seconds
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }

  /**
   * Hash password for storage
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptRounds);
  }

  /**
   * Compare password with hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate short numeric code for email (alternative to token)
   * Useful for simple 2FA or code-based verification
   */
  generateNumericCode(length: number = 6): string {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .substring(0, length)
      .replace(/[a-f]/g, (c) => {
        return (parseInt(c, 16) % 10).toString();
      });
  }
}
