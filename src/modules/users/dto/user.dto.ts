export class CreateUserDto {
  email!: string;
  firstName!: string;
  lastName!: string;
  password!: string;
}

export class UpdateUserDto {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
}

export class UserResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  avatar?: string;
  bio?: string;
  isActive!: boolean;
  createdAt!: Date;
}
