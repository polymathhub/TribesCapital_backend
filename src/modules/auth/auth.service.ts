import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import * as bcrypt from 'bcrypt';
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
import { JwtTokenService } from './jwt-token.service';
import { AuthResilienceService } from './auth-resilience.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly resilience: AuthResilienceService,
  ) {}

  async checkEmail(checkEmailDto: CheckEmailDto): Promise<{ exists: boolean }> {
    const email = checkEmailDto.email?.trim().toLowerCase();
    if (!email) {
      return { exists: false };
    }

    this.logger.log(`Check email requested for ${email}`);

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

    this.logger.log(`Register request received for ${email}`);

    try {
      return await this.resilience.execute(
        'register-user-creation',
        async () =>
          this.prisma.$transaction(async (tx) => {
            const passwordHash = await bcrypt.hash(password, 12);

            const user = await tx.user.create({
          data: {
            email,
            firstName: registerDto.firstName?.trim() || 'User',
            lastName: registerDto.lastName?.trim() || '',
            password: passwordHash,
            emailVerified: true,
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

            this.logger.log(`User created successfully for ${user.email}`);
            return this.generateAuthResponse(user.id, user.email, user);
          }),
        {
          context: { email },
        },
      );
    } catch (error: any) {
      this.logger.error(`Register failed for ${email}`, error);
      if (error?.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      if (error?.code === 'P1001') {
        throw new ServiceUnavailableException('Database connection failed. Please try again later.');
      }
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        throw new ServiceUnavailableException('Database schema is not initialized. Please run database migrations.');
      }
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new InternalServerErrorException('Unable to create your account right now. Please try again later.');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthTokenResponseDto> {
    const email = loginDto.email?.trim().toLowerCase();
    const password = loginDto.password;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    this.logger.log(`Login request received for ${email}`);

    try {
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
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      this.logger.log(`User lookup succeeded for ${email}`);

      if (!user.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }

      this.logger.log(`Password verification started for ${email}`);
      const passwordValid = await this.resilience.execute(
        'password-compare',
        async () => bcrypt.compare(password, user.password),
        {
          fallbackError: new UnauthorizedException('Invalid email or password'),
          context: { email },
          logLevel: 'warn',
        },
      );
      if (!passwordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      await this.resilience.execute(
        'update-last-login',
        async () =>
          this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          }),
        {
          context: { email },
          logLevel: 'warn',
        },
      );

      this.logger.log(`Login successful for ${email}`);
      return this.generateAuthResponse(user.id, user.email, user);
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`Login failed for ${email}`, error);
      throw new InternalServerErrorException('Unable to sign in right now. Please try again later.');
    }
  }

  async authenticateWithGoogle(googleAuthDto: GoogleAuthDto): Promise<AuthTokenResponseDto> {
    let googleData: any = {};
    try {
      const parts = googleAuthDto.idToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        googleData = {
          email: payload.email,
          firstName: payload.given_name || 'User',
          lastName: payload.family_name || '',
          googleId: payload.sub,
        };
      }
    } catch {
      throw new BadRequestException('Invalid Google token');
    }

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
        },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    this.logger.log(`Google authentication successful for ${user.email}`);
    return this.generateAuthResponse(user.id, user.email, user);
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
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<AuthTokenResponseDto> {
    try {
      const decoded = await this.jwtTokenService.verifyRefreshToken(refreshTokenDto.refreshToken);
      const sub = (decoded as { sub?: string }).sub;

      if (!sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: sub },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          emailVerified: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateAuthResponse(user.id, user.email, user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.warn('Refresh token verification failed');
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateAuthResponse(
    userId: string,
    email: string,
    user?: Partial<UserResponseDto> & { isActive?: boolean; emailVerified?: boolean },
  ): Promise<AuthTokenResponseDto> {
    const payload = { sub: userId, email };

    try {
      const { accessToken, refreshToken, expiresIn } = await this.resilience.execute(
        'token-issuance',
        async () => this.jwtTokenService.issueTokenPair(payload),
        {
          context: { email, userId },
          logLevel: 'error',
        },
      );
      this.logger.log(`Tokens generated for ${email}`);

      return {
        accessToken,
        refreshToken,
        expiresIn,
        user: {
          id: user?.id ?? userId,
          email,
          firstName: user?.firstName ?? '',
          lastName: user?.lastName ?? '',
          emailVerified: user?.emailVerified ?? false,
          isActive: user?.isActive ?? true,
        },
      };
    } catch (error) {
      this.logger.error(`Token generation failed for ${email}`, error);
      throw new ServiceUnavailableException('Authentication is currently unavailable. Please try again later.');
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

    if (!user || user.passwordResetToken !== verifyCodeDto.code) {
      return { valid: false, message: 'Invalid reset code' };
    }

    return { valid: true, message: 'Reset code is valid' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<MessageResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: resetPasswordDto.email },
    });

    if (!user || user.passwordResetToken !== resetPasswordDto.code) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const passwordHash = await bcrypt.hash(resetPasswordDto.password, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }
}
