export function isDatabaseSkipEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env.DB_SKIP || env.NO_DATABASE_MODE || env.DATABASE_SKIP || env.NO_DB || '';
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}
