#!/usr/bin/env node

/**
 * Create Demo User for Development
 * Usage: npx ts-node scripts/create-demo-user.ts
 * 
 * Creates a test user that can be used for development/testing
 * Demo credentials:
 *  - Email: demo@tribes.capital
 *  - Password: DemoPass123!
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🎭 Creating demo user...\n');

  const demoEmail = 'demo@tribes.capital';
  const demoPassword = 'DemoPass123!';

  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (existingUser) {
      console.log(`✅ Demo user already exists`);
      console.log(`   Email: ${demoEmail}`);
      console.log(`   Password: ${demoPassword}\n`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(demoPassword, 12);

    // Create user with 'user' role
    const demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        firstName: 'Demo',
        lastName: 'User',
        password: passwordHash,
        emailVerified: true, // Pre-verified for convenience
        isActive: true,
        roles: {
          connectOrCreate: [
            {
              where: { name: 'user' },
              create: {
                name: 'user',
                description: 'Regular user role',
              },
            },
          ],
        },
      },
      include: {
        roles: true,
      },
    });

    console.log('✅ Demo user created successfully!\n');
    console.log('📋 Demo Credentials:');
    console.log(`   Email:    ${demoEmail}`);
    console.log(`   Password: ${demoPassword}`);
    console.log(`   User ID:  ${demoUser.id}\n`);
    console.log('💡 Use these credentials to test the login flow');
    console.log('   The "Demo Login" button on the auth page will pre-fill these credentials\n');

  } catch (error) {
    console.error('❌ Error creating demo user:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
