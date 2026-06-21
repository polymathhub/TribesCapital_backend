import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

/**
 * Database Reset Script
 * 
 * WARNING: This script will:
 * 1. DROP ALL TABLES
 * 2. Recreate schema from Prisma
 * 3. Seed demo data
 * 
 * USE ONLY IN PRODUCTION WHEN NECESSARY
 */

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('⚠️  WARNING: This will DELETE ALL DATA from the database!');
  console.log('Proceeding with database reset...\n');

  try {
    // Drop all tables
    console.log('🗑️  Dropping all tables...');
    
    const tables = [
      'DueDiligenceAuditLog',
      'DueDiligenceApproval', 
      'DueDiligenceComment',
      'DueDiligenceDocument',
      'DueDiligenceItem',
      'DueDiligence',
      'AnalyticsEvent',
      'NotificationRead',
      'Notification',
      'CommunityComment',
      'CommunityPost',
      'DocumentVersion',
      'Document',
      'MarketplaceItem',
      'ProjectStage',
      'Project',
      'RSVP',
      'Event',
      'Progress',
      'Enrollment',
      'Lesson',
      'Course',
      'AuditLog',
      'LoginAttempt',
      'RefreshToken',
      'PasswordResetToken',
      'EmailVerificationToken',
      'Permission',
      'Role',
      'User',
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
        console.log(`  ✅ Dropped ${table}`);
      } catch (err) {
        console.log(`  ⚠️  Could not drop ${table}: ${err}`);
      }
    }

    console.log('\n✅ All tables dropped\n');

    // Recreate schema
    console.log('🔄 Recreating schema with Prisma db push...');
    execSync('npx prisma db push --skip-generate --skip-validate', { 
      stdio: 'inherit',
      env: process.env
    });
    
    console.log('\n✅ Schema recreated successfully\n');

    // Seed data
    console.log('🌱 Seeding demo data...');
    execSync('npm run db:seed', { 
      stdio: 'inherit',
      env: process.env
    });
    
    console.log('\n🎉 Database reset and seeded successfully!');
    console.log('\nDemo login credentials:');
    console.log('  Email: demo@tribescapital.com');
    console.log('  Password: Demo@123456');
    
  } catch (error) {
    console.error('\n❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
