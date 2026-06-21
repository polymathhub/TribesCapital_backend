#!/bin/bash

# ============================================================================
# Tribes Capital - Database Migration & Setup Script
# ============================================================================
# This script initializes the database schema and seed data for deployment
# Run: npm run db:migrate or ts-node scripts/init-db.ts
#

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📦 Initializing Tribes Capital Database...\n');

  try {
    // ========================================================================
    // STEP 1: Verify Connection
    // ========================================================================
    console.log('📡 Verifying database connection...');
    await prisma.$executeRawUnsafe('SELECT 1');
    console.log('✅ Database connection successful\n');

    // ========================================================================
    // STEP 2: Create Roles (if not exist)
    // ========================================================================
    console.log('👥 Initializing default roles...');
    const roles = ['admin', 'moderator', 'user', 'instructor'];
    
    for (const roleName of roles) {
      const existing = await prisma.role.findUnique({
        where: { name: roleName },
      });

      if (!existing) {
        await prisma.role.create({
          data: {
            name: roleName,
            description: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role`,
          },
        });
        console.log(`   ✓ Created role: ${roleName}`);
      } else {
        console.log(`   ⊘ Role already exists: ${roleName}`);
      }
    }
    console.log('');

    // ========================================================================
    // STEP 3: Create Permissions (if not exist)
    // ========================================================================
    console.log('🔐 Initializing default permissions...');
    const permissions = [
      // Auth permissions
      { name: 'auth:login', resource: 'auth', action: 'login' },
      { name: 'auth:register', resource: 'auth', action: 'register' },
      { name: 'auth:refresh', resource: 'auth', action: 'refresh' },
      
      // User permissions
      { name: 'users:read', resource: 'users', action: 'read' },
      { name: 'users:update', resource: 'users', action: 'update' },
      { name: 'users:delete', resource: 'users', action: 'delete' },
      
      // Course permissions
      { name: 'courses:create', resource: 'courses', action: 'create' },
      { name: 'courses:read', resource: 'courses', action: 'read' },
      { name: 'courses:update', resource: 'courses', action: 'update' },
      { name: 'courses:delete', resource: 'courses', action: 'delete' },
    ];

    for (const perm of permissions) {
      const existing = await prisma.permission.findUnique({
        where: { name: perm.name },
      });

      if (!existing) {
        await prisma.permission.create({
          data: perm,
        });
        console.log(`   ✓ Created permission: ${perm.name}`);
      } else {
        console.log(`   ⊘ Permission already exists: ${perm.name}`);
      }
    }
    console.log('');

    // ========================================================================
    // STEP 4: Assign Permissions to Roles
    // ========================================================================
    console.log('🔗 Assigning permissions to roles...');
    
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' },
      include: { permissions: true },
    });

    if (adminRole) {
      // Admin gets all permissions
      const allPerms = await prisma.permission.findMany();
      const existingPermIds = new Set(adminRole.permissions.map(p => p.id));
      
      for (const perm of allPerms) {
        if (!existingPermIds.has(perm.id)) {
          await prisma.role.update({
            where: { id: adminRole.id },
            data: {
              permissions: {
                connect: { id: perm.id },
              },
            },
          });
          console.log(`   ✓ Assigned ${perm.name} to admin`);
        }
      }
    }

    console.log('');

    // ========================================================================
    // STEP 5: Summary
    // ========================================================================
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    const permCount = await prisma.permission.count();

    console.log('✅ Database initialization complete!\n');
    console.log('📊 Database Summary:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Roles: ${roleCount}`);
    console.log(`   Permissions: ${permCount}`);
    console.log('\n🚀 Ready for deployment!\n');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
