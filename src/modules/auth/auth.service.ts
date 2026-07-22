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
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import * as https from 'https';
import { ConfigService } from '@nestjs/config';
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
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  private isEmailVerificationRequired(): boolean {
    // Keep verification as a non-blocking courtesy step so signup is not blocked.
    return false;
  }

  private getFrontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') ??
      process.env.FRONTEND_URL ??
      'http://localhost:5173'
    ).replace(/\/+$|^\s+|\s+$/g, '');
  }

  private buildVerificationUrl(token: string): string {
    // The frontend expects verification links to land on `/verify-email` so
    // the SPA can load the verification page and consume the token.
    return `${this.getFrontendUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  }

  async checkEmail(checkEmailDto: CheckEmailDto): Promise<{ exists: boolean }> {
    const email = this.normalizeEmail(checkEmailDto.email);
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    this.logger.log(`Email lookup requested for ${email}`);

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    return { exists: Boolean(existingUser) };
  }

   
  async register(registerDto: RegisterDto): Promise<AuthTokenResponseDto | MessageResponseDto> {
    const ctx = '[REGISTER]';
    const startRegister = Date.now();
    this.logger.log(`${new Date().toISOString()} ${ctx}[1] Entering register()`);
    const email = this.normalizeEmail(registerDto.email);
    const password = registerDto.password;

    this.logger.log(`${new Date().toISOString()} ${ctx}[3] Normalized email: ${email ?? '<none>'}`);

    if (!email || !password) {
      this.logger.warn(`${new Date().toISOString()} ${ctx}[ERR] Missing email or password`);
      throw new BadRequestException('Email and password are required');
    }

    if (password !== (registerDto.passwordConfirmation ?? password)) {
      this.logger.warn('[REGISTER] Password confirmation mismatch');
      throw new BadRequestException('Passwords do not match');
    }

    this.logger.log(`${new Date().toISOString()} ${ctx}[4] Checking existing user for ${email}`);
    const t0 = Date.now();
    let existingUser;
    try {
      existingUser = await this.prisma.user.findUnique({ where: { email } });
      this.logger.log(`${new Date().toISOString()} ${ctx}[5] existingUser lookup completed (duration=${Date.now()-t0}ms): ${existingUser ? 'found' : 'not found'}`);
    } catch (e) {
      this.logger.error(`${new Date().toISOString()} ${ctx}[ERR] existingUser lookup failed`, e instanceof Error ? e.stack : String(e));
      throw e;
    }
    if (existingUser) {
      throw new ConflictException('Email already registered ,try and login or reset your password champ');
    }

    this.logger.log(`${new Date().toISOString()} ${ctx}[6] Hashing password`);
    const tHash = Date.now();
    let passwordHash;
    try {
      passwordHash = await bcrypt.hash(password, 12);
      this.logger.log(`${new Date().toISOString()} ${ctx}[7] Password hash completed (duration=${Date.now()-tHash}ms)`);
    } catch (e) {
      this.logger.error(`${new Date().toISOString()} ${ctx}[ERR] Password hashing failed`, e instanceof Error ? e.stack : String(e));
      throw e;
    }

    const requireEmailVerification = true;
    const emailVerificationToken = randomBytes(32).toString('hex');

    this.logger.log(`${new Date().toISOString()} ${ctx}[8] Creating Prisma user record`);
    const tCreate = Date.now();
    let user;
    try {
      user = await this.prisma.user.create({
      data: {
        email,
        firstName: registerDto.firstName?.trim() || 'User',
        lastName: registerDto.lastName?.trim() || '',
        password: passwordHash,
        emailVerified: true,
        emailVerificationToken,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        emailVerified: true,
        emailVerificationToken: true,
      },
      });
      this.logger.log(`${new Date().toISOString()} ${ctx}[9] Prisma user created (id=${user.id}) (duration=${Date.now()-tCreate}ms)`);
    } catch (e) {
      this.logger.error(`${new Date().toISOString()} ${ctx}[ERR] Prisma user create failed`, e instanceof Error ? e.stack : String(e));
      throw e;
    }

    const total = Date.now() - startRegister;
    this.logger.log(`${new Date().toISOString()} ${ctx}[12] Returning response (totalDuration=${total}ms)`);

    if (this.mailService) {
      void this.mailService.sendWelcomeEmail(user.email, user.firstName ?? 'there').then((sent) => {
        if (!sent) {
          this.logger.warn('[REGISTER] Welcome email was not sent succesfully.');
        }
      }).catch(() => this.logger.warn('[REGISTER] sendWelcomeEmail failed (non-blocking)'));
    }

    if (requireEmailVerification) {
      const verificationUrl = this.buildVerificationUrl(emailVerificationToken!);
      if (this.mailService) {
        void this.mailService
          .sendVerificationEmail(user.email, verificationUrl)
          .then((sent) => {
            if (!sent) {
              this.logger.warn('[REGISTER] Verification email was not sent successfully.');
            }
          })
          .catch(() => this.logger.warn('[REGISTER] sendVerificationEmail failed (non-blocking)'));
      }

      return { success: true, message: 'Registration successful. Please verify your email address.' };
    }

    return { success: true, message: 'Registration successful. Please verify your email address.' };
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

    if (!user.emailVerified && this.isEmailVerificationRequired()) {
      this.logger.warn('[LOGIN] Attempt to sign in with unverified email: ' + email);
      throw new UnauthorizedException('Email is not verified. Please check your inbox.');
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
    const payload = await this.verifyGoogleIdToken(googleAuthDto.idToken);
    return this.authenticateWithGoogleProfile(payload);
  }

  async authenticateWithGoogleProfile(profile: {
    email: string;
    firstName?: string;
    lastName?: string;
    googleId?: string;
    avatar?: string | null;
  }): Promise<AuthTokenResponseDto> {
    const email = this.normalizeEmail(profile.email);
    if (!email) {
      throw new BadRequestException('Google account did not provide a valid email');
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
        googleId: true,
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          firstName: profile.firstName || 'User',
          lastName: profile.lastName || '',
          password: await bcrypt.hash(this.randomPassword(), 12),
          emailVerified: true,
          isActive: true,
          googleId: profile.googleId,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          password: true,
          isActive: true,
          emailVerified: true,
          googleId: true,
        },
      });
    } else if (!user.googleId && profile.googleId) {
      await this.prisma.user.update({ where: { id: user.id }, data: { googleId: profile.googleId } });
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    this.logger.log(`Google authentication successful for ${email}`);
    return this.buildAuthResponse(user);
  }

  private async verifyGoogleIdToken(idToken: string): Promise<{ email: string; firstName?: string; lastName?: string; googleId?: string }> {
    const clientId =
      this.configService.get<string>('google.clientId') ??
      process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new ServiceUnavailableException('Google OAuth client configuration is missing');
    }

    const payload = await new Promise<any>((resolve, reject) => {
      const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
      https.get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new BadRequestException('Invalid Google token'));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (err) {
            reject(new BadRequestException('Invalid Google token payload'));
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });

    if (!payload || typeof payload !== 'object' || !payload.email) {
      throw new BadRequestException('Google account did not return an email address');
    }

    if (payload.aud !== clientId && payload.azp !== clientId) {
      throw new BadRequestException('Google token audience mismatch');
    }

    return {
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      googleId: payload.sub,
    };
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

  async resendVerificationEmail(email: string): Promise<MessageResponseDto> {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        emailVerified: true,
        emailVerificationToken: true,
        firstName: true,
      },
    });

    if (!user) {
      return { message: 'If the email exists, a verification email has been sent.' };
    }

    if (user.emailVerified) {
      return { message: 'Email address is already verified.' };
    }

    const verificationToken = user.emailVerificationToken ?? randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: verificationToken },
    });

    const verificationUrl = this.buildVerificationUrl(verificationToken);
    if (this.mailService) {
      this.mailService
        .sendVerificationEmail(normalizedEmail, verificationUrl)
        .catch(() => this.logger.warn('[RESEND] sendVerificationEmail failed (non-blocking)'));
    }

    return { message: 'Verification email sent. Check your inbox.' };
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

    // Attempt to send reset email but do not fail the request if sending does not get succesful 
    try {
      if (this.mailService) {
        const sent = await this.mailService.sendPasswordResetEmail(email, resetCode);
        if (!sent) {
          this.logger.warn('[FORGOT] Password reset email was not sent. Check SMTP configuration.');
        }
      }
    } catch (e) {
      this.logger.warn('[FORGOT] Failed to send password reset email; continuing without failing the request');
    }

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
    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        emailVerified: true,
        roles: {
          select: { name: true },
        },
      },
    });

    const roleNames = userWithRoles?.roles?.map((role) => role.name) ?? [];
    const isAdmin = roleNames.includes('admin');
    const payload = { sub: user.id, email: user.email, role: isAdmin ? 'admin' : 'user', roles: roleNames };

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
    this.logger.log(`[AUTH] Response completed for you@ ${user.email}`);

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
          roles: roleNames,
          isAdmin,
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
        roles: roleNames,
        isAdmin,
      },
    };
  }
}
