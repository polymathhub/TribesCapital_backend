#!/usr/bin/env node

/**
 * Simple Database Connection Test
 * Uses built-in Node modules only
 */

const https = require('https');
const path = require('path');

// Load .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testRailwayConnection() {
  console.log('\n🔍 RAILWAY POSTGRESQL CONNECTION TEST\n');
  console.log('═'.repeat(70));

  const config = {
    host: process.env.DB_HOST || 'thomas.proxy.rlwy.net',
    port: parseInt(process.env.DB_PORT || '32051'),
    database: process.env.DB_NAME || 'railway',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
  };

  console.log('\n📋 Configuration:');
  console.log(`   Host:     ${config.host}`);
  console.log(`   Port:     ${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User:     ${config.user}`);
  console.log(`   Password: ${config.password ? '✓ Set' : '✗ Not set'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✓ Set' : '✗ Not set'}`);

  // Test 1: DNS Resolution
  console.log('\n✓ Step 1: Testing DNS Resolution...');
  const dns = require('dns').promises;
  try {
    const addresses = await dns.resolve4(config.host);
    console.log(`   ✅ Host resolved to: ${addresses[0]}`);
  } catch (error) {
    console.error(`   ❌ DNS Resolution failed: ${error.message}`);
    console.log('\n   💡 Troubleshooting:');
    console.log('      - Check internet connection');
    console.log('      - Check if thomas.proxy.rlwy.net is accessible');
    console.log('      - Try: nslookup thomas.proxy.rlwy.net');
    console.log('\n' + '═'.repeat(70) + '\n');
    process.exit(1);
  }

  // Test 2: Port Connectivity
  console.log('\n✓ Step 2: Testing Port Connectivity...');
  const net = require('net');
  
  return new Promise((resolve) => {
    const socket = net.createConnection({
      host: config.host,
      port: config.port,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log(`   ✅ Connection established on port ${config.port}`);
      socket.destroy();

      console.log('\n✓ Step 3: Summary');
      console.log('   ✅ DNS resolution: Working');
      console.log('   ✅ Port connectivity: Working');
      console.log('   ✅ Network access: Confirmed');
      
      console.log('\n' + '═'.repeat(70));
      console.log('\n✅ BASIC CONNECTIVITY TEST PASSED!\n');
      console.log('📝 Next Steps:');
      console.log('   1. Ensure Prisma dependencies are installed: npm install');
      console.log('   2. Test full connection with: node scripts/test-connection.js');
      console.log('   3. Apply migrations: npm run db:migrate');
      console.log('   4. Check DATABASE_URL credentials are correct\n');
      
      resolve();
    });

    socket.on('timeout', () => {
      socket.destroy();
      console.error(`   ❌ Connection timeout (10s)`);
      console.log('\n   💡 Troubleshooting:');
      console.log('      - Railway database may be offline');
      console.log('      - Check Railway dashboard: https://railway.app');
      console.log('      - Verify database is running');
      console.log('      - Check firewall/network settings');
      console.log('\n' + '═'.repeat(70) + '\n');
      process.exit(1);
    });

    socket.on('error', (error) => {
      socket.destroy();
      console.error(`   ❌ Connection error: ${error.code}`);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('\n   💡 Connection refused - database may be offline');
      } else if (error.code === 'ENOTFOUND') {
        console.log('\n   💡 Host not found - DNS resolution failed');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('\n   💡 Connection timeout - network unreachable');
      }
      
      console.log(`\n   Full error: ${error.message}`);
      console.log('\n' + '═'.repeat(70) + '\n');
      process.exit(1);
    });
  });
}

testRailwayConnection().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
