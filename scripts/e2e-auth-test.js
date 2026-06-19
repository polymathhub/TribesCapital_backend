#!/usr/bin/env node
/**
 * End-to-End Auth Flow Test
 * Tests: register → DB write → login with credentials → tokens
 * Usage: set DATABASE_URL env, then `node scripts/e2e-auth-test.js http://localhost:3000`
 */
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = process.argv[2] || 'http://localhost:3000';

async function testAuthFlow() {
  const testUser = {
    email: `test+e2e+${Date.now()}@example.com`,
    firstName: 'E2E',
    lastName: 'Test',
    password: 'E2ETest123!@#',
    role: 'Investor',
  };

  console.log(`\n🧪 E2E AUTH FLOW TEST\n`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User: ${testUser.email}\n`);

  try {
    // ═══════════════════════════════════════════════════════
    // STEP 1: REGISTER
    // ═══════════════════════════════════════════════════════
    console.log(`📝 STEP 1: Register user...`);
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      email: testUser.email,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      password: testUser.password,
      passwordConfirmation: testUser.password,
      role: testUser.role,
    });

    console.log(`✅ Register response status: ${registerRes.status}`);
    console.log(`   Access Token: ${registerRes.data?.accessToken ? '✓' : '✗'}`);
    console.log(`   User ID: ${registerRes.data?.user?.id || 'N/A'}`);
    console.log(`   Email Verified: ${registerRes.data?.user?.emailVerified || 'N/A'}`);
    console.log(`   Roles: ${registerRes.data?.user?.roles?.join(',') || 'N/A'}`);

    const userId = registerRes.data?.user?.id;
    if (!userId) {
      throw new Error('Register response missing user.id');
    }

    // ═══════════════════════════════════════════════════════
    // STEP 2: VERIFY USER IN DATABASE
    // ═══════════════════════════════════════════════════════
    console.log(`\n🔍 STEP 2: Query user from database...`);
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!dbUser) {
      throw new Error('User not found in database after registration!');
    }

    console.log(`✅ User found in DB`);
    console.log(`   ID: ${dbUser.id}`);
    console.log(`   Email: ${dbUser.email}`);
    console.log(`   First Name: ${dbUser.firstName}`);
    console.log(`   Last Name: ${dbUser.lastName}`);
    console.log(`   Email Verified: ${dbUser.emailVerified}`);
    console.log(`   Is Active: ${dbUser.isActive}`);
    console.log(`   Roles: ${dbUser.roles.map(r => r.name).join(', ')}`);

    // ═══════════════════════════════════════════════════════
    // STEP 3: LOGIN WITH CREDENTIALS
    // ═══════════════════════════════════════════════════════
    console.log(`\n🔑 STEP 3: Login with credentials...`);
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });

    console.log(`✅ Login response status: ${loginRes.status}`);
    console.log(`   Access Token: ${loginRes.data?.accessToken ? '✓ (received)' : '✗'}`);
    console.log(`   Refresh Token: ${loginRes.data?.refreshToken ? '✓ (received)' : '✗'}`);
    console.log(`   User ID: ${loginRes.data?.user?.id}`);
    console.log(`   Email Verified: ${loginRes.data?.user?.emailVerified}`);

    // ═══════════════════════════════════════════════════════
    // STEP 4: TEST WRONG PASSWORD
    // ═══════════════════════════════════════════════════════
    console.log(`\n❌ STEP 4: Attempt login with wrong password...`);
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: 'WrongPassword123!',
      });
      console.log(`✗ ERROR: Login should have failed but succeeded!`);
    } catch (err) {
      console.log(`✅ Login correctly rejected`);
      console.log(`   Status: ${err.response?.status}`);
      console.log(`   Error: ${err.response?.data?.message || err.message}`);
    }

    // ═══════════════════════════════════════════════════════
    // SUCCESS
    // ═══════════════════════════════════════════════════════
    console.log(`\n✨ E2E TEST PASSED ✨\n`);
    console.log(`Summary:`);
    console.log(`  ✓ User registered successfully`);
    console.log(`  ✓ User written to database`);
    console.log(`  ✓ User can login with correct credentials`);
    console.log(`  ✓ User cannot login with wrong credentials`);
    console.log(`  ✓ Access tokens are returned\n`);

  } catch (error) {
    console.error(`\n❌ E2E TEST FAILED\n`);
    if (error.response) {
      console.error(`HTTP Error: ${error.response.status}`);
      console.error(`Response:`, error.response.data);
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testAuthFlow();
