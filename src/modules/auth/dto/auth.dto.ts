import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
  IsOptional,
  IsUUID,
  IsStrongPassword,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ============================================================================
// REGISTRATION DTO
// ============================================================================

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be valid' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  email!: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString({ message: 'First name must be a string' })
  @MinLength(1, { message: 'First name must not be empty' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString({ message: 'Last name must be a string' })
  @MinLength(1, { message: 'Last name must not be empty' })
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  lastName!: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description:
      'Strong password: min 12 chars, uppercase, lowercase, number, special char',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @IsStrongPassword(
    {
      minLength: 12,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must contain at least 12 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
    },
  )
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password!: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password confirmation',
  })
  @IsNotEmpty({ message: 'Password confirmation is required' })
  @IsString({ message: 'Password confirmation must be a string' })
  passwordConfirmation!: string;
}

// ============================================================================
// LOGIN DTO
// ============================================================================

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be valid' })
  email!: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'User password',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(1, { message: 'Password must not be empty' })
  password!: string;
}

// ============================================================================
// EMAIL VERIFICATION DTO
// ============================================================================

export class VerifyEmailDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyfQ',
    description: 'Email verification token from email link',
  })
  @IsNotEmpty({ message: 'Token is required' })
  @IsString({ message: 'Token must be a string' })
  token!: string;
}

// ============================================================================
// FORGOT PASSWORD DTO
// ============================================================================

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to send reset link to',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be valid' })
  email!: string;
}

// ============================================================================
// RESET PASSWORD DTO
// ============================================================================

export class ResetPasswordDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyfQ',
    description: 'Password reset token from email link',
  })
  @IsNotEmpty({ message: 'Token is required' })
  @IsString({ message: 'Token must be a string' })
  token!: string;

  @ApiProperty({
    example: 'NewSecurePass123!',
    description: 'New password',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @IsStrongPassword(
    {
      minLength: 12,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must contain at least 12 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
    },
  )
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password!: string;

  @ApiProperty({
    example: 'NewSecurePass123!',
    description: 'Password confirmation',
  })
  @IsNotEmpty({ message: 'Password confirmation is required' })
  @IsString({ message: 'Password confirmation must be a string' })
  passwordConfirmation!: string;
}

// ============================================================================
// REFRESH TOKEN DTO
// ============================================================================

export class RefreshTokenDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ',
    description: 'Refresh token',
  })
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString({ message: 'Refresh token must be a string' })
  refreshToken!: string;
}

// ============================================================================
// GOOGLE AUTH DTO
// ============================================================================

export class GoogleAuthDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ...',
    description: 'Google ID token',
  })
  @IsNotEmpty({ message: 'ID token is required' })
  @IsString({ message: 'ID token must be a string' })
  idToken!: string;

  @ApiProperty({
    example: 'ya29.a0AfH6SMB...',
    description: 'Google access token',
  })
  @IsNotEmpty({ message: 'Access token is required' })
  @IsString({ message: 'Access token must be a string' })
  accessToken!: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class UserResponseDto {
  @ApiProperty({
    example: 'clh7z0j9s0000qz0z0000000',
    description: 'User ID',
  })
  id!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email',
  })
  email!: string;

  @ApiProperty({
    example: 'John',
    description: 'First name',
  })
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name',
  })
  lastName!: string;

  @ApiProperty({
    example: true,
    description: 'Whether email is verified',
  })
  emailVerified!: boolean;

  @ApiProperty({
    example: ['user', 'admin'],
    description: 'User roles',
  })
  roles!: string[];

  @ApiProperty({
    example: '2024-06-14T10:30:00Z',
    description: 'Account creation timestamp',
  })
  createdAt!: Date;
}

export class AuthTokenResponseDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ',
    description: 'Access token (JWT)',
  })
  accessToken!: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ',
    description: 'Refresh token (JWT)',
  })
  refreshToken!: string;

  @ApiProperty({
    example: 900,
    description: 'Access token expiration in seconds',
  })
  expiresIn!: number;

  @ApiProperty({
    description: 'User information',
  })
  user!: UserResponseDto;
}

export class MessageResponseDto {
  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Response message',
  })
  message!: string;
}

