#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests connectivity to Railway PostgreSQL and reports detailed diagnostics
 */

const fs = require('fs');
const path = require('path');

// Load .env file
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Client } = require('pg');

async function testConnection() {
  console.log('\n🔍 DATABASE CONNECTION DIAGNOSTICS\n');
  console.log('═'.repeat(60));

  // Display configuration
  const config = {
    DATABASE_URL: process.env.DATABASE_URL,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_NAME: process.env.DB_NAME,
    NODE_ENV: process.env.NODE_ENV,
  };

  console.log('\n📋 Configuration:');
  Object.entries(config).forEach(([key, value]) => {
    if (key === 'DATABASE_URL' && value) {
      const masked = value.replace(/:[^:]+@/, ':***@');
      console.log(`   ${key}: ${masked}`);
    } else if (key === 'DB_PASSWORD') {
      console.log(`   ${key}: ***`);
    } else {
      console.log(`   ${key}: ${value || '(not set)'}`);
    }
  });

  // Test 1: Check if DATABASE_URL is set
  console.log('\n✓ Step 1: Checking DATABASE_URL...');
  if (!process.env.DATABASE_URL) {
    console.error('   ❌ DATABASE_URL is not set!');
    process.exit(1);
  }
  console.log('   ✅ DATABASE_URL is configured');

  // Test 2: Try to connect
  console.log('\n✓ Step 2: Attempting PostgreSQL connection...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('   ✅ Successfully connected to PostgreSQL');

    // Test 3: Get server info
    console.log('\n✓ Step 3: Retrieving server information...');
    const versionResult = await client.query('SELECT version();');
    console.log(`   ${versionResult.rows[0].version.split(',')[0]}`);

    // Test 4: Get database info
    console.log('\n✓ Step 4: Checking database and tables...');
    const dbResult = await client.query(
      `SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;`
    );
    console.log(`   Available databases: ${dbResult.rows.map(r => r.datname).join(', ')}`);

    // Test 5: Check for existing tables
    console.log('\n✓ Step 5: Checking existing tables...');
    const tablesResult = await client.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name;`
    );
    
    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️  No tables found - database may need migrations');
    } else {
      console.log(`   Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`      • ${row.table_name}`);
      });
    }

    // Test 6: Test a simple query
    console.log('\n✓ Step 6: Testing query execution...');
    const testQuery = await client.query('SELECT NOW() as current_time;');
    console.log(`   Server time: ${testQuery.rows[0].current_time}`);

    console.log('\n' + '═'.repeat(60));
    console.log('\n✅ ALL TESTS PASSED - Database connection is working!\n');

  } catch (error) {
    console.error('\n   ❌ Connection failed!');
    console.error(`\n   Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n   💡 Troubleshooting:');
      console.error('      - Check if database host is reachable');
      console.error('      - Verify DATABASE_URL in .env file');
      console.error('      - Check firewall/network settings');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n   💡 Troubleshooting:');
      console.error('      - Database host cannot be resolved');
      console.error('      - Check DNS and network connectivity');
      console.error('      - Verify DB_HOST is correct');
    } else if (error.message.includes('authentication')) {
      console.error('\n   💡 Troubleshooting:');
      console.error('      - Database credentials are incorrect');
      console.error('      - Check DB_USERNAME and DB_PASSWORD');
    } else if (error.message.includes('SSL')) {
      console.error('\n   💡 Troubleshooting:');
      console.error('      - SSL connection issue');
      console.error('      - DATABASE_URL should include ?sslmode=require');
    }
    
    console.log('\n' + '═'.repeat(60) + '\n');
    process.exit(1);

  } finally {
    await client.end();
  }
}

testConnection().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
