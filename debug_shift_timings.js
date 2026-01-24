const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = 15; // Known from previous logs
    const date = new Date("2026-01-24");
    date.setHours(0, 0, 0, 0);

    console.log("Fetching shifts for date:", date.toISOString());

    const assignments = await prisma.shiftAssignment.findMany({
        where: {
            userId: userId,
            date: date,
            status: 'SCHEDULED'
        },
        include: {
            shift: true
        }
    });

    // Also get clockInOuts
    const clockInOuts = await prisma.clockInOut.findMany({
        where: {
            userId: userId,
            date: date
        }
    });

    console.log("\nAssignments:");
    assignments.forEach(a => {
        const s = a.shift;
        const [h, m] = s.endTime.split(':');
        const endD = new Date(date);
        endD.setHours(parseInt(h), parseInt(m), 0, 0);

        console.log(`- ID: ${a.id}, Shift: ${s.startTime}-${s.endTime}`);
        console.log(`  Expected End (Local calc): ${endD.toString()}`);
        console.log(`  Expected End (ISO): ${endD.toISOString()}`);

        const cio = clockInOuts.find(c => c.shiftAssignmentId === a.id);
        console.log(`  ClockInOut: ${cio ? (cio.clockInTime ? 'In ' + cio.clockInTime.toISOString() : 'No In') : 'None'}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
