import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'crypto';

type Provider = 'linkedin' | 'x' | 'instagram';
type ImportState = { userId: string; provider: Provider; callbackUrl: string; codeVerifier?: string; expiresAt: number };
type ImportedProfile = { name?: string; bio?: string; location?: string; avatar?: string; profileUrl?: string; website?: string };

const PROVIDERS = new Set<Provider>(['linkedin', 'x', 'instagram']);

@Injectable()
export class SocialProfileImportService {
  private readonly stateKey: Buffer;

  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {
    const secret = this.config.get<string>('jwt.secret');
    if (!secret) throw new Error('JWT secret is required to secure social profile OAuth state');
    this.stateKey = createHash('sha256').update(secret).digest();
  }

  async createAuthorizationUrl(userId: string, providerValue: string) {
    if (!PROVIDERS.has(providerValue as Provider)) throw new BadRequestException('Unsupported professional profile provider');
    const provider = providerValue as Provider;
    const credentials = this.getCredentials(provider);
    const callbackUrl = this.getCallbackUrl();
    const codeVerifier = provider === 'x' ? randomBytes(48).toString('base64url') : undefined;
    const state = this.encryptState({ userId, provider, callbackUrl, codeVerifier, expiresAt: Date.now() + 10 * 60 * 1000 });
    const authorizeUrl = new URL(this.getAuthorizeEndpoint(provider));
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', credentials.clientId);
    authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
    authorizeUrl.searchParams.set('state', state);

    if (provider === 'linkedin') {
      authorizeUrl.searchParams.set('scope', 'openid profile email');
    } else if (provider === 'x') {
      const challenge = createHash('sha256').update(codeVerifier!).digest('base64url');
      authorizeUrl.searchParams.set('scope', 'users.read users.email offline.access');
      authorizeUrl.searchParams.set('code_challenge', challenge);
      authorizeUrl.searchParams.set('code_challenge_method', 'S256');
    } else {
      authorizeUrl.searchParams.set('enable_fb_login', '0');
      authorizeUrl.searchParams.set('scope', 'instagram_business_basic');
    }

    return { authorizeUrl: authorizeUrl.toString() };
  }

  async complete(code: string, stateValue: string) {
    const state = this.decryptState(stateValue);
    if (!code || state.expiresAt < Date.now()) throw new BadRequestException('The professional profile authorization expired. Please try again.');
    const credentials = this.getCredentials(state.provider);
    const token = await this.exchangeCode(state, code, credentials);
    const profile = await this.fetchProfile(state.provider, token);
    await this.fillEmptyFields(state.userId, state.provider, profile);
    return { provider: state.provider };
  }

  getFrontendOrigin() {
    const configured = process.env.SOCIAL_PROFILE_FRONTEND_URL || this.config.get<string>('app.corsOrigin') || 'http://localhost:5173';
    return configured.split(',').map((origin) => origin.trim()).filter(Boolean)[0] || 'http://localhost:5173';
  }

  readProviderFromState(value: string) {
    return this.decryptState(value).provider;
  }

