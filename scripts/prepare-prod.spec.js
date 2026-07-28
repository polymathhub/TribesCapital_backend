const { shouldSkipPrismaDbPush } = require('./prepare-prod');

describe('prepare-prod startup guard', () => {
  it('skips Prisma db push when database bootstrap is explicitly disabled', () => {
    expect(shouldSkipPrismaDbPush({ DB_SKIP: 'true' })).toBe(true);
    expect(shouldSkipPrismaDbPush({ NO_DATABASE_MODE: '1' })).toBe(true);
    expect(shouldSkipPrismaDbPush({ DATABASE_SKIP: 'yes' })).toBe(true);
    expect(shouldSkipPrismaDbPush({ NO_DB: 'on' })).toBe(true);
  });

  it('skips Prisma db push in production by default', () => {
    expect(shouldSkipPrismaDbPush({ NODE_ENV: 'production' })).toBe(true);
  });

  it('does not skip Prisma db push when database bootstrap is enabled', () => {
    expect(shouldSkipPrismaDbPush({})).toBe(false);
    expect(shouldSkipPrismaDbPush({ DB_SKIP: '' })).toBe(false);
    expect(shouldSkipPrismaDbPush({ NODE_ENV: 'development' })).toBe(false);
  });
});
