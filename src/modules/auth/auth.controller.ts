import { Body, Controller, Get, HttpCode, Logger, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '@common/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  AuthTokenResponseDto,
  CheckEmailDto,
  ForgotPasswordDto,
  GoogleAuthDto,
  LoginDto,
  MessageResponseDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyCodeDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthTokenResponseDto | MessageResponseDto> {
    const start = Date.now();
    const ctx = '[REGISTER]';
    this.logger.log(`${new Date().toISOString()} ${ctx}[1] Request received`);
    try {
      this.logger.log(`${new Date().toISOString()} ${ctx}[2] DTO validated: ${registerDto.email ?? '<no-email>'}`);
      const resp = await this.authService.register(registerDto);
      const duration = Date.now() - start;
      this.logger.log(`${new Date().toISOString()} ${ctx}[11] Returning response (duration=${duration}ms)`);
      return resp;
    } catch (err) {
      const duration = Date.now() - start;
      // eslint-disable-next-line no-console
      console.error('========================================');
      // eslint-disable-next-line no-console
      console.error('UNCAUGHT EXCEPTION');
      // eslint-disable-next-line no-console
      console.error(`Time: ${new Date().toISOString()}`);
      // eslint-disable-next-line no-console
      console.error(`Route: POST /api/auth/register`);
      // eslint-disable-next-line no-console
      console.error(`Method: AuthController.register`);
      // eslint-disable-next-line no-console
      console.error(`Error: ${err instanceof Error ? err.name : String(err)}`);
      // eslint-disable-next-line no-console
      console.error(`Message: ${err instanceof Error ? err.message : String(err)}`);
      // eslint-disable-next-line no-console
      console.error(err instanceof Error ? err.stack : String(err));
      // eslint-disable-next-line no-console
      console.error('========================================');
      this.logger.error(`${new Date().toISOString()} ${ctx}[ERR] Failed (duration=${duration}ms)`, err instanceof Error ? err.stack : String(err));
      throw err;
    }
  }

  @Public()
  @Post('check-email')
  @HttpCode(200)
  async checkEmail(@Body() checkEmailDto: CheckEmailDto): Promise<{ exists: boolean }> {
    return this.authService.checkEmail(checkEmailDto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto): Promise<AuthTokenResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin(): Promise<void> {
    // Passport handles redirect to Google.
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query('redirect') redirect?: string,
  ): Promise<void> {
    const profile = req.user as {
      email: string;
      firstName?: string;
      lastName?: string;
      googleId?: string;
      avatar?: string | null;
    };

    const authResponse = await this.authService.authenticateWithGoogleProfile({
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      googleId: profile.googleId,
      avatar: profile.avatar ?? null,
    });

    const frontendUrl = redirect
      ? decodeURIComponent(redirect)
      : this.getFrontendUrl();

    const nextUrl = this.buildFrontendRedirect(frontendUrl, authResponse);
    res.redirect(nextUrl);
  }

  private getFrontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') ??
      process.env.FRONTEND_URL ??
      'http://localhost:5173'
    ).replace(/\/+$/g, '');
  }

  private buildFrontendRedirect(frontendUrl: string, authResponse: AuthTokenResponseDto): string {
    const url = new URL(frontendUrl);
    const authHash = new URLSearchParams({
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
      expiresIn: String(authResponse.expiresIn),
      user: JSON.stringify(authResponse.user),
    }).toString();

    return `${url.toString()}#${authHash}`;
  }

  @Public()
  @Post('google')
  @HttpCode(200)
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto): Promise<AuthTokenResponseDto> {
    return this.authService.authenticateWithGoogle(googleAuthDto);
  }

  @Public()
  @Post(['refresh', 'refresh-token'])
  @HttpCode(200)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthTokenResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(200)
  async resendVerification(@Body('email') email: string): Promise<MessageResponseDto> {
    return this.authService.resendVerificationEmail(email);
  }

  @Public()
  @Post('verify-code')
  @HttpCode(200)
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto): Promise<{ valid: boolean; message: string }> {
    return this.authService.verifyResetCode(verifyCodeDto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body('token') token: string): Promise<MessageResponseDto> {
    return this.authService.verifyEmailToken(token);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<MessageResponseDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  
}
