import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

type RegistrationRow = Record<string, string>;

const INLINE_REGISTRATIONS: RegistrationRow[] = [
  ['Fatihu Ayomide Yahya', 'yahyafatihuay@gmail.com', 'Usmanu DanFodiyo University Teaching Hospital, Sokoto', '09061448672', 'Student', 'Usmanu DanFodiyo University, Sokoto', 'Medicine and Surgery'],
  ['BARKA STEPHEN', 'barkastephen70@gmail.com', 'Asokoro extension Abuja', '08033065955', 'Employed', '', ''],
  ['Almustapha Garba', 'almustaphag97@gmail.com', 'Kano road back of glo office', '0810 0087 757', 'Job seeker', 'Usman Danfodiyo University Sokoto', 'Computer Science'],
  ['Rejoice Godwin mamza', 'wadiamgodwinmamza@gmail.com', 'Gawon nama', '09064662499', 'Job seeker', '', ''],
  ['Amamatu Suleiman', 'amamatusulaiman@gmail.com', 'Arkilla,house no.22, behind polytechnic Sokoto', '07064717928', 'Job seeker', '', ''],
  ['George Ovye Eggahson', 'georgeovyeeggahson@gmail.com', 'Raymond Village, Danbuwa Sokoto State', '08106822426', 'Serving Corp Member', '', ''],
  ['Abubakar Abubakar Jabbi', 'abubakarjabbiabubakar@gmail.com', 'Wammako, Usmanu Danfodiyo University Sokoto permanent site', '09063252310', 'Student', 'Usman Danfodiyo University Sokoto', 'Agriculture'],
  ['Mubaraka Abdulrauf', 'mubarakaabdulrauf6@gmail.com', 'Nakasarin ardo sokoto', '07030504079', 'Student', 'Usmanu danfodio university sokoto', 'Nursing science'],
  ['Mujahid Labaran Aminu', 'aminumujahid22@gmail.com', 'Emir yahaya area sokoto', '09133460400', 'Student', 'Usmanu danfodiyo University sokoto', 'Biochemistry'],
  ['Aliyu salihu', 'aliyusalihuzamau@gmail.com', 'UDUTH staff quartets', '08104641684', 'Student', 'Usmanu Dan fodio university teaching hospitals sokoto', 'Nursing'],
  ['Victor Dan', 'danvictor.maiganga06@gmail.com', 'Sokoto state', '08032732659', 'Student', 'Usmanu Danfodiyo University, Sokoto state', 'Nursing science'],
  ['Abdulrahman Bello', 'belloabdulrahman233@gmail.com', '20, Goronyo Road Mabera Sokoto', '09013076262', 'Student', 'Udus', 'Mbbs'],
  ['Mohammedharis Alaaya', 'alaayaolamilekan@gmail.com', 'Prof L.S Bilbis Medical Hostel UDUTH', '08135776955', 'Student', 'Usmanu Danfodiyo University Sokoto', 'Medicine and Surgery'],
  ['Umar Kudu Nagya', 'umarkudunagya@gmail.com', 'Usmanu Danfodiyo University Teaching Hospital Sokoto', '08101630490', 'Student', 'Usmanu Danfodiyo University Sokoto', 'Nursing science'],
  ['Mustapha Bashir', 'bashirdeleayomide@gmail.com', 'Usmanu Danfodiyo University Teaching Hospital', '08102384088', 'Student', 'Usmanu Danfodiyo University, Sokoto.', 'Medicine and Surgery'],
  ['Abdullahi Ibn Ahmad', 'abdullahiibnahmad7@gmail.com', 'Students Hostel, Usmanu Danfodiyo University Sokoto', '08148755044', 'Student', 'Usmanu Danfodiyo University Sokoto', 'MBBS'],
  ['Oluwatoyin Ibrahim', 'oluwatoyinibrahim48@gmail.com', 'Usmanu Danfodiyo university teaching hospitals', '08062559762', 'Student', 'Usmanu Danfodiyo university Sokoto', 'Faculty of pharmaceutical sciences'],
  ['AbdulRaheem Olurode', 'abdraheemolu2020@gmail.com', 'UDUTH, Sokoto', '08169433895', 'Student', 'Usmanu Danfodiyo University Sokoto (UDUS)', 'Medicine and Surgery'],
  ['Muhammed Abdulsomad Ayomide', 'abdulsomadmashaallah@gmail.com', 'Arkilla Area, along Biga College,Sokoto.', '08103723571', 'Student', 'Usmanu Danfodiyo University, Sokoto.', 'Faculty of pharmaceutical science'],
  ['ABDULRAUF GARBA', 'garbaabdulrauf1219@gmail.com', 'UDUTH sokoto', '07064642665', 'Student', 'UDUS', 'Medicine and surgery'],
  ['Jibril Taiwo', 'taiwojibril9@gmail.com', 'Alu quarters sokoto', '08174311008', 'Student', 'Usmanu danfodiyo university sokoto', 'Medicine and surgery'],
  ['Joy Emmanuel', 'joy4emmanuel2025@gmail.com', 'Umaru Ali Shinkafi Polytechnic Admin Farfaru', '09029218928', 'Job seeker', '', ''],
  ['Ahmad Abba Aminu', 'ahmadsidiabba6@gmail.com', 'Alkanchi area', '08068684661', 'Student', 'Usman danfodiyo unversity sokoto', 'Nursing science'],
  ['Alakoye Qudus', 'alakoyequdus20@gmail.com', 'Uduth sokoto', '08024967475', 'Student', 'Usmanu danfodiyo university', 'Physiotherapy'],
  ['Abdulsalam Abdulhakeem', 'hakeembinraj@gmail.com', 'UDUS, SOKOTO STATE', '08106144004', 'Student', 'Usmanu Danfodiyo University sokoto', 'Agric-Economics'],
  ['Matteejoh Yunusa', 'matteejohyunusa@gmail.com', 'Behind school of nursing unguwar rogo', '07041884876', 'Student', 'Usman Dan fodio university', 'Nursing science'],
  ['Khalid Bello', 'khalidbellomafara@gmail.com', 'Prof Bilbis Hostel,UDUTH Sokoto', '8035176507', 'Student', 'Usmanu Danfodiyo University Sokoto', 'Medicine'],
  ['Shuaibu Garba Yusuf', 'shuaibuyusuf82598@gmail.com', 'Prof Bilbis hostel Uduth', '07030606675', 'Student', 'CHS UDUS', 'MBBS'],
  ['Bello Balikis', 'baleekay@gmail.com', 'Behind success school gidan bawallah', '08124243024', 'Student', 'Usmanu Danfodio University', 'Physiotherapy'],
  ['Raheema Suleiman', 'raheemaslmn@gmail.com', 'Bunza Road, Sokoto', '08063358397', 'Student', 'Usmanu Danfodiyo University Sokoto', 'Nursing'],
  ['Shalom Ganna', 'gannashalom@gmail.com', 'Sokoto', '07033506077', 'Employed', '', ''],
  ['Sebiotimo Abdullateef Ayomide', 'abdullateefsebiotimo@gmail.com', 'Bilbis Hostel, Usmanu Danfodiyo University, Sokoto', '08101589091', 'Student', 'Usmanu Danfodiyo University, Sokoto', 'Nursing Sciences'],
  ['Ismail Goshi ABUBAKAR', 'aigoshi1082@gmail.com', 'City campus', '07064584031', 'Student', 'Usmanu Danfodiyo University', 'Medicine and surgery'],
  ['Aliyu Abfulrasheed', 'abdulrasheedaliyu34@gmail.com', 'Dambuwa, Sokoto', '080', 'Student', 'Usmanu Danfodiyo University Sokoto', 'Agronomy'],
  ['Racheal Ibiyemi', 'ibiyemiracheal137@gmail.com', 'Minna, niger state.', '09065114865', 'Employed', 'niger state Polytechnic', 'Business administration and management'],
  ['Jubilee Ayuba jauni', 'jubileeayuba@gmail.com', 'GOC Corpers lodge,8 division giginya barracks, sokoto', '07013455022', 'Corp member', '', ''],
  ['Hafiz Sani Galadima', 'galadeemajr@gmail.com', 'Sokoto', '08081296843', 'Student', 'Usmanu Danfodiyo University Sokoto', 'Nursing Science'],
  ['Musa Umar', 'musaumarap01@gmail.com', 'Udus', '08140298086', 'Student', 'Usmanu Danfodiyo University Sokoto', 'Agriculture'],
  ['Abdulrahman Abubakar Umar', 'aaumaryaboo@gmail.com', 'Hahayya Abdulkarim Road', '08140762392', 'Job seeker', '', ''],
  ['Abdullahi usman', 'usmanabdullahi61mrr@gmail.com', 'Gusau zamfara state', '08130144961', 'Student', 'Federal university Gusau', 'Nursing science'],
  ['Abdulkarim Ogaji', 'abdulkarimogaji001@gmail.com', 'Sokoto, Nigeria', '', 'Student', 'Usmanu Danfodio University', 'Medicine and Surgery'],
  ['Halimatu Ibrahim Maccido', 'halymahmaccido@gmail.com', 'Ali Akilu Road', '09138955251', 'Student', 'Usmanu Dandodiyo University Sokoto', 'Medical Laboratory Science'],
  ['Muhammad Tukur Boko', 'mboko560@gmail.com', 'Nakasari eastern byepass sokoto', '08034327347', 'Employed', 'NA', 'NA'],
  ['Abdul-rahman Lauwali', 'abdulrrahmanlauwali44@gmail.com', 'Uduth sokoto', '08169607800', 'Student', 'Usmanu danfodiyo university sokoto', 'Medicine and surgery'],
  ['Faisal Usman Abubakar', 'faisallamido001@gmail.com', 'Gawon Nama', '09069505970', 'Student', 'Usmanu Danfodiyo University Sokoto', 'Pharmacy'],
  ['Hafsat Ibrahim', 'slmasalma994@gmail.com', 'Sokoto North ,sokoto state, Nigeria', '09022587484', 'Student', 'Mass communication', 'Masscom'],
  ['Imamu Abdussalam', 'imamuabdussalam1@gmail.com', 'Nigerian Army barracks sokoto, sokoto state', '09032506822', 'Student', 'Umaru Ali Shinkafi polytechnic', 'Mas communication'],
  ['Nabila Jibrin Usman', 'nabilausmanjibrin66@gmail.com', 'Badon hanya', '08061169366', 'Student', 'Usmanu Danfodio University,Sokoto', 'Nursing science department'],
  ['Ibrahim Gidado Ibrahim', 'ibrahimibrahim1942997@gmail.com', 'Mabera Area Sokoto state', '07038853661', 'Student', 'Usman Danfodiyo University sokoto', 'Medical laboratory SCIENCE'],
  ['Aminu Nasiru', 'aminunasiru893@gmail.com', 'Minannata Area, Sokoto', '09035444690', 'Business owner', '', ''],
].map(([Name, Email, Address, phone, occupation, school, department]) => ({
  Name,
  Email,
  Address,
  'Phone number': phone,
  'What best describes you?': occupation,
  'For Students: Name of School or Institution': school,
  'For Students: Department': department,
}));

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
  const csvAvailable = fs.existsSync(csvPath);
  if (!csvAvailable) {
    console.log(`Registration CSV not found at ${csvPath}; using 50 inline registrations.`);
  }

  const credentialsPath = path.resolve(process.cwd(), '.imported-user-credentials.csv');
  const registrations = csvAvailable ? readRegistrations(csvPath) : INLINE_REGISTRATIONS;
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
