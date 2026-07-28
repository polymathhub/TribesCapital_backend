import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Strategy } = require('passport-google-oauth20');
import { ConfigService } from '@nestjs/config';

type VerifyCallback = (err: any, user?: any, info?: any) => void;

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    const clientId = configService.get<string>('google.clientId')?.trim();
    const clientSecret = configService.get<string>('google.clientSecret')?.trim();
    const configuredCallback = configService.get<string>('google.callbackUrl')?.trim();
    const apiPrefix = configService.get<string>('app.apiPrefix')?.trim() || process.env.API_PREFIX?.trim() || 'api';
    const frontendUrl = (
      configService.get<string>('app.frontendUrl')?.trim() ||
      configService.get<string>('FRONTEND_URL')?.trim() ||
      process.env.FRONTEND_URL?.trim() ||
      'http://localhost:5173'
    );
    const appHost = configService.get<string>('app.host')?.trim() || process.env.APP_HOST || 'localhost';
    const appPort = configService.get<number>('app.port') || Number(process.env.PORT) || 3000;
    const hostForCallback = appHost === '0.0.0.0' ? 'localhost' : appHost;
    const defaultCallback = frontendUrl
      ? `${frontendUrl.replace(/\/+$/g, '')}/${apiPrefix}/auth/google/callback`
      : `http://${hostForCallback}:${appPort}/${apiPrefix}/auth/google/callback`;
    const callbackURL = configuredCallback || defaultCallback;

    if (!clientId || !clientSecret) {
      // In development, allow the app to start even if Google OAuth is not configured.
      // Passport strategy will not be usable until proper credentials are provided.
      // eslint-disable-next-line no-console
      console.warn('Google OAuth client ID and/or secret not configured. Google auth routes will be disabled until configured.');
    }

    if (!configuredCallback && process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.warn('GOOGLE_CALLBACK_URL not set in production. Google OAuth callback may be incorrect.');
    }

    if (!configuredCallback) {
      // eslint-disable-next-line no-console
      console.warn(`GOOGLE_CALLBACK_URL not set, falling back to ${callbackURL}. Update GOOGLE_CALLBACK_URL in production.`);
    }

    super({
      clientID: clientId || '',
      clientSecret: clientSecret || '',
      callbackURL: callbackURL.replace(/\/+$|^\s+|\s+$/g, ''),
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
