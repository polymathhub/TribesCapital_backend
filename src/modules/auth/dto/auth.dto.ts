import { IsEmail, IsIn, IsOptional, IsString, IsStrongPassword, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'member@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Amina' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Okafor' })
  @IsString()
  lastName!: string;

  @ApiProperty({ minLength: 12, format: 'password' })
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @IsStrongPassword({ minLength: 12, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
  password!: string;

  @ApiPropertyOptional({ format: 'password' })
  @IsOptional()
  @IsString()
  passwordConfirmation?: string;

  @ApiPropertyOptional({
    enum: ['Facility Operator', 'Investor', 'Community Member', 'Read-only Guest'],
    example: 'Community Member',
    description: 'Account category. Read-only Guest accounts can browse approved public content; Investor accounts receive read-only investor-tool access.',
  })
  @IsOptional()
  @IsString()
  @IsIn(['Facility Operator', 'Investor', 'Community Member', 'Read-only Guest'])
  role?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class CheckEmailDto {
  @IsEmail()
  email!: string;
}

export class GoogleAuthDto {
  @IsString()
  idToken!: string;

  @IsOptional()
  @IsString()
  accessToken?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class VerifyCodeDto {
  @IsEmail()
  email!: string;

  @IsString()
  code!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  code!: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @IsStrongPassword({ minLength: 12, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
  password!: string;
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  email!: string;
  @ApiProperty()
  firstName!: string;
  @ApiProperty()
  lastName!: string;
  @ApiPropertyOptional({ type: Boolean })
  emailVerified?: boolean;
  isActive?: boolean;
  googleId?: string;
  @ApiPropertyOptional({ enum: ['COMMUNITY_MEMBER', 'INVESTOR', 'FACILITY_OPERATOR', 'GUEST'] })
  accountType?: string;
  roles?: string[];
  isAdmin?: boolean;
}

export class AuthTokenResponseDto {
  @ApiPropertyOptional()
  success?: boolean;
  @ApiPropertyOptional()
  message?: string;
  @ApiPropertyOptional({ type: 'object', description: 'Token and user response envelope.' })
  data?: {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    user?: UserResponseDto;
  };
  @ApiProperty()
  accessToken!: string;
  @ApiProperty()
  refreshToken!: string;
  @ApiProperty()
  expiresIn!: number;
  youtubeToken?: string;
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}

export class MessageResponseDto {
  @ApiProperty()
  message!: string;
}
