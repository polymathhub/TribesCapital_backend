import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Strategy } = require('passport-google-oauth20');
import { ConfigService } from '@nestjs/config';

type VerifyCallback = (err: any, user?: any, info?: any) => void;

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    const clientId = configService.get<string>('google.clientId');
    const clientSecret = configService.get<string>('google.clientSecret');
    const configuredCallback = configService.get<string>('google.callbackUrl');

    // Build a sensible default callback for local/dev if none provided.
    const appHost = (configService.get<string>('app.host') || process.env.APP_HOST || 'localhost').toString();
    const appPort = configService.get<number>('app.port') || Number(process.env.PORT) || 3000;
    const hostForCallback = appHost === '0.0.0.0' ? 'localhost' : appHost;
    const defaultCallback = `http://${hostForCallback}:${appPort}/api/auth/google/callback`;

    const callbackURL = configuredCallback || defaultCallback;
    if (!configuredCallback) {
      // eslint-disable-next-line no-console
      console.warn(`GOOGLE_CALLBACK_URL not set, falling back to ${callbackURL}. Update GOOGLE_CALLBACK_URL in production.`);
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
