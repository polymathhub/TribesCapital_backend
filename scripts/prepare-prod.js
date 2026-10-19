#!/usr/bin/env node
const { spawnSync } = require('child_process');

function shouldSkipPrismaBootstrap(env = process.env) {
  const value = env.DB_SKIP || env.NO_DATABASE_MODE || env.DATABASE_SKIP || env.NO_DB || '';
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function getPrismaBootstrapArgs(env = process.env) {
  return String(env.NODE_ENV || '').toLowerCase() === 'production'
    ? ['prisma', 'migrate', 'deploy']
    : ['prisma', 'db', 'push'];
}

function run(env = process.env, spawn = spawnSync) {
  if (shouldSkipPrismaBootstrap(env)) {
    console.log('Skipping Prisma database bootstrap because it is disabled.');
    return;
  }

  const args = getPrismaBootstrapArgs(env);
  const result = spawn('npx', args, {
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

module.exports = { shouldSkipPrismaBootstrap, getPrismaBootstrapArgs, run };
