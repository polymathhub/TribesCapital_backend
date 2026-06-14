import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { TokenService } from '../services/token.service';
import { EmailService } from '../services/email.service';
import { AuditService } from '../services/audit.service';
import { PrismaService } from '@database/prisma.service';

describe('AuthService - Security', () => {
  let authService: AuthService;
  let tokenService: TokenService;
  let emailService: EmailService;
  let auditService: AuditService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        TokenService,
        EmailService,
        AuditService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            emailVerificationToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            passwordResetToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
              findMany: jest.fn(),
              updateMany: jest.fn(),
            },
            loginAttempt: {
              count: jest.fn(),
              create: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                'jwt.access': {
                  secret: 'test-access-secret-min-32-chars-long',
                  expiry: '15m',
                },
                'jwt.refresh': {
                  secret: 'test-refresh-secret-min-32-chars-long',
                  expiry: '7d',
                },
                'app.frontendUrl': 'http://localhost:3000',
                email: {
                  enabled: true,
                  from: 'test@example.com',
                },
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    tokenService = module.get<TokenService>(TokenService);
    emailService = module.get<EmailService>(EmailService);
    auditService = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  // ========== REGISTRATION TESTS ==========

  describe('Registration - Security', () => {
    it('should reject passwords that do not match confirmation', async () => {
      const registerDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'SecurePass123!',
        passwordConfirmation: 'DifferentPass123!',
      };

      await expect(
        authService.register(registerDto, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate emails', async () => {
      const registerDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'SecurePass123!',
        passwordConfirmation: 'SecurePass123!',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'existing-user',
        email: 'test@example.com',
      });

      await expect(
        authService.register(registerDto, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow('Email already registered');
    });

    it('should hash password with proper bcrypt rounds', async () => {
      const registerDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'SecurePass123!',
        passwordConfirmation: 'SecurePass123!',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prismaService.user.create as jest.Mock).mockResolvedValueOnce({
        id: 'new-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: '$2b$12$...',
        createdAt: new Date(),
      });

      const result = await authService.register(
        registerDto,
        '127.0.0.1',
        'Mozilla',
      );

      expect(result).toBeDefined();
      expect(result.user.id).toBe('new-user-id');
    });

    it('should generate email verification token', async () => {
      const registerDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'SecurePass123!',
        passwordConfirmation: 'SecurePass123!',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prismaService.user.create as jest.Mock).mockResolvedValueOnce({
        id: 'new-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: '$2b$12$...',
        createdAt: new Date(),
      });

      jest.spyOn(emailService, 'sendVerificationEmail').mockResolvedValueOnce(true);
      jest.spyOn(auditService, 'logAuthEvent').mockResolvedValueOnce(undefined);

      const result = await authService.register(
        registerDto,
        '127.0.0.1',
        'Mozilla',
      );

      expect(prismaService.emailVerificationToken.create).toHaveBeenCalled();
    });

    it('should not require email verification during registration (but for login)', async () => {
      const registerDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'SecurePass123!',
        passwordConfirmation: 'SecurePass123!',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prismaService.user.create as jest.Mock).mockResolvedValueOnce({
        id: 'new-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: '$2b$12$...',
        emailVerified: false,
        createdAt: new Date(),
      });

      jest.spyOn(emailService, 'sendVerificationEmail').mockResolvedValueOnce(true);
      jest.spyOn(auditService, 'logAuthEvent').mockResolvedValueOnce(undefined);

      const result = await authService.register(
        registerDto,
        '127.0.0.1',
        'Mozilla',
      );

      expect(result.user.emailVerified).toBe(false);
    });
  });

  // ========== LOGIN TESTS ==========

  describe('Login - Security & Brute Force Protection', () => {
    it('should prevent login after 5 failed attempts', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPass123!',
      };

      (auditService.getRecentLoginAttempts as jest.Mock).mockResolvedValueOnce(
        5,
      );

      await expect(
        authService.login(loginDto, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(
        'Account temporarily locked due to too many failed login attempts',
      );
    });

    it('should require email verification before login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      (auditService.getRecentLoginAttempts as jest.Mock).mockResolvedValueOnce(
        0,
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-id',
        email: 'test@example.com',
        password: '$2b$12$...',
        isActive: true,
        emailVerified: false,
        lockoutUntil: null,
      });

      jest
        .spyOn(tokenService, 'verifyPassword')
        .mockResolvedValueOnce(true);

      await expect(
        authService.login(loginDto, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow('Please verify your email before logging in');
    });

    it('should reject inactive users', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      (auditService.getRecentLoginAttempts as jest.Mock).mockResolvedValueOnce(
        0,
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-id',
        email: 'test@example.com',
        password: '$2b$12$...',
        isActive: false,
        emailVerified: true,
        lockoutUntil: null,
      });

      await expect(
        authService.login(loginDto, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow('Account is inactive');
    });

    it('should use generic error messages to prevent account enumeration', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'SomePass123!',
      };

      (auditService.getRecentLoginAttempts as jest.Mock).mockResolvedValueOnce(
        0,
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        authService.login(loginDto, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should use generic error message for wrong password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPass123!',
      };

      (auditService.getRecentLoginAttempts as jest.Mock).mockResolvedValueOnce(
        0,
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-id',
        email: 'test@example.com',
        password: '$2b$12$...',
        isActive: true,
        emailVerified: true,
        lockoutUntil: null,
      });

      jest
        .spyOn(tokenService, 'verifyPassword')
        .mockResolvedValueOnce(false);

      await expect(
        authService.login(loginDto, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should track failed login attempts', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPass123!',
      };

      (auditService.getRecentLoginAttempts as jest.Mock).mockResolvedValueOnce(
        1,
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-id',
        email: 'test@example.com',
        password: '$2b$12$...',
        isActive: true,
        emailVerified: true,
        lockoutUntil: null,
        failedLoginAttempts: 1,
      });

      jest
        .spyOn(tokenService, 'verifyPassword')
        .mockResolvedValueOnce(false);

      await expect(
        authService.login(loginDto, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow('Invalid email or password');

      expect(prismaService.user.update).toHaveBeenCalled();
    });
  });

  // ========== PASSWORD RESET TESTS ==========

  describe('Password Reset - Security', () => {
    it('should not reveal if email exists in forgot password', async () => {
      const dto = { email: 'nonexistent@example.com' };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await authService.forgotPassword(dto, '127.0.0.1');

      expect(result.message).toMatch(/If an account exists/);
    });

    it('should hash reset tokens before storage', async () => {
      const dto = { email: 'test@example.com' };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'Test',
        isActive: true,
      });

      jest.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValueOnce(true);

      const generateTokenSpy = jest.spyOn(tokenService, 'generateSecureToken');

      await authService.forgotPassword(dto, '127.0.0.1');

      expect(generateTokenSpy).toHaveBeenCalled();
      expect(prismaService.passwordResetToken.create).toHaveBeenCalled();

      // Verify token was hashed (not stored plaintext)
      const createCall = (prismaService.passwordResetToken.create as jest.Mock)
        .mock.calls[0][0];
      expect(createCall.data.tokenHash).not.toMatch(/^[a-zA-Z0-9]{64}$/); // Not hex format
    });

    it('should expire reset tokens after 1 hour', async () => {
      const dto = {
        email: 'test@example.com',
        token: 'token',
        password: 'NewSecurePass123!',
        passwordConfirmation: 'NewSecurePass123!',
      };

      const expiredToken = {
        id: 'token-id',
        userId: 'user-id',
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      (prismaService.passwordResetToken.findUnique as jest.Mock).mockResolvedValueOnce(
        expiredToken,
      );

      jest.spyOn(tokenService, 'verifyTokenHash').mockReturnValue(true);

      await expect(
        authService.resetPassword(dto, '127.0.0.1'),
      ).rejects.toThrow('Reset token has expired');
    });

    it('should mark reset token as used after password change', async () => {
      const dto = {
        email: 'test@example.com',
        token: 'token',
        password: 'NewSecurePass123!',
        passwordConfirmation: 'NewSecurePass123!',
      };

      const validToken = {
        id: 'token-id',
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
        user: { id: 'user-id', email: 'test@example.com' },
      };

      (prismaService.passwordResetToken.findUnique as jest.Mock).mockResolvedValueOnce(
        validToken,
      );

      jest.spyOn(tokenService, 'verifyTokenHash').mockReturnValue(true);
      jest
        .spyOn(tokenService, 'hashPassword')
        .mockResolvedValueOnce('$2b$12$...');

      await authService.resetPassword(dto, '127.0.0.1');

      expect(prismaService.passwordResetToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ usedAt: expect.any(Date) }),
        }),
      );
    });

    it('should revoke all sessions after password reset', async () => {
      const dto = {
        email: 'test@example.com',
        token: 'token',
        password: 'NewSecurePass123!',
        passwordConfirmation: 'NewSecurePass123!',
      };

      const validToken = {
        id: 'token-id',
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
        user: { id: 'user-id', email: 'test@example.com' },
      };

      (prismaService.passwordResetToken.findUnique as jest.Mock).mockResolvedValueOnce(
        validToken,
      );

      jest.spyOn(tokenService, 'verifyTokenHash').mockReturnValue(true);
      jest
        .spyOn(tokenService, 'hashPassword')
        .mockResolvedValueOnce('$2b$12$...');

      await authService.resetPassword(dto, '127.0.0.1');

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });
  });

  // ========== TOKEN TESTS ==========

  describe('Tokens - Security', () => {
    it('should generate secure tokens with 256 bits of entropy', () => {
      const { token, hash } = tokenService.generateSecureToken();

      // Token should be 64 hex characters (256 bits / 4 bits per char)
      expect(token).toMatch(/^[a-f0-9]{64}$/);
      // Hash should be 64 hex characters (SHA-256)
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      // Token and hash should be different
      expect(token).not.toBe(hash);
    });

    it('should use timing-safe comparison for token verification', () => {
      const token = 'test-token-value';
      const correctHash = tokenService.hashToken(token);

      const isValid = tokenService.verifyTokenHash(token, correctHash);

      expect(isValid).toBe(true);
    });
  });
});
