// create-user-direct.js
// Usage: set DATABASE_URL env then `node scripts/create-user-direct.js`
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = `test+direct+${Date.now()}@example.com`;
  const firstName = 'Direct';
  const lastName = 'Create';
  const password = 'StrongPass123!';

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      password: passwordHash,
      emailVerified: true,
      isActive: true,
      roles: {
        connectOrCreate: {
          where: { name: 'user' },
          create: { name: 'user', description: 'Regular user role' },
        },
      },
    },
    include: { roles: true },
  });

  console.log('Created user:', { id: user.id, email: user.email, roles: user.roles.map(r => r.name) });
}

main()
  .catch((e) => {
    console.error('Error creating user:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
