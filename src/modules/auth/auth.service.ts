import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@database/prisma.service';
import { RegisterDto, LoginDto, TokenResponseDto, RefreshTokenDto, GoogleAuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<TokenResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        password: hashedPassword,
      },
    });

    return this.generateTokens(user.id, user.email);
  }

  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return this.generateTokens(user.id, user.email);
  }

  async authenticateWithGoogle(googleAuthDto: GoogleAuthDto): Promise<TokenResponseDto> {
    // Verify Google ID token (in production, verify with Google's API)
    // For now, we'll extract email from the token payload
    let googleData: any = {};
    try {
      // Decode JWT without verification for demo (PRODUCTION: verify properly)
      const parts = googleAuthDto.idToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        googleData = {
          email: payload.email,
          firstName: payload.given_name || 'User',
          lastName: payload.family_name || '',
          googleId: payload.sub,
          picture: payload.picture,
        };
      }
    } catch (error) {
      throw new BadRequestException('Invalid Google token');
    }

    if (!googleData.email) {
      throw new BadRequestException('Could not extract email from Google token');
    }

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email: googleData.email },
    });

    // If user doesn't exist, create new user with Google data
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleData.email,
          firstName: googleData.firstName,
          lastName: googleData.lastName,
          googleId: googleData.googleId,
          password: await bcrypt.hash(Math.random().toString(), 10), // Generate random password for OAuth users
          isActive: true,
        },
      });
    } else {
      // Update existing user with Google ID if not already set
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleData.googleId },
        });
      }
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    
    // Include YouTube token if available
    return {
      ...tokens,
      youtubeToken: googleAuthDto.accessToken, // Pass YouTube access token
    };
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        permissions: true,
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
      roles: user.roles,
      permissions: user.permissions,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    try {
      const decoded = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateTokens(user.id, user.email);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string, email: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRATION,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRATION,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: parseInt(process.env.JWT_EXPIRATION, 10),
      user,
    };
  }
}
