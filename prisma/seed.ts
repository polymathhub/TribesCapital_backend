import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

type RegistrationRow = Record<string, string>;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (character !== '\r') {
      field += character;
    }
  }

  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function readRegistrations(csvPath: string): RegistrationRow[] {
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const headers = rows.shift()?.map((header) => header.trim()) ?? [];

  return rows
    .filter((row) => row.some((value) => value.trim()))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, (row[index] ?? '').trim()])));
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() ?? 'User',
    lastName: parts.join(' '),
  };
}

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

async function importRegistrations(userRoleId: string) {
  const csvFileName = 'Registration form (Responses) - Form Responses 1.csv';
  const csvPath = process.env.REGISTRATION_CSV_PATH || [
    path.join(process.env.HOME || '', 'Downloads', csvFileName),
    path.join(process.cwd(), csvFileName),
    path.join('/Users/user/Downloads', csvFileName),
  ].find((candidate) => fs.existsSync(candidate)) || path.join(process.env.HOME || process.cwd(), 'Downloads', csvFileName);
  if (!fs.existsSync(csvPath)) {
    console.log(`Registration CSV not found at ${csvPath}; skipping registration import.`);
    return;
  }

  const credentialsPath = path.resolve(process.cwd(), '.imported-user-credentials.csv');
  const registrations = readRegistrations(csvPath);
  const credentials: Array<{ email: string; password: string }> = [];
  let createdCount = 0;
  let skippedCount = 0;

  for (const registration of registrations) {
    const email = registration.Email.toLowerCase();
    if (!/^[a-z0-9._%+-]+@gmail\.com$/.test(email)) {
      skippedCount += 1;
      continue;
    }

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      skippedCount += 1;
      continue;
    }

    const { firstName, lastName } = splitName(registration.Name);
    const password = `Tribes${randomBytes(12).toString('base64url')}`;
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: passwordHash,
        address: registration.Address || null,
        phoneNumber: registration['Phone number'] || null,
        occupation: registration['What best describes you?'] || null,
        school: registration['For Students: Name of School or Institution'] || null,
        department: registration['For Students: Department'] || null,
        isActive: true,
        emailVerified: true,
        roles: { connect: [{ id: userRoleId }] },
      },
    });

    credentials.push({ email, password });
    createdCount += 1;
  }

  if (credentials.length > 0) {
    const existingCredentials = fs.existsSync(credentialsPath)
      ? fs.readFileSync(credentialsPath, 'utf8').trim().split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
          const [email, password] = line.split(',').map((value) => value.replace(/^"|"$/g, ''));
          return { email, password };
        })
      : [];
    const allCredentials = [...existingCredentials, ...credentials];
    const uniqueCredentials = [...new Map(allCredentials.map((entry) => [entry.email, entry])).values()];
    fs.writeFileSync(
      credentialsPath,
      ['email,password', ...uniqueCredentials.map((entry) => `${csvField(entry.email)},${csvField(entry.password)}`)].join('\n') + '\n',
      { mode: 0o600 },
    );
  }

  console.log(`Registration import complete: ${createdCount} created, ${skippedCount} skipped.`);
  if (credentials.length > 0) {
    console.log(`New login credentials written to ${credentialsPath}`);
  }
}

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

  console.log('Admin role created/updated:', adminRole);

  // Create moderator role
  const moderatorRole = await prisma.role.upsert({
    where: { name: 'moderator' },
    update: {},
    create: {
      name: 'moderator',
      description: 'Moderator role for managing content',
    },
  });

  console.log('Moderator role created/updated:', moderatorRole);

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

  await importRegistrations(userRole.id);

  // Create admin user (optional - you can modify email/password)
  const hashedPassword = await bcrypt.hash('FundedEnergy12@', 10);
  
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

  console.log(' Admin user created/updated:', adminUser);

  // Create event management permissions here
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
    console.log(' Permission created/updated:', permission);
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
