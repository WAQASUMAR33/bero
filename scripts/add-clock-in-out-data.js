/**
 * Script to add test clock in/out records directly using Prisma
 * Run with: node scripts/add-clock-in-out-data.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to get dates
function getDateString(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addHours(date, hours) {
  const newDate = new Date(date);
  newDate.setHours(date.getHours() + hours);
  return newDate;
}

async function main() {
  console.log('🚀 Starting clock in/out test data creation...\n');

  try {
    // Get users
    console.log('Step 1: Fetching users...');
    const users = await prisma.user.findMany({
      where: { status: 'CURRENT' },
      take: 5, // Get first 5 active users
    });

    if (users.length === 0) {
      console.error('❌ No active users found. Cannot create clock in/out records.');
      return;
    }
    console.log(`✅ Found ${users.length} users\n`);

    // Get service seekers
    console.log('Step 2: Fetching service seekers...');
    const serviceSeekers = await prisma.serviceSeeker.findMany({
      take: 3,
    });
    console.log(`✅ Found ${serviceSeekers.length} service seekers\n`);

    // Get shift assignments
    console.log('Step 3: Fetching shift assignments...');
    const shiftAssignments = await prisma.shiftAssignment.findMany({
      include: {
        shift: {
          include: {
            serviceSeeker: true,
          },
        },
      },
      take: 10,
    });
    console.log(`✅ Found ${shiftAssignments.length} shift assignments\n`);

    // Create clock in/out records for the last 7 days
    console.log('Step 4: Creating clock in/out records...\n');

    const createdRecords = [];

    for (let day = 0; day < 7; day++) {
      const date = getDateString(day);
      const user = users[day % users.length];
      const serviceSeeker = serviceSeekers.length > 0 
        ? serviceSeekers[day % serviceSeekers.length] 
        : null;

      // Find a shift assignment for this user if available
      const assignment = shiftAssignments.find(
        a => a.userId === user.id && 
        new Date(a.date).toDateString() === date.toDateString()
      );

      // Determine work type (every 3rd day is standby)
      const workType = day % 3 === 0 ? 'STANDBY' : 'REGULAR';

      // Clock in time (9 AM + some variation)
      const clockInTime = new Date(date);
      clockInTime.setHours(9 + (day % 3), day % 2 === 0 ? 0 : 15, 0, 0);

      // Check if late (after 9:15 AM)
      const isLate = clockInTime.getHours() > 9 || 
                    (clockInTime.getHours() === 9 && clockInTime.getMinutes() > 15);

      // Clock out time (5 PM + some variation, only for past days)
      let clockOutTime = null;
      let isEarly = false;

      if (day > 0) {
        // For past days, add clock out
        clockOutTime = new Date(date);
        clockOutTime.setHours(17 - (day % 2), day % 2 === 0 ? 0 : 30, 0, 0);

        // Check if early (before 4:45 PM)
        isEarly = clockOutTime.getHours() < 17 || 
                  (clockOutTime.getHours() === 17 && clockOutTime.getMinutes() < 45);
      }

      try {
        const clockInOut = await prisma.clockInOut.create({
          data: {
            userId: user.id,
            shiftAssignmentId: assignment ? assignment.id : null,
            serviceSeekerId: serviceSeeker ? serviceSeeker.id : null,
            date: date,
            clockInTime: clockInTime,
            clockOutTime: clockOutTime,
            workType: workType,
            isLate: isLate,
            isEarly: isEarly,
            clockInLocation: '51.5074,-0.1278',
            clockOutLocation: clockOutTime ? '51.5074,-0.1278' : null,
            notes: `Test data created for ${date.toLocaleDateString()}`,
          },
        });

        createdRecords.push(clockInOut);
        console.log(`✅ Created record for ${user.firstName} ${user.lastName} on ${date.toLocaleDateString()} ${isLate ? '(Late)' : ''} ${isEarly ? '(Early)' : ''}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Record already exists for ${user.firstName} ${user.lastName} on ${date.toLocaleDateString()}`);
        } else {
          console.error(`❌ Error creating record:`, error.message);
        }
      }
    }

    console.log(`\n✅ Created ${createdRecords.length} clock in/out records`);
    console.log('\n🎉 Test data creation complete!');

    // Show summary
    const summary = await prisma.clockInOut.groupBy({
      by: ['workType'],
      _count: true,
    });

    console.log('\n📊 Summary:');
    summary.forEach(item => {
      console.log(`   ${item.workType}: ${item._count} records`);
    });

    const lateCount = await prisma.clockInOut.count({
      where: { isLate: true },
    });

    const earlyCount = await prisma.clockInOut.count({
      where: { isEarly: true },
    });

    console.log(`   Late clock ins: ${lateCount}`);
    console.log(`   Early clock outs: ${earlyCount}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

