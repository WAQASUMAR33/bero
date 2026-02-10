const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    try {
        // Find all subscriptions grouped by user
        const subs = await prisma.pushSubscription.findMany({
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' }
        });

        console.log('Total active subscriptions:', subs.length);

        // Group by userId
        const byUser = {};
        subs.forEach(s => {
            if (!byUser[s.userId]) byUser[s.userId] = [];
            byUser[s.userId].push(s);
        });

        let deactivated = 0;
        for (const [userId, userSubs] of Object.entries(byUser)) {
            if (userSubs.length > 1) {
                console.log(`User ${userId}: ${userSubs.length} subscriptions`);
                // Keep only the newest one, deactivate the rest
                const toDeactivate = userSubs.slice(1).map(s => s.id);
                await prisma.pushSubscription.updateMany({
                    where: { id: { in: toDeactivate } },
                    data: { isActive: false }
                });
                console.log(`  Deactivated ${toDeactivate.length} old subscriptions`);
                deactivated += toDeactivate.length;
            }
        }

        console.log(`Done! Deactivated ${deactivated} duplicate subscriptions.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
