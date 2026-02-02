'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper to get the service seeker from the user's active clock-in
async function getActiveServiceSeekerId(userId) {
    const activeClockIn = await prisma.clockInOut.findFirst({
        where: {
            userId: userId,
            clockOutTime: null
        },
        orderBy: { clockInTime: 'desc' },
        select: { serviceSeekerId: true }
    });
    return activeClockIn?.serviceSeekerId || null;
}

// PATCH - Update visit status (mark as completed/missed)
export async function PATCH(request, { params }) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.userId || decoded.id;

        const resolvedParams = await params;
        const visitId = parseInt(resolvedParams.id, 10);
        if (Number.isNaN(visitId)) {
            return NextResponse.json({ success: false, error: 'Invalid visit ID' }, { status: 400 });
        }

        // Get active service seeker
        const serviceSeekerId = await getActiveServiceSeekerId(userId);
        if (!serviceSeekerId) {
            return NextResponse.json({
                success: false,
                error: 'You are not clocked in. Please clock in to update visits.',
                notClockedIn: true
            }, { status: 403 });
        }

        // Find the visit
        const visit = await prisma.serviceSeekerCalendarEntry.findUnique({
            where: { id: visitId }
        });

        if (!visit) {
            return NextResponse.json({ success: false, error: 'Visit not found' }, { status: 404 });
        }

        // Security check: Ensure visit belongs to the clocked-in service seeker
        if (visit.serviceSeekerId !== serviceSeekerId) {
            return NextResponse.json({
                success: false,
                error: 'You can only update visits for the service user you are clocked in with.'
            }, { status: 403 });
        }

        const body = await request.json();
        const { completed, summary, time } = body;

        // Update the visit
        const updatedVisit = await prisma.serviceSeekerCalendarEntry.update({
            where: { id: visitId },
            data: {
                completed: completed || visit.completed,
                summary: summary !== undefined ? summary : visit.summary,
                time: time || visit.time,
                updatedById: userId
            },
            include: {
                serviceSeeker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        preferredName: true
                    }
                }
            }
        });

        const statusMessage = completed === 'YES' ? 'completed' : 'missed';

        return NextResponse.json({
            success: true,
            message: `Visit marked as ${statusMessage}.`,
            data: updatedVisit
        });

    } catch (error) {
        console.error('PATCH /api/mobile/visits/[id] error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update visit',
            details: error.message
        }, { status: 500 });
    }
}

// GET - Get a single visit by ID
export async function GET(request, { params }) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.userId || decoded.id;

        const resolvedParams = await params;
        const visitId = parseInt(resolvedParams.id, 10);
        if (Number.isNaN(visitId)) {
            return NextResponse.json({ success: false, error: 'Invalid visit ID' }, { status: 400 });
        }

        // Get active service seeker
        const serviceSeekerId = await getActiveServiceSeekerId(userId);
        if (!serviceSeekerId) {
            return NextResponse.json({
                success: false,
                error: 'You are not clocked in.',
                notClockedIn: true
            }, { status: 403 });
        }

        const visit = await prisma.serviceSeekerCalendarEntry.findUnique({
            where: { id: visitId },
            include: {
                serviceSeeker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        preferredName: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if (!visit) {
            return NextResponse.json({ success: false, error: 'Visit not found' }, { status: 404 });
        }

        if (visit.serviceSeekerId !== serviceSeekerId) {
            return NextResponse.json({
                success: false,
                error: 'You can only view visits for the service user you are clocked in with.'
            }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            data: visit
        });

    } catch (error) {
        console.error('GET /api/mobile/visits/[id] error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch visit'
        }, { status: 500 });
    }
}
