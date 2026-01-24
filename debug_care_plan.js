const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const seekerId = 29; // Known from debug logs
    console.log(`Fetching Care Plan Summary for Seeker ID: ${seekerId}`);

    try {
        // Mocking the logic from route.js
        const [
            seeker,
            diagnoses,
            allocation,
            allergies,
            riskAssessments,
            medicineSchedule,
            documents
        ] = await Promise.all([
            // 1. Basic Info
            prisma.serviceSeeker.findUnique({
                where: { id: seekerId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    dateOfBirth: true,
                    dnar: true,
                    photoUrl: true,
                    roomNumber: true, // Check if this exists
                    admission: {
                        select: {
                            startDate: true,
                            medicalHistory: true, // Often stores diagnosis summaries
                            carePlanUrl: true,    // Check if valid
                            advancedCarePlanUrl: true
                        }
                    }
                }
            }),

            // 2. Health Tags / Diagnoses
            prisma.serviceSeekerHealthTag.findMany({
                where: { serviceSeekerId: seekerId },
                select: { tagName: true }
            }),

            // 3. Allocation (Key Worker)
            // prisma.serviceSeekerAllocation.findFirst({ ... }) // Does this exist? Let's check schema
            // Skipping allocation for now as I don't recall seeing it in schema
            Promise.resolve(null),

            // 4. Allergies - Check Admission first
            // Already fetched in 1? No, separate relation?
            // checking Admission model again...
            // admission.medicineAllergies, admission.foodAllergies
            Promise.resolve([]),

            // 5. Active Risk Assessments
            prisma.serviceSeekerRiskAssessment.findMany({
                where: { serviceSeekerId: seekerId },
                orderBy: { lastAssessed: 'desc' }
            }),

            // 6. Medicine Schedule
            prisma.serviceSeekerMedicineSchedule.findMany({
                where: { serviceSeekerId: seekerId, status: 'ACTIVE' },
                orderBy: { medicineName: 'asc' }
            }),

            // 7. Documents
            prisma.serviceSeekerDocument.findMany({
                where: { serviceSeekerId: seekerId },
                orderBy: { createdAt: 'desc' },
                take: 5
            })
        ]);

        console.log("Seeker:", seeker ? "Found" : "Not Found");
        console.log("Risk Assessments:", riskAssessments.length);
        console.log("Meds:", medicineSchedule.length);

    } catch (e) {
        console.error("Error fetching care plan:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
