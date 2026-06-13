import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const dbUrl = process.env.DATABASE_URL;
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
  const dbUsername = process.env.DB_USERNAME || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'postgres';
  const dbName = process.env.DB_NAME || 'tribes_capital';

  // Construct DATABASE_URL if not provided
  const constructedUrl = `postgresql://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  const url = dbUrl || constructedUrl;

  // Ensure DATABASE_URL is set for Prisma
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = url;
  }

  return {
    url,
    host: dbHost,
    port: dbPort,
    username: dbUsername,
    password: dbPassword,
    database: dbName,
  };
});
