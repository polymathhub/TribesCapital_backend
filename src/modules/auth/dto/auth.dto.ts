import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @IsOptional()
  @IsString()
  passwordConfirmation?: string;

  @IsOptional()
  @IsString()
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

  @IsString()
  accessToken!: string;
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
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;
}

export class UserResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  emailVerified?: boolean;
  isActive?: boolean;
  googleId?: string;
}

export class AuthTokenResponseDto {
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: number;
  youtubeToken?: string;
  user!: UserResponseDto;
}

export class MessageResponseDto {
  message!: string;
}
