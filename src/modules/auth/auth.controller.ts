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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
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
  ResendVerificationDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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

  @Public()
  @Post('resend-verification')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Resend email verification',
    description: 'Send verification email again to the provided address',
  })
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ): Promise<MessageResponseDto> {
    return this.authService.resendVerificationEmail(resendVerificationDto.email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Send password reset link to email',
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

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Reset password with token',
    description:
      'Reset password using token from password reset email sent to you ',
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

  @Public()
  @Post('google')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Authenticate with Google OAuth',
    description:
      'Login or register a user via Google OAuth. ' +
      'Validates the Google ID token, creates/updates user account, and returns JWT tokens. ' +
      'The idToken must be obtained from Google Sign-In on the frontend. ' +
      'Google ID tokens are automatically verified for signature and expiration.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: AuthTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid token, token expired, email not verified by Google, or account linking conflict',
  })
  @ApiResponse({
    status: 500,
    description: 'OAuth configuration error or token verification failure',
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
