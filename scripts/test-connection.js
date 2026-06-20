#!/usr/bin/env node

/**
 * Database Connection Test using Prisma
 * Tests connectivity to Railway PostgreSQL
 */

const path = require('path');

// Load .env file
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
  console.log('\n🔍 DATABASE CONNECTION TEST (using Prisma)\n');
  console.log('═'.repeat(60));

  const dbUrl = process.env.DATABASE_URL;
  
  console.log('\n📋 Connection Details:');
  if (dbUrl) {
    const masked = dbUrl.replace(/:[^:]+@/, ':***@');
    console.log(`   DATABASE_URL: ${masked}`);
  } else {
    console.log('   DATABASE_URL: NOT SET');
  }
  
  console.log(`   DB_HOST: ${process.env.DB_HOST}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);

  try {
    console.log('\n✓ Step 1: Importing Prisma Client...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      log: ['warn', 'error'],
    });

    console.log('   ✅ Prisma Client imported');

    console.log('\n✓ Step 2: Testing database connection...');
    const result = await prisma.$queryRaw`SELECT NOW() as current_time;`;
    
    console.log('   ✅ Connected to PostgreSQL');
    console.log(`   Server time: ${result[0].current_time}`);

    console.log('\n✓ Step 3: Checking tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    if (tables.length === 0) {
      console.log('   ⚠️  No tables found');
      console.log('   Run: npm run db:migrate');
    } else {
      console.log(`   ✅ Found ${tables.length} tables`);
      tables.slice(0, 10).forEach(t => {
        console.log(`      • ${t.table_name}`);
      });
    }

    console.log('\n✓ Step 4: Getting database version...');
    const version = await prisma.$queryRaw`SELECT version();`;
    const versionStr = version[0].version.split(',')[0];
    console.log(`   ${versionStr}`);

    console.log('\n' + '═'.repeat(60));
    console.log('\n✅ CONNECTION SUCCESSFUL!\n');

    await prisma.$disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n   ❌ Connection failed!');
    console.error(`\n   Error: ${error.message}`);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n   💡 Troubleshooting:');
      console.error('      - Check if Railway database is running');
      console.error('      - Verify DATABASE_URL is correct');
      console.error('      - Check network/firewall settings');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n   💡 Troubleshooting:');
      console.error('      - Database password is incorrect');
      console.error('      - Check DB_PASSWORD in .env');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n   💡 Troubleshooting:');
      console.error('      - Cannot resolve database host');
      console.error('      - Check DB_HOST is correct');
      console.error('      - Check internet/DNS');
    } else if (error.message.includes('timeout')) {
      console.error('\n   💡 Troubleshooting:');
      console.error('      - Connection timeout');
      console.error('      - Check if Railway database is accessible');
      console.error('      - Check network/firewall');
    }

    console.log('\n' + '═'.repeat(60) + '\n');
    process.exit(1);
  }
}

testConnection();
