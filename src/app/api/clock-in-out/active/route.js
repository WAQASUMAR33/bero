'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/clock-in-out/active
// Get the currently active clock-in for the user (if any)
export async function GET(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.userId;

        // Find the most recent clock-in that hasn't been clocked out
        const activeClockIn = await prisma.clockInOut.findFirst({
            where: {
                userId: userId,
                clockOutTime: null
            },
            orderBy: {
                clockInTime: 'desc'
            },
            include: {
                shiftAssignment: {
                    include: {
                        shift: {
                            select: { serviceSeekerId: true }
                        }
                    }
                },
                serviceSeeker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if (!activeClockIn) {
            return NextResponse.json({ success: true, data: null });
        }

        // Determine Service Seeker ID
        // It could be directly on the clock-in (unscheduled) or via the shift assignment (scheduled)
        let serviceSeekerId = activeClockIn.serviceSeekerId;

        if (!serviceSeekerId && activeClockIn.shiftAssignment?.shift?.serviceSeekerId) {
            serviceSeekerId = activeClockIn.shiftAssignment.shift.serviceSeekerId;
        }

        return NextResponse.json({
            success: true,
            data: {
                ...activeClockIn,
                serviceSeekerId // valid id or null
            }
        });

    } catch (error) {
        console.error('GET /clock-in-out/active error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch active status'
        }, { status: 500 });
    }
}
