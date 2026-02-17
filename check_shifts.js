const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkShifts() {
    try {
        // 1. Find User
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { firstName: { contains: 'Waqas' } },
                    { lastName: { contains: 'Umar' } }
                ]
            }
        });

        console.log('--- Matches for "Waqas Umar" ---');
        if (users.length === 0) {
            console.log('No user found.');
            return;
        }

        // Log user details
        users.forEach(u => console.log(`ID: ${u.id}, Name: ${u.firstName} ${u.lastName}, RoleId: ${u.roleId}`));
        const userId = users[0].id; // using first match

        // 2. Check Assignments for Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        console.log(`\n--- Checking Assignments for User ID: ${userId} ---`);
        console.log(`Date Range: ${today.toISOString()} to ${tomorrow.toISOString()}`);

        const assignments = await prisma.shiftAssignment.findMany({
            where: {
                userId: userId,
                date: {
                    gte: today,
                    lt: tomorrow
                }
            },
            include: {
                shift: true
            }
        });

        if (assignments.length === 0) {
            console.log('No shift assignments found for today.');
        } else {
            console.log(`Found ${assignments.length} assignment(s):`);
            assignments.forEach(a => {
                console.log(`\nAssignment ID: ${a.id}`);
                console.log(`Date: ${a.date}`);
                console.log(`Shift ID: ${a.shiftId}`);
                console.log(`Shift Time: ${a.shift.startTime} - ${a.shift.endTime}`);
                console.log(`Status: ${a.status}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkShifts();
