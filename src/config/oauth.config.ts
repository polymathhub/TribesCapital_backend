import { registerAs } from '@nestjs/config';

export default registerAs('oauth', () => ({
  google: {
    clientId:
      process.env.GOOGLE_CLIENT_ID ||
      'your-google-client-id-here.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUrl:
      process.env.GOOGLE_REDIRECT_URL || 'http://localhost:5173/auth/callback',
  },
}));
