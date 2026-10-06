import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'crypto';
import { AuthService } from './auth.service';

export type SocialLoginProvider = 'linkedin' | 'x';

type OAuthState = {
  provider: SocialLoginProvider;
  redirectUrl: string;
  callbackUrl: string;
  codeVerifier?: string;
  expiresAt: number;
  nonce: string;
};

type OAuthCredentials = { clientId: string; clientSecret: string };

@Injectable()
export class SocialAuthService {
  private readonly stateKey: Buffer;

  constructor(private readonly config: ConfigService, private readonly auth: AuthService) {
    const secret = this.config.get<string>('jwt.secret');
    if (!secret) throw new Error('JWT secret is required to secure social login state');
    this.stateKey = createHash('sha256').update(secret).digest();
  }

  async createAuthorizationUrl(provider: SocialLoginProvider, redirectUrl: string) {
    const credentials = this.getCredentials(provider);
    const callbackUrl = this.getCallbackUrl(provider);
    const codeVerifier = provider === 'x' ? randomBytes(48).toString('base64url') : undefined;
    const state = this.encryptState({ provider, redirectUrl, callbackUrl, codeVerifier, expiresAt: Date.now() + 10 * 60 * 1000, nonce: randomUUID() });
    const endpoint = provider === 'linkedin'
      ? 'https://www.linkedin.com/oauth/v2/authorization'
      : 'https://x.com/i/oauth2/authorize';
    const authorizeUrl = new URL(endpoint);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', credentials.clientId);
    authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
    authorizeUrl.searchParams.set('state', state);

    if (provider === 'linkedin') {
      authorizeUrl.searchParams.set('scope', 'openid profile email');
    } else {
      const challenge = createHash('sha256').update(codeVerifier!).digest('base64url');
      authorizeUrl.searchParams.set('scope', 'tweet.read users.read users.email');
      authorizeUrl.searchParams.set('code_challenge', challenge);
      authorizeUrl.searchParams.set('code_challenge_method', 'S256');
    }

    return authorizeUrl.toString();
  }

  getRedirectUrlFromState(stateValue: string, provider: SocialLoginProvider) {
    const state = this.decryptState(stateValue);
    if (state.provider !== provider) throw new BadRequestException('Invalid social login provider state');
    return state.redirectUrl;
  }

  async complete(provider: SocialLoginProvider, code: string, stateValue: string) {
    const state = this.decryptState(stateValue);
    if (state.provider !== provider || !code || state.expiresAt < Date.now()) {
      throw new BadRequestException('Social sign-in expired. Please try again.');
    }

    const credentials = this.getCredentials(provider);
    const accessToken = await this.exchangeCode(provider, code, state, credentials);
    const profile = await this.fetchProfile(provider, accessToken);
    const authResponse = await this.auth.authenticateWithExternalProfile(profile);
    return { redirectUrl: state.redirectUrl, authResponse };
  }

  private async exchangeCode(provider: SocialLoginProvider, code: string, state: OAuthState, credentials: OAuthCredentials) {
    const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: state.callbackUrl });
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (provider === 'linkedin') {
      body.set('client_id', credentials.clientId);
      body.set('client_secret', credentials.clientSecret);
    } else {
      body.set('code_verifier', state.codeVerifier || '');
      headers.Authorization = `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')}`;
    }

    const endpoint = provider === 'linkedin'
      ? 'https://www.linkedin.com/oauth/v2/accessToken'
      : 'https://api.x.com/2/oauth2/token';
    const response = await fetch(endpoint, { method: 'POST', headers, body, signal: AbortSignal.timeout(10000) });
    const payload = await response.json() as { access_token?: string };
    if (!response.ok || !payload.access_token) throw new BadRequestException('The provider could not complete sign-in');
    return payload.access_token;
  }

  private async fetchProfile(provider: SocialLoginProvider, accessToken: string) {
    if (provider === 'linkedin') {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      });
      const profile = await response.json() as { email?: string; email_verified?: boolean; given_name?: string; family_name?: string; picture?: string };
      if (!response.ok || !profile.email || profile.email_verified !== true) {
        throw new BadRequestException('LinkedIn did not provide a verified email address');
      }
      return { email: profile.email, firstName: profile.given_name, lastName: profile.family_name, avatar: profile.picture };
    }

    const response = await fetch('https://api.x.com/2/users/me?user.fields=confirmed_email,name,username,profile_image_url', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    });
    const payload = await response.json() as { data?: { confirmed_email?: string; name?: string; profile_image_url?: string } };
    if (!response.ok || !payload.data?.confirmed_email) throw new BadRequestException('X did not provide a confirmed email address. Check the app email permission.');
    const [firstName, ...lastNameParts] = (payload.data.name || 'User').trim().split(/\s+/);
    return { email: payload.data.confirmed_email, firstName, lastName: lastNameParts.join(' '), avatar: payload.data.profile_image_url };
  }

  private getCredentials(provider: SocialLoginProvider): OAuthCredentials {
    const prefix = provider === 'linkedin' ? 'LINKEDIN' : 'X';
    const clientId = this.config.get<string>(`socialProfiles.${provider}.clientId`) || process.env[`${prefix}_CLIENT_ID`];
    const clientSecret = this.config.get<string>(`socialProfiles.${provider}.clientSecret`) || process.env[`${prefix}_CLIENT_SECRET`];
    if (!clientId || !clientSecret) throw new ServiceUnavailableException(`${provider} sign-in is not configured`);
    return { clientId, clientSecret };
  }

  private getCallbackUrl(provider: SocialLoginProvider) {
    const prefix = provider === 'linkedin' ? 'LINKEDIN' : 'X';
    const configured = process.env[`${prefix}_AUTH_CALLBACK_URL`];
    if (configured) return configured;
    const apiOrigin = (process.env.API_PUBLIC_URL || `http://localhost:${this.config.get<number>('app.port') || process.env.PORT || 3000}`).replace(/\/$/, '');
    const apiPrefix = this.config.get<string>('app.apiPrefix') || 'api';
    return `${apiOrigin}/${apiPrefix}/auth/${provider}/callback`;
  }

  private encryptState(state: OAuthState) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.stateKey, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(state), 'utf8'), cipher.final()]);
    return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
  }

  private decryptState(value: string): OAuthState {
    try {
      const [ivValue, tagValue, encryptedValue] = value.split('.');
      if (!ivValue || !tagValue || !encryptedValue) throw new Error('Malformed state');
      const decipher = createDecipheriv('aes-256-gcm', this.stateKey, Buffer.from(ivValue, 'base64url'));
      decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
      const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
      const state = JSON.parse(decrypted) as OAuthState;
      if (!['linkedin', 'x'].includes(state.provider) || typeof state.redirectUrl !== 'string' || typeof state.callbackUrl !== 'string') throw new Error('Invalid state');
      return state;
    } catch {
      throw new BadRequestException('Invalid social sign-in state');
    }
  }
}