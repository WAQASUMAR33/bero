const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { id: 4 },
            include: { role: true }
        });
        console.log('User 4 Role:', user?.role?.name || 'No Role');
        console.log('Is valid target?',
            ['ADMIN', 'DIRECTOR', 'HR', 'REGISTER_MANAGER'].includes(user?.role?.name) ? 'YES ✅' : 'NO ❌');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
