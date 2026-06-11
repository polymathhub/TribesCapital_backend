import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin role
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator role with full access',
    },
  });

  console.log('✅ Admin role created/updated:', adminRole);

  // Create moderator role
  const moderatorRole = await prisma.role.upsert({
    where: { name: 'moderator' },
    update: {},
    create: {
      name: 'moderator',
      description: 'Moderator role for managing content',
    },
  });

  console.log('✅ Moderator role created/updated:', moderatorRole);

  // Create user role
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Regular user role',
    },
  });

  console.log('✅ User role created/updated:', userRole);

  // Create admin user (optional - you can modify email/password)
  const hashedPassword = await bcrypt.hash('Admin@123456', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@tribescapital.com' },
    update: {},
    create: {
      email: 'admin@tribescapital.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      isActive: true,
      emailVerified: true,
      roles: {
        connect: [{ id: adminRole.id }],
      },
    },
    include: { roles: true },
  });

  console.log('✅ Admin user created/updated:', adminUser);

  // Create event management permissions
  const permissions = [
    {
      name: 'event_create',
      resource: 'events',
      action: 'create',
      description: 'Create new events',
    },
    {
      name: 'event_read',
      resource: 'events',
      action: 'read',
      description: 'View events',
    },
    {
      name: 'event_update',
      resource: 'events',
      action: 'update',
      description: 'Update events',
    },
    {
      name: 'event_delete',
      resource: 'events',
      action: 'delete',
      description: 'Delete events',
    },
  ];

  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    console.log('✅ Permission created/updated:', permission);
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
