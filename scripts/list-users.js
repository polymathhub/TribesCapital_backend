// Script: list-users.js
// Usage: set DATABASE_URL env then `node scripts/list-users.js`
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: { roles: true },
  });

  if (!users || users.length === 0) {
    console.log('No users found');
    return;
  }

  console.log(`Found ${users.length} users:`);
  users.forEach((u, i) => {
    console.log(`\n#${i + 1}`);
    console.log(`id: ${u.id}`);
    console.log(`email: ${u.email}`);
    console.log(`name: ${u.firstName} ${u.lastName}`);
    console.log(`emailVerified: ${u.emailVerified}`);
    console.log(`isActive: ${u.isActive}`);
    console.log(`createdAt: ${u.createdAt}`);
    if (u.roles && u.roles.length) {
      console.log(`roles: ${u.roles.map(r => r.name).join(', ')}`);
    }
  });
}

main()
  .catch((e) => {
    console.error('Error querying users:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
