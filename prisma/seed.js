const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default system role definitions (cannot be edited or deleted)
  const adminRole = await prisma.roleDefinition.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      displayName: 'Admin',
      description: 'Full system access with all permissions',
      permissions: [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'service-seekers.create', 'service-seekers.read', 'service-seekers.update', 'service-seekers.delete',
        'tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete',
        'shifts.create', 'shifts.read', 'shifts.update', 'shifts.delete',
        'funders.create', 'funders.read', 'funders.update', 'funders.delete',
        'regions.create', 'regions.read', 'regions.update', 'regions.delete',
        'reports.read', 'settings.update', 'rota.manage'
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
      description: 'Front-line care staff with task and shift access',
      permissions: [
        'tasks.create', 'tasks.read', 'tasks.update',
        'shifts.read', 'rota.view',
        'service-seekers.read'
      ],
      isSystem: true
    }
  });

  const directorRole = await prisma.roleDefinition.upsert({
    where: { name: 'DIRECTOR' },
    update: {},
    create: {
      name: 'DIRECTOR',
      displayName: 'Director',
      description: 'Senior management with strategic oversight',
      permissions: [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'service-seekers.create', 'service-seekers.read', 'service-seekers.update', 'service-seekers.delete',
        'tasks.read', 'tasks.update',
        'shifts.create', 'shifts.read', 'shifts.update', 'shifts.delete',
        'funders.create', 'funders.read', 'funders.update', 'funders.delete',
        'regions.create', 'regions.read', 'regions.update', 'regions.delete',
        'reports.read', 'settings.update', 'rota.manage'
      ],
      isSystem: true
    }
  });

  const hrRole = await prisma.roleDefinition.upsert({
    where: { name: 'HR' },
    update: {},
    create: {
      name: 'HR',
      displayName: 'HR',
      description: 'Human Resources with staff management access',
      permissions: [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'shifts.read', 'rota.view',
        'reports.read'
      ],
      isSystem: true
    }
  });

  const registerManagerRole = await prisma.roleDefinition.upsert({
    where: { name: 'REGISTER_MANAGER' },
    update: {},
    create: {
      name: 'REGISTER_MANAGER',
      displayName: 'Register Manager',
      description: 'Registered manager with operational oversight',
      permissions: [
        'users.create', 'users.read', 'users.update',
        'service-seekers.create', 'service-seekers.read', 'service-seekers.update', 'service-seekers.delete',
        'tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete',
        'shifts.create', 'shifts.read', 'shifts.update', 'shifts.delete',
        'funders.read', 'funders.update',
        'regions.read', 'regions.update',
        'reports.read', 'rota.manage'
      ],
      isSystem: true
    }
  });

  const supportWorkerRole = await prisma.roleDefinition.upsert({
    where: { name: 'SUPPORT_WORKER' },
    update: {},
    create: {
      name: 'SUPPORT_WORKER',
      displayName: 'Support Worker',
      description: 'Support staff with limited access to tasks and shifts',
      permissions: [
        'tasks.read', 'tasks.update',
        'shifts.read', 'rota.view',
        'service-seekers.read'
      ],
      isSystem: true
    }
  });

  // Hash the password
  const hashedPassword = await bcrypt.hash('786@786', 12);

  // Delete existing admin user if exists
  await prisma.user.deleteMany({
    where: { email: 'admin@gmail.com' }
  });

  // Create minimal super admin user with only required fields
  const adminUser = await prisma.user.create({
    data: {
      firstName: 'Super',
      lastName: 'Admin',
      username: 'admin',
      phoneNo: '1234567890',
      email: 'admin@gmail.com',
      roleId: adminRole.id,
      password: hashedPassword,
      status: 'CURRENT'
      // No optional fields like regionId, employeeNumber, startDate, etc.
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
  console.log('👤 Minimal Admin user created:');
  console.log('   Email: admin@gmail.com');
  console.log('   Password: 786@786');
  console.log('   Role: Admin (full access)');
  console.log('   Details: Only required fields (no region, no optional data)');
  console.log('📊 Created:');
  console.log('   - 6 System role definitions (Admin, Care Worker, Director, HR, Register Manager, Support Worker)');
  console.log('   - 1 Minimal admin user');
  console.log('   - 5 Shift types');
  console.log('   - 1 Default funder');
  console.log('   - 1 Default service seeker');
  console.log('🔒 System roles are protected and cannot be edited or deleted');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
