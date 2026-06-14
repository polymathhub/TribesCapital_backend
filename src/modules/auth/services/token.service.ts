import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as axios from 'axios';

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

  private googlePublicKeysCache: Map<string, string> = new Map();
  private googlePublicKeysCacheExpiry: number = 0;
  private readonly GOOGLE_CERTS_URL =
    'https://www.googleapis.com/oauth2/v1/certs';

  /**
   * Fetch Google's public keys for verifying ID tokens
   */
  private async fetchGooglePublicKeys(): Promise<Map<string, string>> {
    const now = Date.now();

    // Use cache if available and not expired (1 hour)
    if (
      this.googlePublicKeysCache.size > 0 &&
      this.googlePublicKeysCacheExpiry > now
    ) {
      return this.googlePublicKeysCache;
    }

    try {
      const response = await axios.default.get(this.GOOGLE_CERTS_URL, {
        timeout: 5000,
      });

      const keysMap = new Map<string, string>();
      for (const [kid, cert] of Object.entries(response.data)) {
        keysMap.set(kid, cert as string);
      }

      this.googlePublicKeysCache = keysMap;
      this.googlePublicKeysCacheExpiry = now + 60 * 60 * 1000; // 1 hour

      this.logger.debug('Google public keys cached');
      return keysMap;
    } catch (error) {
      this.logger.error('Failed to fetch Google public keys', error);
      // If cache is empty, throw error
      if (this.googlePublicKeysCache.size === 0) {
        throw new Error('Unable to verify Google token - public keys unavailable');
      }
      // Otherwise use stale cache
      return this.googlePublicKeysCache;
    }
  }

  /**
   * Verify Google OAuth ID token with proper signature validation
   * Validates token format, signature, expiration, and audience
   */
  async verifyGoogleToken(
    idToken: string,
    expectedAudience?: string,
  ): Promise<{
    sub: string;
    email: string;
    email_verified: boolean;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
    aud: string;
    iss: string;
    iat: number;
    exp: number;
  }> {
    try {
      // Validate token format
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        throw new BadRequestException('Invalid token format');
      }

      // Decode header and payload WITHOUT verification first
      let header: any;
      let payload: any;

      try {
        header = JSON.parse(
          Buffer.from(parts[0], 'base64').toString('utf-8'),
        );
        payload = JSON.parse(
          Buffer.from(parts[1], 'base64').toString('utf-8'),
        );
      } catch {
        throw new BadRequestException('Invalid token encoding');
      }

      // Validate payload structure
      if (
        !payload.sub ||
        !payload.email ||
        !payload.iss ||
        !payload.aud ||
        !payload.exp
      ) {
        throw new BadRequestException('Missing required token claims');
      }

      // Validate issuer (must be Google)
      if (
        payload.iss !== 'https://accounts.google.com' &&
        payload.iss !== 'accounts.google.com'
      ) {
        throw new BadRequestException(
          'Invalid token issuer - must be from Google',
        );
      }

      // Validate expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new BadRequestException('Token has expired');
      }

      // Validate audience if provided
      if (expectedAudience) {
        const audiences = Array.isArray(payload.aud)
          ? payload.aud
          : [payload.aud];
        if (!audiences.includes(expectedAudience)) {
          this.logger.warn(
            `Token audience mismatch. Expected: ${expectedAudience}, Got: ${payload.aud}`,
          );
          throw new BadRequestException(
            'Token audience does not match application',
          );
        }
      }

      // Verify signature with Google's public key
      const publicKeys = await this.fetchGooglePublicKeys();
      const kid = header.kid;

      if (!kid || !publicKeys.has(kid)) {
        throw new BadRequestException('Unable to verify token signature');
      }

      const publicKey = publicKeys.get(kid);

      // Verify the token signature
      try {
        this.jwtService.verify(idToken, {
          publicKey,
          algorithms: ['RS256'],
        });
      } catch (verifyError: any) {
        this.logger.warn('Token signature verification failed', verifyError.message);
        throw new BadRequestException('Invalid token signature');
      }

      // Validate email is verified by Google
      if (payload.email_verified !== true) {
        this.logger.warn(
          `Email not verified by Google for: ${payload.email}`,
        );
        throw new BadRequestException('Email not verified by Google');
      }

      // Return validated payload
      return {
        sub: payload.sub,
        email: payload.email.toLowerCase(),
        email_verified: payload.email_verified,
        given_name: payload.given_name || '',
        family_name: payload.family_name || '',
        picture: payload.picture || '',
        locale: payload.locale || 'en',
        aud: payload.aud,
        iss: payload.iss,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Failed to verify Google token', error.message);
      throw new BadRequestException('Failed to verify Google token');
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
