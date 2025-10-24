const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default role definitions
  const adminRole = await prisma.roleDefinition.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      displayName: 'Administrator',
      description: 'Full system access',
      permissions: [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'service-seekers.create', 'service-seekers.read', 'service-seekers.update', 'service-seekers.delete',
        'tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete',
        'shifts.create', 'shifts.read', 'shifts.update', 'shifts.delete',
        'funders.create', 'funders.read', 'funders.update', 'funders.delete',
        'regions.create', 'regions.read', 'regions.update', 'regions.delete',
        'reports.read', 'settings.update'
      ],
      isSystem: true
    }
  });

  const careWorkerRole = await prisma.roleDefinition.upsert({
    where: { name: 'CAREWORKER' },
    update: {},
    create: {
      name: 'CAREWORKER',
      displayName: 'Care Worker',
      description: 'Care worker access',
      permissions: [
        'tasks.read', 'tasks.update',
        'shifts.read',
        'service-seekers.read'
      ],
      isSystem: true
    }
  });

  // Create default region
  const defaultRegion = await prisma.region.upsert({
    where: { code: 'DEFAULT' },
    update: {},
    create: {
      title: 'Default Region',
      code: 'DEFAULT'
    }
  });

  // Hash the password
  const hashedPassword = await bcrypt.hash('786@786', 12);

  // Create super admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      firstName: 'Super',
      lastName: 'Admin',
      username: 'admin',
      phoneNo: '1234567890',
      email: 'admin@gmail.com',
      roleId: adminRole.id,
      password: hashedPassword,
      isEmailVerified: true,
      profilePic: null,
      employeeNumber: 'ADMIN001',
      startDate: new Date(),
      regionId: defaultRegion.id,
      emergencyName: 'Emergency Contact',
      emergencyContact: '9876543210',
      postalCode: '12345',
      contractedHours: 40,
      status: 'CURRENT'
    }
  });

  // Create default shift types
  const shiftTypes = [
    {
      name: 'Live in care',
      careerPayRegular: 15.00,
      careerPayBankHoliday: 20.00,
      payCalculation: 'PER_HOUR'
    },
    {
      name: 'Shadow 10am - 6pm',
      careerPayRegular: 12.00,
      careerPayBankHoliday: 18.00,
      payCalculation: 'PER_HOUR'
    },
    {
      name: 'SL 08:00 to 08:00 sleep',
      careerPayRegular: 200.00,
      careerPayBankHoliday: 250.00,
      payCalculation: 'PER_SHIFT'
    },
    {
      name: 'Day Shift',
      careerPayRegular: 14.00,
      careerPayBankHoliday: 19.00,
      payCalculation: 'PER_HOUR'
    },
    {
      name: 'Night Shift',
      careerPayRegular: 16.00,
      careerPayBankHoliday: 22.00,
      payCalculation: 'PER_HOUR'
    }
  ];

  for (const shiftType of shiftTypes) {
    await prisma.shiftType.upsert({
      where: { name: shiftType.name },
      update: {},
      create: shiftType
    });
  }

  // Create default funders
  const defaultFunder = await prisma.funder.create({
    data: {
      fundingSource: 'Local Authority',
      contractNumber: 'DEFAULT-001',
      serviceType: 'Care Services',
      costNotes: 'Default funder for the system',
      paymentType: 'PER_SHIFT'
    }
  });

  // Create default service seeker
  const defaultServiceSeeker = await prisma.serviceSeeker.create({
    data: {
      firstName: 'Default',
      lastName: 'Service Seeker',
      postalCode: '12345',
      address: '123 Default Street',
      latitude: 51.5074,
      longitude: -0.1278,
      dateOfBirth: new Date('1990-01-01'),
      gender: 'Other',
      dnar: false,
      sexuality: 'Other',
      status: 'LIVE',
      createdById: adminUser.id,
      updatedById: adminUser.id
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user created:');
  console.log('   Email: admin@gmail.com');
  console.log('   Password: 786@786');
  console.log('   Role: Super Admin');
  console.log('   Region: Default Region');
  console.log('📊 Created:');
  console.log('   - 2 Role definitions');
  console.log('   - 1 Default region');
  console.log('   - 1 Super admin user');
  console.log('   - 5 Shift types');
  console.log('   - 1 Default funder');
  console.log('   - 1 Default service seeker');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
