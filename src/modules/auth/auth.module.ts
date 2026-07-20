import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '@database/database.module';
import { resolveJwtConfig } from '@config/jwt.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';
import { JwtTokenService } from './jwt-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { EmailitProvider } from './emailit.provider';
import { EMAIL_PROVIDER } from './email-provider.interface';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtConfig = resolveJwtConfig(configService.get('jwt'));
        return {
          secret: jwtConfig.secret,
          signOptions: { expiresIn: jwtConfig.accessTokenExpiry, algorithm: jwtConfig.algorithm },
          verifyOptions: {
            algorithms: [jwtConfig.algorithm],
            ...(jwtConfig.issuer ? { issuer: jwtConfig.issuer } : {}),
            ...(jwtConfig.audience ? { audience: jwtConfig.audience } : {}),
            ...(jwtConfig.clockTolerance ? { clockTolerance: Number(jwtConfig.clockTolerance) } : {}),
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    JwtTokenService,
    MailService,
    {
      provide: EMAIL_PROVIDER,
      useClass: EmailitProvider,
    },
    EmailitProvider,
  ],
  exports: [AuthService, JwtModule, PassportModule, JwtTokenService, MailService],
})
export class AuthModule {}
