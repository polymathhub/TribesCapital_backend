import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '@database/database.module';
import { resolveJwtConfig } from '@config/jwt.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtTokenService } from './jwt-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailService } from './mail.service';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
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
  providers: [AuthService, JwtStrategy, JwtTokenService, MailService],
  exports: [AuthService, JwtModule, PassportModule, JwtTokenService, MailService],
})
export class AuthModule {}
