import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@database/prisma.service';
import { JwtTokenService } from './jwt-token.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { RegisterDto } from './dto/auth.dto';

describe('AuthService (welcome email)', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let jwtTokenService: { issueTokenPair: jest.Mock };
  let mailService: { sendWelcomeEmail: jest.Mock; sendVerificationEmail: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    jwtTokenService = {
      issueTokenPair: jest.fn(() => Promise.resolve({ accessToken: 'access', refreshToken: 'refresh', expiresIn: 900 })),
    };

    mailService = {
      sendWelcomeEmail: jest.fn(() => Promise.resolve(true)),
      sendVerificationEmail: jest.fn(() => Promise.resolve(true)),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'REQUIRE_EMAIL_VERIFICATION') return 'false';
        if (key === 'FRONTEND_URL') return 'http://localhost:5173';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtTokenService, useValue: jwtTokenService },
        { provide: MailService, useValue: mailService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('sends welcome email on successful registration', async () => {
    const registerDto: RegisterDto = {
      email: 'olaitanpetertolu@gmail.com',
      password: 'StrongPass123!',
      passwordConfirmation: 'StrongPass123!',
      firstName: 'Olaitan',
      lastName: 'Peter',
    };

    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValueOnce({
      id: 'user-id',
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      isActive: true,
      emailVerified: true,
    });

    const result = await service.register(registerDto);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'olaitanpetertolu@gmail.com' } });
    expect(prisma.user.create).toHaveBeenCalled();
    expect(mailService.sendWelcomeEmail).toHaveBeenCalledWith('olaitanpetertolu@gmail.com', 'Olaitan');
    expect(result).toHaveProperty('accessToken', 'access');
    expect(result).toHaveProperty('refreshToken', 'refresh');
  });
});
