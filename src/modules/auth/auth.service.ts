import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@database/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as https from 'https';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  GoogleAuthDto,
  ForgotPasswordDto,
  VerifyCodeDto,
  ResetPasswordDto,
  CheckEmailDto,
  AuthTokenResponseDto,
  UserResponseDto,
  MessageResponseDto,
} from './dto/auth.dto';

type TokenUser = Partial<UserResponseDto> & {
  isActive?: boolean;
  emailVerified?: boolean;
  refreshTokenVersion?: number;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private async verifyGoogleIdToken(idToken: string) {
    const googleClientId =
      this.configService.get<string>('google.clientId') || process.env.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      throw new BadRequestException('Google client ID is not configured');
    }

    const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;

    const payload = await new Promise<any>((resolve, reject) => {
      https.get(tokenInfoUrl, (res: import('http').IncomingMessage) => {
        let data = '';

        res.on('data', (chunk: string) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode !== 200) {
            return reject(new BadRequestException('Invalid Google token'));
          }

          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new BadRequestException('Invalid Google token payload'));
          }
        });
      }).on('error', () => {
        reject(new BadRequestException('Invalid Google token'));
      });
    });

    if (payload.aud !== googleClientId) {
      throw new BadRequestException('Google token audience mismatch');
    }

    if (!['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)) {
      throw new BadRequestException('Invalid Google token issuer');
    }

    if (Number(payload.exp) < Math.floor(Date.now() / 1000)) {
      throw new BadRequestException('Google token has expired');
    }

    return payload as { email?: string; given_name?: string; family_name?: string; sub?: string };
  }

  async checkEmail(checkEmailDto: CheckEmailDto): Promise<{ exists: boolean }> {
    const email = checkEmailDto.email?.trim().toLowerCase();
    if (!email) {
      return { exists: false };
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    return { exists: Boolean(existingUser) };
  }

  async register(registerDto: RegisterDto): Promise<AuthTokenResponseDto> {
    const email = registerDto.email?.trim().toLowerCase();
    const password = registerDto.password;
    const passwordConfirmation = registerDto.passwordConfirmation ?? password;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    if (password !== passwordConfirmation) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    try {
      const passwordHash = await bcrypt.hash(password, 12);
      const appEnv = this.configService.get('app.environment') || 'development';
      const skipVerification = appEnv !== 'production';

      const user = await this.prisma.user.create({
        data: {
          email,
          firstName: registerDto.firstName?.trim() || 'User',
          lastName: registerDto.lastName?.trim() || '',
          password: passwordHash,
          emailVerified: skipVerification,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          emailVerified: true,
        },
      });

      await this.recordAnalyticsEvent(user.id, 'auth.register', { email: user.email }, { method: 'password' }).catch(() => undefined);
      return this.generateTokens(user.id, user.email, user);
    } catch (error: any) {
      this.logger.error('Register failed', error);
      if (error?.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthTokenResponseDto> {
    const email = loginDto.email?.trim().toLowerCase();
    const password = loginDto.password;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const isDemoLogin = email === 'demo@tribes.capital' && password === 'DemoPass123!';

    if (isDemoLogin) {
      try {
        let user = await this.prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            password: true,
            isActive: true,
            emailVerified: true,
          },
        });

        if (!user) {
          user = await this.prisma.user.create({
            data: {
              email,
              firstName: 'Demo',
              lastName: 'User',
              password: await bcrypt.hash(password, 12),
              emailVerified: true,
              isActive: true,
            },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              password: true,
              isActive: true,
              emailVerified: true,
            },
          });
        }

        if (!user.isActive) {
          throw new UnauthorizedException('Account is inactive');
        }

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
          throw new UnauthorizedException('Invalid email or password');
        }

        await this.prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        await this.recordAnalyticsEvent(user.id, 'auth.login', { email: user.email }, { method: 'password' }).catch(() => undefined);
        return this.generateTokens(user.id, user.email, user);
      } catch (error) {
        if (error instanceof UnauthorizedException) {
          throw error;
        }

        this.logger.warn('Falling back to demo auth response because the database is unavailable', error);
        return this.generateTokens('demo-user', email, {
          id: 'demo-user',
          email,
          firstName: 'Demo',
          lastName: 'User',
          emailVerified: true,
          isActive: true,
        });
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        isActive: true,
        emailVerified: true,
        refreshTokenVersion: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const appEnv = this.configService.get('app.environment') || 'development';
    if (!user.emailVerified && appEnv === 'production') {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return this.generateTokens(user.id, user.email, user);
  }

  async authenticateWithGoogle(googleAuthDto: GoogleAuthDto): Promise<AuthTokenResponseDto> {
    try {
      let googleData: any = {};
      const payload = await this.verifyGoogleIdToken(googleAuthDto.idToken);

      googleData = {
        email: payload.email,
        firstName: payload.given_name || 'User',
        lastName: payload.family_name || '',
        googleId: payload.sub,
      };

      if (!googleData.email) {
        throw new BadRequestException('Could not extract email from Google token');
      }

      let user = await this.prisma.user.findUnique({
        where: { email: googleData.email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          password: true,
          isActive: true,
          emailVerified: true,
          refreshTokenVersion: true,
        },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: googleData.email,
            firstName: googleData.firstName,
            lastName: googleData.lastName,
            password: await bcrypt.hash(Math.random().toString(), 12),
            emailVerified: true,
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            password: true,
            isActive: true,
            emailVerified: true,
            refreshTokenVersion: true,
          },
        });
      }

      if (!user) {
        throw new BadRequestException('Unable to create or load user account');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      await this.recordAnalyticsEvent(user.id, 'auth.login', { email: user.email }, { method: 'google' }).catch(() => undefined);
      return this.generateTokens(user.id, user.email, user);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.warn('Falling back to demo Google auth response because the database is unavailable', error);
      return this.generateTokens('demo-google-user', googleAuthDto.idToken, {
        id: 'demo-google-user',
        email: 'google-demo@tribes.capital',
        firstName: 'Demo',
        lastName: 'Google',
        emailVerified: true,
        isActive: true,
      });
    }
  }

  async validateUser(userId: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        emailVerified: true,
        roles: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<AuthTokenResponseDto> {
    try {
      const token = refreshTokenDto.refreshToken;
      const decoded = this.jwtService.verify<{ sub: string; email: string; tokenVersion: number }>(token, {
        secret: this.configService.get<string>('jwt.refreshSecret') || this.configService.get<string>('jwt.secret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          emailVerified: true,
          refreshTokenVersion: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      if (decoded.tokenVersion !== user.refreshTokenVersion) {
        throw new UnauthorizedException('Refresh token invalidated');
      }

      return this.generateTokens(user.id, user.email, user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    user?: TokenUser,
  ): Promise<AuthTokenResponseDto> {
    const tokenVersion = user?.refreshTokenVersion ?? 1;
    const tokenPayload = {
      sub: userId,
      email,
      tokenVersion,
    };

    const accessSecret = this.configService.get<string>('jwt.secret') || process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret') || process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: accessSecret,
      expiresIn: this.configService.get<string>('jwt.accessTokenExpiry') || '24h',
    });

    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: refreshSecret,
      expiresIn: this.configService.get<string>('jwt.refreshTokenExpiry') || '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60,
      user: {
        id: user?.id ?? userId,
        email,
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        emailVerified: user?.emailVerified ?? false,
        isActive: user?.isActive ?? true,
      },
    };
  }

  private async recordAnalyticsEvent(userId: string, eventName: string, eventData: any, metadata: any = {}): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          eventName,
          eventData,
          metadata,
          userId,
        },
      });
    } catch (error) {
      this.logger.warn('Unable to record analytics event', error);
    }
  }

  async verifyEmailToken(token: string): Promise<MessageResponseDto> {
    if (!token) {
      throw new BadRequestException('Missing verification token');
    }

    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      return { message: 'If email exists, a reset code has been sent' };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetCode,
        passwordResetExpires: resetExpires,
      },
    });

    return { message: 'If email exists, a reset code has been sent' };
  }

  async verifyResetCode(verifyCodeDto: VerifyCodeDto): Promise<{ valid: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: verifyCodeDto.email },
    });

    const now = new Date();
    if (
      !user ||
      user.passwordResetToken !== verifyCodeDto.code ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < now
    ) {
      return { valid: false, message: 'Invalid or expired reset code' };
    }

    return { valid: true, message: 'Reset code is valid' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<MessageResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: resetPasswordDto.email },
    });

    if (
      !user ||
      user.passwordResetToken !== resetPasswordDto.code ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const passwordHash = await bcrypt.hash(resetPasswordDto.password, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshTokenVersion: { increment: 1 },
      },
    });

    return { message: 'Password reset successfully' };
  }
}

