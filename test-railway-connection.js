const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:lScQsRYmiaFmCpowVBOkWyyrrghiioVE@zephyr.proxy.rlwy.net:55523/railway'
    }
  }
});

async function test() {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log('✓ Connected to Railway database');
    console.log('Time:', result[0]);
    process.exit(0);
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    process.exit(1);
  }
}

test();
