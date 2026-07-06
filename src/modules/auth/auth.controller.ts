import { Body, Controller, HttpCode, Post, Logger } from '@nestjs/common';
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
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthTokenResponseDto> {
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
