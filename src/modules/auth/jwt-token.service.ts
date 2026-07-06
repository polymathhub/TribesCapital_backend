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

  async issueTokenPair(payload: Record<string, unknown>) {
    const ctx = '[JWT]';
    const start = Date.now();
    this.logger.log(`${new Date().toISOString()} ${ctx}[1] Entering issueTokenPair()`);
    this.logger.log(`${new Date().toISOString()} ${ctx}[2] Payload keys: ${Object.keys(payload).join(',')}`);

    try {
      const tokenId = randomUUID();
      const basePayload = { ...payload, jti: tokenId };

      this.logger.log(`${new Date().toISOString()} ${ctx}[3] Before signAsync(access)`);
      const tAccess = Date.now();
      const accessToken = await this.jwtService.signAsync(basePayload, this.getSignOptions('access'));
      this.logger.log(`${new Date().toISOString()} ${ctx}[4] After signAsync(access) (duration=${Date.now()-tAccess}ms)`);

      this.logger.log(`${new Date().toISOString()} ${ctx}[5] Before signAsync(refresh)`);
      const tRefresh = Date.now();
      const refreshToken = await this.jwtService.signAsync({ ...basePayload, tokenType: 'refresh' }, this.getSignOptions('refresh'));
      this.logger.log(`${new Date().toISOString()} ${ctx}[6] After signAsync(refresh) (duration=${Date.now()-tRefresh}ms)`);

      const expiresIn = this.toSeconds(this.jwtConfig.accessTokenExpiry);
      this.logger.log(`${new Date().toISOString()} ${ctx}[7] expiresIn calculated: ${expiresIn}`);

      const total = Date.now() - start;
      this.logger.log(`${new Date().toISOString()} ${ctx}[8] issueTokenPair completed (totalDuration=${total}ms)`);

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      // ensure error details are printed to console for debugging
      // eslint-disable-next-line no-console
      console.error(error);
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(`${new Date().toISOString()} ${ctx}[ERR] JWT token generation failed: ${detail}`);
      throw new ServiceUnavailableException('Authentication is temporarily unavailable. Please try again later.');
    }
  }

  async verifyAccessToken(token: string): Promise<unknown> {
    try {
      return await this.jwtService.verifyAsync(token, this.getVerifyOptions('access'));
    } catch {
      this.logger.warn('Access token verification failed');
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<unknown> {
    try {
      return await this.jwtService.verifyAsync(token, this.getVerifyOptions('refresh'));
    } catch {
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

  private readJwtConfig(): JwtConfig {
    const configured = this.configService.get<Partial<JwtConfig> | undefined>('jwt');
    return resolveJwtConfig(configured ?? {});
  }

  private getSignOptions(kind: 'access' | 'refresh') {
    return {
      secret: this.getSigningKey(kind),
      expiresIn: kind === 'access' ? this.jwtConfig.accessTokenExpiry : this.jwtConfig.refreshTokenExpiry,
      algorithm: this.jwtConfig.algorithm,
      ...(this.jwtConfig.issuer ? { issuer: this.jwtConfig.issuer } : {}),
      ...(this.jwtConfig.audience ? { audience: this.jwtConfig.audience } : {}),
    };
  }

  private getVerifyOptions(kind: 'access' | 'refresh') {
    return {
      secret: this.getVerificationKey(kind),
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
