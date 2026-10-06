import { validateSync } from 'class-validator';
import { RegisterDto, ResetPasswordDto } from './auth.dto';

describe('Authentication password DTOs', () => {
  it('accepts a password matching the frontend policy for registration', () => {
    const dto = Object.assign(new RegisterDto(), {
      email: 'member@example.com',
      firstName: 'Amina',
      lastName: 'Okafor',
      password: 'StrongPass123!',
    });

    expect(validateSync(dto)).toHaveLength(0);
  });

  it.each(['Short1!', 'lowercasepassword1!', 'UPPERCASE123!'])('rejects a password outside the registration policy: %s', (password) => {
    const dto = Object.assign(new RegisterDto(), {
      email: 'member@example.com',
      firstName: 'Amina',
      lastName: 'Okafor',
      password,
    });

    expect(validateSync(dto).some((error) => error.property === 'password')).toBe(true);
  });

  it('applies the same strength policy to password resets', () => {
    const validDto = Object.assign(new ResetPasswordDto(), {
      email: 'member@example.com',
      code: '123456',
      password: 'StrongPass123!',
    });
    const invalidDto = Object.assign(new ResetPasswordDto(), {
      email: 'member@example.com',
      code: '123456',
      password: 'weakpass1',
    });

    expect(validateSync(validDto)).toHaveLength(0);
    expect(validateSync(invalidDto).some((error) => error.property === 'password')).toBe(true);
  });
});