  private async fillEmptyFields(userId: string, provider: Provider, profile: ImportedProfile) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, firstName: true, lastName: true, occupation: true, bio: true, address: true, avatar: true, socialLink: true, socialLinks: true },
    });
    if (!current) throw new NotFoundException('Profile not found');
    const data: Prisma.UserUpdateInput = {};
    if (!current.displayName && profile.name) data.displayName = profile.name.trim().slice(0, 120);
    if (profile.name) {
      const [firstName, ...lastNameParts] = profile.name.trim().split(/\s+/);
      if (!current.firstName && firstName) data.firstName = firstName.slice(0, 80);
      if (!current.lastName && lastNameParts.length) data.lastName = lastNameParts.join(' ').slice(0, 80);
    }
    if (!current.bio && profile.bio) data.bio = profile.bio.trim().slice(0, 300);
    if (!current.address && profile.location) data.address = profile.location.trim().slice(0, 120);
    if (!current.avatar && profile.avatar) data.avatar = profile.avatar;

    const existingLinks = Array.isArray(current.socialLinks) ? current.socialLinks.filter((link): link is string => typeof link === 'string') : [];
    const links = [profile.profileUrl, profile.website].filter((link): link is string => Boolean(link && /^https:\/\//i.test(link)));
    const nextLinks = [...new Set([...existingLinks, ...links])].slice(0, 8);
    if (nextLinks.length !== existingLinks.length) {
      data.socialLinks = nextLinks;
      if (!current.socialLink) data.socialLink = nextLinks[0];
    }
    if (Object.keys(data).length) await this.prisma.user.update({ where: { id: userId }, data });
  }

  private async exchangeCode(state: ImportState, code: string, credentials: { clientId: string; clientSecret: string }) {
    if (state.provider === 'linkedin') {
      const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: state.callbackUrl, client_id: credentials.clientId, client_secret: credentials.clientSecret });
      return this.requestToken('https://www.linkedin.com/oauth/v2/accessToken', body);
    }
    if (state.provider === 'x') {
      const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: state.callbackUrl, code_verifier: state.codeVerifier || '' });
      return this.requestToken('https://api.x.com/2/oauth2/token', body, credentials);
    }
    const body = new URLSearchParams({ client_id: credentials.clientId, client_secret: credentials.clientSecret, grant_type: 'authorization_code', redirect_uri: state.callbackUrl, code });
    return this.requestToken('https://api.instagram.com/oauth/access_token', body);
  }

  private async requestToken(url: string, body: URLSearchParams, basicAuth?: { clientId: string; clientSecret: string }) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(basicAuth ? { Authorization: `Basic ${Buffer.from(`${basicAuth.clientId}:${basicAuth.clientSecret}`).toString('base64')}` } : {}) },
      body,
    });
    const payload = await response.json() as { access_token?: string; error_description?: string; error?: string };
    if (!response.ok || !payload.access_token) throw new BadRequestException(payload.error_description || payload.error || 'Professional profile authorization failed');
    return payload.access_token;
  }

  private async fetchProfile(provider: Provider, accessToken: string): Promise<ImportedProfile> {
    if (provider === 'linkedin') {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
      const profile = await response.json() as { name?: string; picture?: string };
      if (!response.ok) throw new BadRequestException('Could not read the authorized LinkedIn profile');
      return { name: profile.name, avatar: profile.picture };
    }
    if (provider === 'x') {
      const response = await fetch('https://api.x.com/2/users/me?user.fields=name,username,description,location,profile_image_url,url', { headers: { Authorization: `Bearer ${accessToken}` } });
      const payload = await response.json() as { data?: { name?: string; username?: string; description?: string; location?: string; profile_image_url?: string; url?: string } };
      if (!response.ok || !payload.data) throw new BadRequestException('Could not read the authorized X profile');
      return { name: payload.data.name, bio: payload.data.description, location: payload.data.location, avatar: payload.data.profile_image_url, profileUrl: payload.data.username ? `https://x.com/${payload.data.username}` : undefined, website: payload.data.url };
    }
    const graphVersion = process.env.INSTAGRAM_GRAPH_VERSION || 'v23.0';
    const response = await fetch(`https://graph.instagram.com/${graphVersion}/me?fields=user_id,username,name,profile_picture_url,biography,website&access_token=${encodeURIComponent(accessToken)}`);
    const profile = await response.json() as { username?: string; name?: string; profile_picture_url?: string; biography?: string; website?: string };
    if (!response.ok) throw new BadRequestException('Could not read the authorized Instagram profile');
    return { name: profile.name, bio: profile.biography, avatar: profile.profile_picture_url, profileUrl: profile.username ? `https://www.instagram.com/${profile.username}/` : undefined, website: profile.website };
  }

  private getCredentials(provider: Provider) {
    const prefix = provider === 'linkedin' ? 'LINKEDIN' : provider === 'x' ? 'X' : 'INSTAGRAM';
    const clientId = this.config.get<string>(`socialProfiles.${provider}.clientId`) || process.env[`${prefix}_CLIENT_ID`];
    const clientSecret = this.config.get<string>(`socialProfiles.${provider}.clientSecret`) || process.env[`${prefix}_CLIENT_SECRET`];
    if (!clientId || !clientSecret) throw new ServiceUnavailableException(`${provider} profile import is not configured`);
    return { clientId, clientSecret };
  }

  private getAuthorizeEndpoint(provider: Provider) {
    if (provider === 'linkedin') return 'https://www.linkedin.com/oauth/v2/authorization';
    if (provider === 'x') return 'https://x.com/i/oauth2/authorize';
    return 'https://www.instagram.com/oauth/authorize';
  }

  private getCallbackUrl() {
    const configured = process.env.SOCIAL_PROFILE_CALLBACK_URL;
    if (configured) return configured;
    const apiOrigin = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
    const apiPrefix = this.config.get<string>('app.apiPrefix') || 'api';
    return `${apiOrigin.replace(/\/$/, '')}/${apiPrefix}/users/social-profiles/callback`;
  }

  private encryptState(state: ImportState) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.stateKey, iv);
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify({ ...state, nonce: randomUUID() }), 'utf8'), cipher.final()]);
    return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
  }

  private decryptState(value: string): ImportState {
    try {
      const [ivValue, tagValue, ciphertextValue] = value.split('.');
      if (!ivValue || !tagValue || !ciphertextValue) throw new Error('Malformed state');
      const decipher = createDecipheriv('aes-256-gcm', this.stateKey, Buffer.from(ivValue, 'base64url'));
      decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
      const decrypted = Buffer.concat([decipher.update(Buffer.from(ciphertextValue, 'base64url')), decipher.final()]).toString('utf8');
      const state = JSON.parse(decrypted) as ImportState;
      if (!PROVIDERS.has(state.provider) || typeof state.userId !== 'string') throw new Error('Invalid state');
      return state;
    } catch {
      throw new BadRequestException('Invalid professional profile authorization state');
    }
  }
}