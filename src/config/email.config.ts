import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  enabled: process.env.EMAIL_ENABLED === 'true',
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  user: process.env.EMAIL_USER || '',
  password: process.env.EMAIL_PASSWORD || '',
  from: process.env.EMAIL_FROM || 'noreply@tribescapital.com',
  fromName: process.env.EMAIL_FROM_NAME || 'Tribes Capital',
}));
