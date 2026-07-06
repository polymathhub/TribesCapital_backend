import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '@database/database.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtTokenService } from './jwt-token.service';
import { AuthResilienceService } from './auth-resilience.service';
import { resolveJwtConfig } from '@config/jwt.config';

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
  providers: [AuthService, JwtStrategy, JwtTokenService, AuthResilienceService],
  exports: [AuthService, JwtModule, PassportModule, JwtTokenService, AuthResilienceService],
})
export class AuthModule {}
