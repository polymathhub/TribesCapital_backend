#!/usr/bin/env node
const { spawnSync } = require('child_process');

function shouldSkipPrismaDbPush(env = process.env) {
  const value = env.DB_SKIP || env.NO_DATABASE_MODE || env.DATABASE_SKIP || env.NO_DB || '';
  const isExplicitlyDisabled = ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
  const isProduction = String(env.NODE_ENV || '').toLowerCase() === 'production';
  return isExplicitlyDisabled || isProduction;
}

function run() {
  if (shouldSkipPrismaDbPush()) {
    console.log('Skipping prisma db push because database bootstrap is disabled.');
    return;
  }

  const result = spawnSync('npx', ['prisma', 'db', 'push'], {
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { shouldSkipPrismaDbPush, run };
