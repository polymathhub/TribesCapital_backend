import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Strategy } = require('passport-google-oauth20');
import { ConfigService } from '@nestjs/config';

type VerifyCallback = (err: any, user?: any, info?: any) => void;

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('google.clientId'),
      clientSecret: configService.get<string>('google.clientSecret'),
      callbackURL: configService.get<string>('google.callbackUrl'),
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
