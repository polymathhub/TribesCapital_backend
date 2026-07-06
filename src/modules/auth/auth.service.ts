import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async checkEmail(checkEmailDto: CheckEmailDto): Promise<{ exists: boolean }> {
    const email = this.normalizeEmail(checkEmailDto.email);
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    this.logger.log(`Email lookup requested for ${email}`);

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    return { exists: Boolean(existingUser) };
  }

  async register(registerDto: RegisterDto): Promise<AuthTokenResponseDto> {
    this.logger.log('[REGISTER] Entering register()');
    const email = this.normalizeEmail(registerDto.email);
    const password = registerDto.password;

    this.logger.log(`[REGISTER] Normalized email: ${email ?? '<none>'}`);

    if (!email || !password) {
      this.logger.warn('[REGISTER] Missing email or password');
      throw new BadRequestException('Email and password are required');
    }

    if (password !== (registerDto.passwordConfirmation ?? password)) {
      this.logger.warn('[REGISTER] Password confirmation mismatch');
      throw new BadRequestException('Passwords do not match');
    }

    this.logger.log(`[REGISTER] Looking up existing user for ${email}`);
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    this.logger.log(`[REGISTER] existingUser lookup completed: ${existingUser ? 'found' : 'not found'}`);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    this.logger.log('[REGISTER] Hashing password');
    const passwordHash = await bcrypt.hash(password, 12);
    this.logger.log('[REGISTER] Password hash completed');

    this.logger.log('[REGISTER] Creating user record');
    const user = await this.prisma.user.create({
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
    this.logger.log(`[REGISTER] User created successfully: ${user.id}`);

    this.logger.log(`[REGISTER] Entering buildAuthResponse for ${email}`);
    const response = await this.buildAuthResponse(user);
    this.logger.log(`[REGISTER] Response about to return for ${email}`);
    return response;
  }

  async login(loginDto: LoginDto): Promise<AuthTokenResponseDto> {
    this.logger.log('[LOGIN] Entering login()');
    const email = this.normalizeEmail(loginDto.email);
    const password = loginDto.password;

    this.logger.log(`[LOGIN] Normalized email: ${email ?? '<none>'}`);

    if (!email || !password) {
      this.logger.warn('[LOGIN] Missing email or password');
      throw new BadRequestException('Email and password are required');
    }

    this.logger.log(`[LOGIN] Looking up user for ${email}`);
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
    this.logger.log(`[LOGIN] User lookup completed: ${user ? `found(${user.id})` : 'not found'}`);

    if (!user) {
      this.logger.warn('[LOGIN] Invalid credentials - user not found');
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(`[LOGIN] Password verification started for ${email}`);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    this.logger.log(`[LOGIN] Password verification completed for ${email}: ${isPasswordValid ? 'valid' : 'invalid'}`);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      this.logger.warn('[LOGIN] Account suspended for user id ' + user.id);
      throw new UnauthorizedException('Account suspended');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    this.logger.log(`[LOGIN] Last login timestamp updated for ${user.id}`);

    this.logger.log(`[LOGIN] Entering buildAuthResponse for ${email}`);
    const resp = await this.buildAuthResponse(user);
    this.logger.log(`[LOGIN] Response about to return for ${email}`);
    return resp;
  }

  async authenticateWithGoogle(googleAuthDto: GoogleAuthDto): Promise<AuthTokenResponseDto> {
    const payload = this.decodeGooglePayload(googleAuthDto.idToken);
    const email = this.normalizeEmail(payload.email);

    if (!email) {
      throw new BadRequestException('Could not extract email from Google token');
    }

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
          firstName: payload.firstName || 'User',
          lastName: payload.lastName || '',
          password: await bcrypt.hash(this.randomPassword(), 12),
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

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    this.logger.log(`Google authentication successful for ${email}`);
    return this.buildAuthResponse(user);
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
    const payload = (await this.jwtTokenService.verifyRefreshToken(refreshTokenDto.refreshToken)) as {
      sub?: string;
    };
    const userId = payload.sub;

    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    this.logger.log(`Refresh token generation requested for ${userId}`);

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
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.buildAuthResponse(user);
  }

  async verifyEmailToken(token: string): Promise<MessageResponseDto> {
    if (!token) {
      throw new BadRequestException('Missing verification token');
    }

    const user = await this.prisma.user.findFirst({ where: { emailVerificationToken: token } });
    if (!user) {
      throw new NotFoundException('Verification token is invalid or expired');
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
    const email = this.normalizeEmail(forgotPasswordDto.email);
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a reset code has been sent' };
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

    return { message: 'If the email exists, a reset code has been sent' };
  }

  async verifyResetCode(verifyCodeDto: VerifyCodeDto): Promise<{ valid: boolean; message: string }> {
    const email = this.normalizeEmail(verifyCodeDto.email);
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.passwordResetToken !== verifyCodeDto.code) {
      return { valid: false, message: 'Invalid reset code' };
    }

    return { valid: true, message: 'Reset code is valid' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<MessageResponseDto> {
    const email = this.normalizeEmail(resetPasswordDto.email);
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
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

  private normalizeEmail(email?: string): string | undefined {
    return email?.trim().toLowerCase();
  }

  private decodeGooglePayload(idToken: string): { email?: string; firstName?: string; lastName?: string } {
    try {
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')) as {
        email?: string;
        given_name?: string;
        family_name?: string;
      };

      return {
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
      };
    } catch {
      throw new BadRequestException('Invalid Google token');
    }
  }

  private randomPassword(): string {
    return `google-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    isActive?: boolean | null;
    emailVerified?: boolean | null;
  }): Promise<AuthTokenResponseDto> {
    this.logger.log(`[AUTH] Entering buildAuthResponse for ${user.email}`);
    const payload = { sub: user.id, email: user.email, role: 'user' };

    let tokens;
    try {
      this.logger.log(`[JWT] issueTokenPair starting for ${user.email} (payload keys: ${Object.keys(payload).join(',')})`);
      tokens = await this.jwtTokenService.issueTokenPair(payload);
      this.logger.log(`[JWT] issueTokenPair completed for ${user.email}`);
    } catch (e) {
      this.logger.error('[AUTH] Failed at issueTokenPair', e instanceof Error ? e.stack : String(e));
      throw e;
    }

    this.logger.log(`JWT creation completed for ${user.email}`);
    this.logger.log(`[AUTH] Response about to return for ${user.email}`);

    return {
      success: true,
      message: 'Authentication successful',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          emailVerified: user.emailVerified ?? false,
          isActive: user.isActive ?? true,
        },
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        emailVerified: user.emailVerified ?? false,
        isActive: user.isActive ?? true,
      },
    };
  }
}
