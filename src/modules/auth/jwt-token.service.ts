import { Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { JwtConfig, resolveJwtConfig } from '@config/jwt.config';

@Injectable()
export class JwtTokenService {
  private readonly logger = new Logger(JwtTokenService.name);
  private readonly jwtConfig: JwtConfig;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtConfig = this.readJwtConfig();
  }

  private readJwtConfig(): JwtConfig {
    const configured = this.configService.get<Partial<JwtConfig> | undefined>('jwt');
    return resolveJwtConfig(configured ?? {});
  }

  async issueTokenPair(payload: Record<string, unknown>) {
    try {
      const tokenId = randomUUID();
      const basePayload = {
        ...payload,
        jti: tokenId,
      };

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(basePayload, {
          secret: this.getSigningKey('access'),
          expiresIn: this.jwtConfig.accessTokenExpiry,
          algorithm: this.jwtConfig.algorithm,
          ...(this.jwtConfig.issuer ? { issuer: this.jwtConfig.issuer } : {}),
          ...(this.jwtConfig.audience ? { audience: this.jwtConfig.audience } : {}),
        }),
        this.jwtService.signAsync(
          {
            ...basePayload,
            tokenType: 'refresh',
          },
          {
            secret: this.getSigningKey('refresh'),
            expiresIn: this.jwtConfig.refreshTokenExpiry,
            algorithm: this.jwtConfig.algorithm,
            ...(this.jwtConfig.issuer ? { issuer: this.jwtConfig.issuer } : {}),
            ...(this.jwtConfig.audience ? { audience: this.jwtConfig.audience } : {}),
          },
        ),
      ]);

      return {
        accessToken,
        refreshToken,
        expiresIn: this.toSeconds(this.jwtConfig.accessTokenExpiry),
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(`JWT token generation failed: ${detail}`);
      throw new ServiceUnavailableException('Authentication is temporarily unavailable. Please try again later.');
    }
  }

  async verifyAccessToken(token: string): Promise<unknown> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.getVerificationKey('access'),
        algorithms: [this.jwtConfig.algorithm],
        ...(this.jwtConfig.issuer ? { issuer: this.jwtConfig.issuer } : {}),
        ...(this.jwtConfig.audience ? { audience: this.jwtConfig.audience } : {}),
        ...(this.jwtConfig.clockTolerance ? { clockTolerance: Number(this.jwtConfig.clockTolerance) } : {}),
      });
    } catch (error) {
      this.logger.warn('Access token verification failed');
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<unknown> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.getVerificationKey('refresh'),
        algorithms: [this.jwtConfig.algorithm],
        ...(this.jwtConfig.issuer ? { issuer: this.jwtConfig.issuer } : {}),
        ...(this.jwtConfig.audience ? { audience: this.jwtConfig.audience } : {}),
        ...(this.jwtConfig.clockTolerance ? { clockTolerance: Number(this.jwtConfig.clockTolerance) } : {}),
      });
    } catch (error) {
      this.logger.warn('Refresh token verification failed');
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  getPassportOptions() {
    return {
      secretOrKey: this.getVerificationKey('access'),
      algorithms: [this.jwtConfig.algorithm],
      ...(this.jwtConfig.issuer ? { issuer: this.jwtConfig.issuer } : {}),
      ...(this.jwtConfig.audience ? { audience: this.jwtConfig.audience } : {}),
      ...(this.jwtConfig.clockTolerance ? { clockTolerance: Number(this.jwtConfig.clockTolerance) } : {}),
    };
  }

  private getSigningKey(kind: 'access' | 'refresh'): string {
    if (this.jwtConfig.algorithm === 'RS256') {
      return kind === 'access' ? (this.jwtConfig.privateKey ?? this.jwtConfig.secret) : (this.jwtConfig.refreshPrivateKey ?? this.jwtConfig.refreshSecret);
    }

    return kind === 'access' ? this.jwtConfig.secret : this.jwtConfig.refreshSecret;
  }

  private getVerificationKey(kind: 'access' | 'refresh'): string {
    if (this.jwtConfig.algorithm === 'RS256') {
      return kind === 'access' ? (this.jwtConfig.publicKey ?? this.jwtConfig.secret) : (this.jwtConfig.refreshPublicKey ?? this.jwtConfig.refreshSecret);
    }

    return kind === 'access' ? this.jwtConfig.secret : this.jwtConfig.refreshSecret;
  }

  private toSeconds(value: string): number {
    const match = /^(-?\d+)(ms|s|m|h|d|w)$/i.exec(value.trim());
    if (!match) {
      return 60 * 60 * 24;
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    const multipliers: Record<string, number> = {
      ms: 1 / 1000,
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 60 * 60 * 24,
      w: 60 * 60 * 24 * 7,
    };

    return Math.max(1, Math.floor(amount * multipliers[unit]));
  }
}
