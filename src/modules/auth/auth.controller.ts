import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  UseGuards,
  Req,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
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
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ============================================================================
  // REGISTRATION
  // ============================================================================

  @Public()
  @Post('register')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account and send verification email',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: any,
  ): Promise<AuthTokenResponseDto> {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.get('user-agent');

    return this.authService.register(registerDto, ipAddress, userAgent);
  }

  // ============================================================================
  // LOGIN
  // ============================================================================

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate with email and password',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: any,
  ): Promise<AuthTokenResponseDto> {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.get('user-agent');

    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  @Public()
  @Get('verify-email')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Verify email address',
    description:
      'Verify email with token from verification email link',
  })
  @ApiQuery({
    name: 'token',
    description: 'Email verification token',
    required: true,
  })
  async verifyEmail(@Query('token') token: string): Promise<MessageResponseDto> {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    return this.authService.verifyEmail({ token });
  }

  // ============================================================================
  // FORGOT PASSWORD
  // ============================================================================

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Send password reset link to email (returns same response regardless of email existence)',
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Req() req: any,
  ): Promise<MessageResponseDto> {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.get('user-agent');

    return this.authService.forgotPassword(
      forgotPasswordDto,
      ipAddress,
      userAgent,
    );
  }

  // ============================================================================
  // RESET PASSWORD
  // ============================================================================

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Reset password with token',
    description:
      'Reset password using token from password reset email',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: any,
  ): Promise<MessageResponseDto> {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.get('user-agent');

    return this.authService.resetPassword(
      resetPasswordDto,
      ipAddress,
      userAgent,
    );
  }

  // ============================================================================
  // REFRESH TOKEN
  // ============================================================================

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using refresh token',
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: any,
  ): Promise<AuthTokenResponseDto> {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.get('user-agent');

    return this.authService.refreshTokens(
      refreshTokenDto,
      ipAddress,
      userAgent,
    );
  }

  // ============================================================================
  // LOGOUT
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout current session',
    description: 'Revoke current refresh token and logout',
  })
  async logout(
    @CurrentUser() user: UserResponseDto,
    @Req() req: any,
  ): Promise<MessageResponseDto> {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.get('user-agent');

    return this.authService.logout(user.id, ipAddress, userAgent);
  }

  // ============================================================================
  // LOGOUT ALL DEVICES
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Revoke all refresh tokens and logout from all sessions',
  })
  async logoutAllDevices(
    @CurrentUser() user: UserResponseDto,
    @Req() req: any,
  ): Promise<MessageResponseDto> {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.get('user-agent');

    return this.authService.logoutAllDevices(user.id, ipAddress, userAgent);
  }

  // ============================================================================
  // GOOGLE OAUTH
  // ============================================================================

  @Public()
  @Post('google')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Authenticate with Google',
    description: 'Login or register with Google OAuth',
  })
  async googleAuth(
    @Body() googleAuthDto: GoogleAuthDto,
    @Req() req: any,
  ): Promise<AuthTokenResponseDto> {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.get('user-agent');

    return this.authService.authenticateWithGoogle(
      googleAuthDto,
      ipAddress,
      userAgent,
    );
  }

  // ============================================================================
  // CURRENT USER
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user',
    description: 'Retrieve information about the authenticated user',
  })
  async getCurrentUser(
    @CurrentUser() user: UserResponseDto,
  ): Promise<UserResponseDto> {
    return user;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private getClientIp(req: any): string {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket?.remoteAddress ||
      'unknown'
    );
  }
}
