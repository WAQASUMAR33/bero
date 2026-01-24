'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request, { params }) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const { id } = await params;
        const seekerId = parseInt(id);

        // Fetch all critical care plan components in parallel server-side
        // This reduces the number of HTTP requests from the client (Care Worker App)
        // preventing connection limit issues and improving load time.

        // We try to use relation includes where possible, but for modularity some might be separate queries.
        // However, executing them here is much faster than 7 separate HTTP round-trips.

        const [
            seeker,
            admission,
            healthTags,
            contacts,
            riskAssessments,
            medicineSchedule,
            documents
        ] = await Promise.all([
            // 1. Basic Details
            prisma.serviceSeeker.findUnique({ where: { id: seekerId } }),

            // 2. Admission (Medical/Critical Info)
            prisma.serviceSeekerAdmission.findFirst({
                where: { serviceSeekerId: seekerId },
                orderBy: { startDate: 'desc' } // Get latest active admission
            }),

            // 3. Health Tags
            prisma.serviceSeekerHealthTag.findMany({
                where: { serviceSeekerId: seekerId },
                select: { id: true, tagName: true }
            }),

            // 4. Contacts
            prisma.serviceSeekerContact.findMany({
                where: { serviceSeekerId: seekerId },
                orderBy: { emergencyContact: 'desc' }
            }),

            // 5. Active Risk Assessments
            prisma.serviceSeekerRiskAssessment.findMany({
                where: { serviceSeekerId: seekerId },
                orderBy: { lastAssessed: 'desc' }
            }),

            // 6. Medicine Schedule (Simple view for summary)
            prisma.serviceSeekerMedicineSchedule.findMany({
                where: { serviceSeekerId: seekerId, status: 'ACTIVE' },
                orderBy: { medicineName: 'asc' }
            }),

            // 7. Documents (Recent ones)
            prisma.serviceSeekerDocument.findMany({
                where: { serviceSeekerId: seekerId },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
        ]);

        if (!seeker) {
            return NextResponse.json({ error: 'Service user not found' }, { status: 404 });
        }

        // Consolidated Response
        return NextResponse.json({
            success: true,
            data: {
                seeker,
                admission,
                healthTags,
                contacts,
                riskAssessments,
                medicineSchedule,
                documents
            }
        });

    } catch (error) {
        console.error('GET /service-seekers/[id]/care-plan-summary error:', error);
        return NextResponse.json({ error: 'Failed to fetch care plan summary' }, { status: 500 });
    }
}
