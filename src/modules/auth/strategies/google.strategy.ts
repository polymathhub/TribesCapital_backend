import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Strategy } = require('passport-google-oauth20');
import { ConfigService } from '@nestjs/config';

type VerifyCallback = (err: any, user?: any, info?: any) => void;

export function resolveGoogleCallbackUrl(configService: ConfigService): string {
  const configuredCallback = (
    configService.get<string>('google.callbackUrl')?.trim() ||
    configService.get<string>('GOOGLE_CALLBACK_URL')?.trim() ||
    process.env.GOOGLE_CALLBACK_URL?.trim()
  );

  if (configuredCallback) {
    return configuredCallback;
  }

  const frontendUrl = (
    configService.get<string>('app.frontendUrl')?.trim() ||
    configService.get<string>('FRONTEND_URL')?.trim() ||
    process.env.FRONTEND_URL?.trim() ||
    'https://community.tribes.capital'
  );

  if (frontendUrl) {
    return new URL('/api/auth/google/callback', frontendUrl).toString();
  }

  const appHost = (configService.get<string>('app.host') || process.env.APP_HOST || 'localhost').toString().trim();
  const appPort = configService.get<number>('app.port') || Number(process.env.PORT) || 3000;
  const hostForCallback = appHost === '0.0.0.0' || appHost === '::' ? 'localhost' : appHost;
  const isLocalHost = hostForCallback === 'localhost' || hostForCallback.startsWith('127.') || hostForCallback === '::1';
  const protocol = isLocalHost ? 'http' : 'https';
  const portSuffix = appPort && ![80, 443].includes(appPort) ? `:${appPort}` : '';

  return `${protocol}://${hostForCallback}${portSuffix}/api/auth/google/callback`;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    const clientId = configService.get<string>('google.clientId');
    const clientSecret = configService.get<string>('google.clientSecret');
    const callbackURL = resolveGoogleCallbackUrl(configService);

    if (!configService.get<string>('google.callbackUrl') && !process.env.GOOGLE_CALLBACK_URL) {
      // eslint-disable-next-line no-console
      console.warn(`GOOGLE_CALLBACK_URL not set, using derived callback ${callbackURL}.`);
    }

    super({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL,
      scope: ['profile', 'email'],
      passReqToCallback: false,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const email = profile?.emails?.[0]?.value?.toLowerCase();
    const firstName = profile?.name?.givenName || profile?.displayName?.split(' ')[0] || '';
    const lastName = profile?.name?.familyName || profile?.displayName?.split(' ').slice(1).join(' ') || '';
    const googleId = profile?.id;
    const avatar = profile?.photos?.[0]?.value || null;

    if (!email) {
      return done(new UnauthorizedException('Google account did not return an email address'), false);
    }

    if (!googleId) {
      return done(new UnauthorizedException('Google account did not return an identifier'), false);
    }

    const userData = {
      email,
      googleId,
      firstName,
      lastName,
      avatar,
      accessToken,
      refreshToken,
      provider: 'google',
    };

    return done(null, userData);
  }
}
