import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, TokenResponseDto, RefreshTokenDto, GoogleAuthDto, ForgotPasswordDto, VerifyCodeDto, ResetPasswordDto } from './dto/auth.dto';
import { Public } from '@common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('google')
  @HttpCode(200)
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto): Promise<TokenResponseDto> {
    return this.authService.authenticateWithGoogle(googleAuthDto);
  }

  @Public()
  @Post(['refresh', 'refresh-token'])
  @HttpCode(200)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('verify-code')
  @HttpCode(200)
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto): Promise<{ valid: boolean }> {
    return this.authService.verifyResetCode(verifyCodeDto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body('token') token: string): Promise<{ valid: boolean; message: string }> {
    return this.authService.verifyEmailToken(token);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
