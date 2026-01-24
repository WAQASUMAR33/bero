const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking active clock-ins (clockOutTime: null)...");
    try {
        const active = await prisma.clockInOut.findMany({
            where: {
                clockOutTime: null
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            }
        });

        console.log(`Found ${active.length} active clock-ins.`);
        console.log(JSON.stringify(active, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
