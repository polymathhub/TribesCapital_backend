const { shouldSkipPrismaBootstrap, getPrismaBootstrapArgs, run } = require('./prepare-prod');

describe('prepare-prod startup guard', () => {
  it('skips Prisma bootstrap when database access is explicitly disabled', () => {
    expect(shouldSkipPrismaBootstrap({ DB_SKIP: 'true' })).toBe(true);
    expect(shouldSkipPrismaBootstrap({ NO_DATABASE_MODE: '1' })).toBe(true);
    expect(shouldSkipPrismaBootstrap({ DATABASE_SKIP: 'yes' })).toBe(true);
    expect(shouldSkipPrismaBootstrap({ NO_DB: 'on' })).toBe(true);
  });

  it('uses versioned migrations in production and schema push outside production', () => {
    expect(getPrismaBootstrapArgs({ NODE_ENV: 'production' })).toEqual(['prisma', 'migrate', 'deploy']);
    expect(getPrismaBootstrapArgs({ NODE_ENV: 'development' })).toEqual(['prisma', 'db', 'push']);
    expect(getPrismaBootstrapArgs({})).toEqual(['prisma', 'db', 'push']);
  });

  it('runs production migrations unless database bootstrap is disabled', () => {
    const spawn = jest.fn(() => ({ status: 0 }));
    run({ NODE_ENV: 'production' }, spawn);
    expect(spawn).toHaveBeenCalledWith('npx', ['prisma', 'migrate', 'deploy'], {
      stdio: 'inherit',
      shell: false,
    });

    spawn.mockClear();
    run({ NODE_ENV: 'production', DB_SKIP: 'true' }, spawn);
    expect(spawn).not.toHaveBeenCalled();
  });
});
