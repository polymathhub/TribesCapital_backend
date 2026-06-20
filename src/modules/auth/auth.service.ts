import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@database/prisma.service';
import * as crypto from 'crypto';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
  GoogleAuthDto,
  AuthTokenResponseDto,
  UserResponseDto,
  MessageResponseDto,
} from './dto/auth.dto';
import { TokenService, TokenPayload } from './services/token.service';
import { EmailService } from './services/email.service';
import { AuditService } from './services/audit.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60; // 24 hours in seconds
  private readonly PASSWORD_RESET_EXPIRY = 60 * 60; // 1 hour in seconds

  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private emailService: EmailService,
    private auditService: AuditService,
    private configService: ConfigService,
  ) {}

  // ============================================================================
  // REGISTRATION
  // ============================================================================

  async register(
    registerDto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokenResponseDto> {
    // Validate password confirmation
    if (registerDto.password !== registerDto.passwordConfirmation) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existingUser) {
      this.logger.warn(`Registration attempted with existing email: ${registerDto.email}`);
      // Don't reveal that email exists (prevent account enumeration)
      throw new ConflictException('Email already registered');
    }

    try {
      // Hash password with strong bcrypt (12 rounds)
      const passwordHash = await this.tokenService.hashPassword(registerDto.password);

      // Create user (attach role if provided)
      // Determine whether to require email verification
      const appEnv = this.configService.get('app.environment');
      const emailEnabled = this.configService.get('email.enabled');
      const skipVerification = appEnv !== 'production' || !emailEnabled;

      const createData: any = {
        email: registerDto.email.toLowerCase(),
        firstName: registerDto.firstName.trim(),
        lastName: registerDto.lastName.trim(),
        password: passwordHash,
        // In dev or when email is disabled, mark email as verified to allow immediate login
        emailVerified: skipVerification ? true : false,
      };

      // Normalize and map incoming role to known role names; default to 'user'
      if (registerDto.role) {
        const requested = registerDto.role.trim().toLowerCase();
        // simple slugify
        const slug = requested.replace(/[^a-z0-9]+/g, '_');
        // map unknown roles to 'user' to ensure consistent permissions
        const allowed = new Set(['admin', 'moderator', 'user']);
        const roleName = allowed.has(slug) ? slug : 'user';

        // Connect to existing role (or create if missing) using canonical roleName
        createData.roles = {
          connectOrCreate: [
            {
              where: { name: roleName },
              create: { name: roleName, description: `${roleName} role` },
            },
          ],
        };
      } else {
        // Ensure default 'user' role is attached if none provided
        createData.roles = {
          connectOrCreate: [
            {
              where: { name: 'user' },
              create: { name: 'user', description: 'Regular user role' },
            },
          ],
        };
      }

      const user = await this.prisma.user.create({
        data: createData,
        include: {
          roles: true,
          permissions: true,
        },
      });

      // If verification is required in production, create token and send email.
      if (!skipVerification) {
        // Generate email verification token
        const { token, hash } = this.tokenService.generateSecureToken();

        // Store hashed token in database
        await this.prisma.emailVerificationToken.create({
          data: {
            userId: user.id,
            tokenHash: hash,
            expiresAt: new Date(Date.now() + this.EMAIL_VERIFICATION_EXPIRY * 1000),
          },
        });

        // Send verification email
        const frontendUrl = this.configService.get('app.frontendUrl');
        const verificationLink = `${frontendUrl}/auth/verify-email?token=${token}`;

        try {
          await this.emailService.sendVerificationEmail({
            email: user.email,
            firstName: user.firstName,
            verificationLink,
            expiresIn: '24 hours',
          });
        } catch (emailError) {
          this.logger.error('Failed to send verification email', emailError);
          // Don't fail registration if email fails - log and continue
        }
      } else {
        this.logger.log(`Skipping email verification for user ${user.email} (env=${appEnv}, emailEnabled=${emailEnabled})`);
      }

      // Log registration event
      await this.auditService.logAuthEvent({
        userId: user.id,
        action: 'user_registered',
        resource: 'user',
        resourceId: user.id,
        ipAddress,
        userAgent,
      });

      this.logger.log(`User registered: ${user.email}`);

      // Generate tokens
      const tokenPair = this.generateAuthTokens(user);

      return tokenPair;
    } catch (error: any) {
      // Handle Prisma unique constraint violation (race condition on email)
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        this.logger.warn(
          `Registration failed - email unique constraint: ${registerDto.email}`,
        );
        throw new ConflictException('Email already registered');
      }

      if (error instanceof ConflictException) {
        throw error;
      }
      
      this.logger.error('Registration failed', error);
      throw new InternalServerErrorException('Registration failed');
    }
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<MessageResponseDto> {
    try {
      // Hash the token to compare with database
      const tokenHash = this.tokenService.hashToken(verifyEmailDto.token);

      // Find verification token
      const verificationToken = await this.prisma.emailVerificationToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!verificationToken) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      // Check if already used
      if (verificationToken.usedAt) {
        throw new BadRequestException('Verification token has already been used');
      }

      // Check if expired
      if (verificationToken.expiresAt < new Date()) {
        throw new BadRequestException('Verification token has expired');
      }

      // Mark email as verified
      await this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      });

      // Mark token as used
      await this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });

      // Log verification event
      await this.auditService.logAuthEvent({
        userId: verificationToken.userId,
        action: 'email_verified',
        resource: 'user',
        resourceId: verificationToken.userId,
      });

      this.logger.log(`Email verified for user: ${verificationToken.user.email}`);

      // Send welcome email (best-effort)
      try {
        await this.emailService.sendWelcomeEmail({
          email: verificationToken.user.email,
          firstName: verificationToken.user.firstName || 'User',
        });
      } catch (err) {
        this.logger.warn('Failed to send welcome email', err);
      }
      return { message: 'Email verified successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Email verification failed', error);
      throw new InternalServerErrorException('Email verification failed');
    }
  }

  // ============================================================================
  // LOGIN
  // ============================================================================

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokenResponseDto> {
    const email = loginDto.email.toLowerCase();

    try {
      // Check for brute force attempts
      const failedAttempts = await this.auditService.getRecentLoginAttempts(
        email,
        15,
      );

      if (failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        this.logger.warn(
          `Too many failed login attempts for email: ${email}`,
        );

        await this.auditService.logLoginAttempt({
          email,
          success: false,
          ipAddress,
          userAgent,
          failureReason: 'Too many failed attempts',
        });

        throw new UnauthorizedException(
          'Account temporarily locked due to too many failed login attempts. Try again later.',
        );
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          roles: true,
          permissions: true,
        },
      });

      if (!user) {
        this.logger.warn(`Login attempted with non-existent email: ${email}`);

        await this.auditService.logLoginAttempt({
          email,
          success: false,
          ipAddress,
          userAgent,
          failureReason: 'User not found',
        });

        // Generic error to prevent account enumeration
        throw new UnauthorizedException('Invalid email or password');
      }

      // Check if account is active
      if (!user.isActive) {
        this.logger.warn(`Login attempted with inactive user: ${email}`);

        await this.auditService.logLoginAttempt({
          userId: user.id,
          email,
          success: false,
          ipAddress,
          userAgent,
          failureReason: 'Account inactive',
        });

        throw new UnauthorizedException('Account is inactive');
      }

      // Check if account is locked
      if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        this.logger.warn(`Login attempted for locked account: ${email}`);

        await this.auditService.logLoginAttempt({
          userId: user.id,
          email,
          success: false,
          ipAddress,
          userAgent,
          failureReason: 'Account locked',
        });

        throw new UnauthorizedException(
          'Account is temporarily locked. Try again later.',
        );
      }

      // Verify password
      const passwordValid = await this.tokenService.verifyPassword(
        loginDto.password,
        user.password,
      );

      if (!passwordValid) {
        this.logger.warn(`Failed login attempt for user: ${email}`);

        // Increment failed attempts
        const newFailedAttempts = failedAttempts + 1;
        let lockoutUntil = null;

        // Lock account after max attempts
        if (newFailedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
          lockoutUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MS);
        }

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newFailedAttempts,
            lockoutUntil,
          },
        });

        await this.auditService.logLoginAttempt({
          userId: user.id,
          email,
          success: false,
          ipAddress,
          userAgent,
          failureReason: 'Invalid password',
        });

        throw new UnauthorizedException('Invalid email or password');
      }

      // Require email verification before login (optional in dev/test)
      const appEnv = this.configService.get('app.environment');
      const emailEnabled = this.configService.get('email.enabled');
      const requireEmailVerification = appEnv === 'production' && emailEnabled;

      if (requireEmailVerification && !user.emailVerified) {
        this.logger.warn(`Login attempted with unverified email: ${email}`);

        await this.auditService.logLoginAttempt({
          userId: user.id,
          email,
          success: false,
          ipAddress,
          userAgent,
          failureReason: 'Email not verified',
        });

        throw new UnauthorizedException(
          'Please verify your email before logging in',
        );
      }

      // Reset failed login attempts and lockout
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockoutUntil: null,
          lastLogin: new Date(),
          lastLoginIp: ipAddress,
          lastLoginUserAgent: userAgent,
        },
      });

      // Log successful login
      await this.auditService.logLoginAttempt({
        userId: user.id,
        email,
        success: true,
        ipAddress,
        userAgent,
      });

      await this.auditService.logAuthEvent({
        userId: user.id,
        action: 'user_login',
        resource: 'user',
        resourceId: user.id,
        ipAddress,
        userAgent,
      });

      this.logger.log(`User logged in: ${email}`);

      // Generate tokens
      const tokenPair = this.generateAuthTokens(user);

      // Store refresh token hash
      if (tokenPair.refreshToken) {
        const { hash } = this.tokenService.generateSecureToken();
        const tokenConfig = this.configService.get('jwt.refresh');

        await this.prisma.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash: hash,
            deviceInfo: userAgent,
            ipAddress,
            expiresAt: new Date(
              Date.now() +
              this.parseExpiryToMs(tokenConfig.expiry),
            ),
          },
        });
      }

      return tokenPair;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error('Login failed', error);
      throw new InternalServerErrorException('Login failed');
    }
  }

  // ============================================================================
  // REFRESH TOKEN
  // ============================================================================

  async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokenResponseDto> {
    try {
      // Verify refresh token
      const decoded = this.tokenService.verifyRefreshToken(
        refreshTokenDto.refreshToken,
      );

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          roles: true,
          permissions: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generate new token pair
      const newTokenPair = this.generateAuthTokens(user);

      // Log token refresh
      await this.auditService.logAuthEvent({
        userId: user.id,
        action: 'token_refreshed',
        resource: 'auth',
        ipAddress,
        userAgent,
      });

      return newTokenPair;
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // ============================================================================
  // FORGOT PASSWORD
  // ============================================================================

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<MessageResponseDto> {
    const email = forgotPasswordDto.email.toLowerCase();

    try {
      // Find user (silently fail to prevent account enumeration)
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user && user.isActive) {
        try {
          // Generate password reset token
          const { token, hash } = this.tokenService.generateSecureToken();

          // Store hashed token
          await this.prisma.passwordResetToken.create({
            data: {
              userId: user.id,
              tokenHash: hash,
              expiresAt: new Date(
                Date.now() + this.PASSWORD_RESET_EXPIRY * 1000,
              ),
            },
          });

          // Send reset email
          const frontendUrl = this.configService.get('app.frontendUrl');
          const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

          await this.emailService.sendPasswordResetEmail({
            email: user.email,
            firstName: user.firstName,
            resetLink,
            expiresIn: '1 hour',
          });

          // Log password reset request
          await this.auditService.logAuthEvent({
            userId: user.id,
            action: 'password_reset_requested',
            resource: 'user',
            resourceId: user.id,
            ipAddress,
            userAgent,
          });

          this.logger.log(`Password reset requested for: ${email}`);
        } catch (emailError) {
          this.logger.error('Failed to send password reset email', emailError);
          // Continue anyway - user can request again
        }
      } else {
        this.logger.warn(
          `Password reset requested for non-existent email: ${email}`,
        );
      }

      // Always return same response (prevents account enumeration)
      return {
        message:
          'If an account exists with that email, password reset instructions have been sent',
      };
    } catch (error) {
      this.logger.error('Forgot password failed', error);
      // Don't throw - always return success response
      return {
        message:
          'If an account exists with that email, password reset instructions have been sent',
      };
    }
  }

  // ============================================================================
  // RESET PASSWORD
  // ============================================================================

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<MessageResponseDto> {
    // Validate password confirmation
    if (resetPasswordDto.password !== resetPasswordDto.passwordConfirmation) {
      throw new BadRequestException('Passwords do not match');
    }

    try {
      // Hash the token to find it
      const tokenHash = this.tokenService.hashToken(resetPasswordDto.token);

      // Find reset token
      const resetToken = await this.prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!resetToken) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Check if already used
      if (resetToken.usedAt) {
        throw new BadRequestException('Reset token has already been used');
      }

      // Check if expired
      if (resetToken.expiresAt < new Date()) {
        throw new BadRequestException('Reset token has expired');
      }

      // Hash new password
      const newPasswordHash = await this.tokenService.hashPassword(
        resetPasswordDto.password,
      );

      // Update password and mark token as used
      await this.prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: newPasswordHash,
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });

      await this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      // Revoke all refresh tokens (force re-login on all devices)
      await this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId },
        data: { revokedAt: new Date() },
      });

      // Log password reset
      await this.auditService.logAuthEvent({
        userId: resetToken.userId,
        action: 'password_reset',
        resource: 'user',
        resourceId: resetToken.userId,
        ipAddress,
        userAgent,
      });

      this.logger.log(
        `Password reset completed for user: ${resetToken.user.email}`,
      );

      // Send password changed confirmation email (best-effort)
      try {
        await this.emailService.sendPasswordChangedEmail({
          email: resetToken.user.email,
          firstName: resetToken.user.firstName || 'User',
        });
      } catch (err) {
        this.logger.warn('Failed to send password changed email', err);
      }
      return { message: 'Password has been reset successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Password reset failed', error);
      throw new InternalServerErrorException('Password reset failed');
    }
  }

  // ============================================================================
  // LOGOUT
  // ============================================================================

  async logout(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<MessageResponseDto> {
    try {
      // Revoke current refresh token session
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      // Log logout
      await this.auditService.logAuthEvent({
        userId,
        action: 'user_logout',
        resource: 'user',
        resourceId: userId,
        ipAddress,
        userAgent,
      });

      this.logger.log(`User logged out: ${userId}`);

      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error('Logout failed', error);
      throw new InternalServerErrorException('Logout failed');
    }
  }

  // ============================================================================
  // LOGOUT ALL DEVICES
  // ============================================================================

  async logoutAllDevices(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<MessageResponseDto> {
    try {
      // Revoke all refresh tokens
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      });

      // Log logout from all devices
      await this.auditService.logAuthEvent({
        userId,
        action: 'user_logout_all_devices',
        resource: 'user',
        resourceId: userId,
        ipAddress,
        userAgent,
      });

      this.logger.log(`User logged out from all devices: ${userId}`);

      return { message: 'Logged out from all devices successfully' };
    } catch (error) {
      this.logger.error('Logout all devices failed', error);
      throw new InternalServerErrorException('Logout all devices failed');
    }
  }

  // ============================================================================
  // GOOGLE OAUTH - PRODUCTION READY
  // ============================================================================

  async authenticateWithGoogle(
    googleAuthDto: GoogleAuthDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokenResponseDto> {
    try {
      // Get Google Client ID from config
      const googleClientId = this.configService.get('oauth.google.clientId');

      if (!googleClientId) {
        this.logger.error('Google Client ID not configured');
        throw new BadRequestException('OAuth configuration error');
      }

      // Verify Google token with signature validation
      const googleData = await this.tokenService.verifyGoogleToken(
        googleAuthDto.idToken,
        googleClientId,
      );

      const email = googleData.email.toLowerCase();

      // Check if user exists
      let user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          roles: true,
          permissions: true,
        },
      });

      if (!user) {
        // Create new OAuth user with pre-verified email
        user = await this.prisma.user.create({
          data: {
            email,
            firstName: googleData.given_name || 'User',
            lastName: googleData.family_name || '',
            password: await this.tokenService.hashPassword(
              // Generate random password - user cannot login with password
              crypto.randomBytes(32).toString('hex'),
            ),
            googleId: googleData.sub,
            emailVerified: true, // Google has verified the email
            isActive: true,
          },
          include: {
            roles: true,
            permissions: true,
          },
        });

        this.logger.log(`New OAuth user created: ${email}`);

        // Audit new registration via OAuth
        await this.auditService.logAuthEvent({
          userId: user.id,
          action: 'user_registered_oauth',
          resource: 'user',
          resourceId: user.id,
          ipAddress,
          userAgent,
        });
      } else if (user.googleId !== googleData.sub) {
        // User exists but Google ID doesn't match
        if (user.googleId) {
          // Account already linked to different Google account
          this.logger.warn(
            `OAuth account mismatch for user: ${email}`,
          );
          throw new BadRequestException(
            'This email is already linked to a different Google account',
          );
        } else {
          // Link Google account to existing user
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { googleId: googleData.sub },
            include: {
              roles: true,
              permissions: true,
            },
          });

          this.logger.log(`Google account linked to existing user: ${email}`);
        }
      }

      // Check if account is active
      if (!user.isActive) {
        this.logger.warn(`OAuth login attempted for inactive user: ${email}`);
        throw new BadRequestException('Account is inactive');
      }

      // Update last login info
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          lastLoginIp: ipAddress,
          lastLoginUserAgent: userAgent,
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });

      // Audit successful OAuth login
      await this.auditService.logAuthEvent({
        userId: user.id,
        action: 'user_login_oauth',
        resource: 'user',
        resourceId: user.id,
        ipAddress,
        userAgent,
      });

      this.logger.log(`OAuth login successful: ${email}`);

      // Return authenticated tokens
      return this.generateAuthTokens(user);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      this.logger.error('OAuth authentication failed', error);
      throw new BadRequestException('OAuth authentication failed');
    }
  }

  // ============================================================================
  // RESEND VERIFICATION EMAIL
  // ============================================================================

  async resendVerificationEmail(email: string): Promise<MessageResponseDto> {
    const normalizedEmail = email.toLowerCase();

    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        // Don't reveal that user doesn't exist (prevent enumeration)
        return {
          message: 'If an account exists with that email, verification email has been sent',
        };
      }

      // Check if already verified
      if (user.emailVerified) {
        return {
          message: 'Email is already verified',
        };
      }

      try {
        // Generate new email verification token
        const { token, hash } = this.tokenService.generateSecureToken();

        // Delete any existing verification tokens for this user
        await this.prisma.emailVerificationToken.deleteMany({
          where: { userId: user.id },
        });

        // Create new verification token
        await this.prisma.emailVerificationToken.create({
          data: {
            userId: user.id,
            tokenHash: hash,
            expiresAt: new Date(
              Date.now() + this.EMAIL_VERIFICATION_EXPIRY * 1000,
            ),
          },
        });

        // Send verification email
        const frontendUrl = this.configService.get('app.frontendUrl');
        const verificationLink = `${frontendUrl}/auth/verify-email?token=${token}`;

        await this.emailService.sendVerificationEmail({
          email: user.email,
          firstName: user.firstName,
          verificationLink,
          expiresIn: '24 hours',
        });

        this.logger.log(
          `Verification email resent to: ${normalizedEmail}`,
        );
      } catch (emailError) {
        this.logger.error('Failed to send verification email', emailError);
        throw new InternalServerErrorException('Failed to send verification email');
      }

      return {
        message: 'Verification email has been sent',
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error('Resend verification failed', error);
      throw new InternalServerErrorException('Resend verification failed');
    }
  }

  // ============================================================================
  // VALIDATE & HELPER METHODS
  // ============================================================================

  /**
   * Validate user for JWT strategy
   */
  /**
   * Check if an email is already registered
   */
  async checkEmailExists(email: string): Promise<{ exists: boolean; message: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (user) {
        return {
          exists: true,
          message: 'This email is already registered. Please sign in or use a different email.',
        };
      }

      return {
        exists: false,
        message: 'Email is available for registration',
      };
    } catch (error) {
      this.logger.error('Email check failed', error);
      return {
        exists: false,
        message: 'Unable to check email availability',
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  async validateUser(userId: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          select: { name: true },
        },
        permissions: {
          select: { name: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      roles: user.roles.map((r: any) => r.name),
      createdAt: user.createdAt,
    };
  }

  /**
   * Generate auth token pair with user claims
   */
  private generateAuthTokens(user: any): AuthTokenResponseDto {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles?.map((r: any) => r.name) || [],
      permissions: user.permissions?.map((p: any) => p.name) || [],
    };

    const tokenPair = this.tokenService.generateTokenPair(payload);

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        roles: user.roles?.map((r: any) => r.name) || [],
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Convert expiry string to milliseconds
   */
  private parseExpiryToMs(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 604800000; // Default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 3600 * 1000;
      case 'd':
        return value * 86400 * 1000;
      default:
        return 604800000;
    }
  }
}
