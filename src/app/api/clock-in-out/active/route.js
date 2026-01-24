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
        console.log(`[API] Checking active clock-in for user ${userId}`);

        // Find ALL active clock-ins (active = clockOutTime is null)
        // We fetch all to handle cases where a user might have a stale "forgot to clock out" record
        // Updated to findMany to resolve "Ghost Record" bug (ID 13 vs 37)
        const activeClockIns = await prisma.clockInOut.findMany({
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

        console.log(`[API] Found ${activeClockIns.length} active clock-ins for user ${userId}`);

        if (activeClockIns.length === 0) {
            return NextResponse.json({
                success: true,
                data: null,
                searchedUserId: userId,
                message: "No active clock-in record found for this user."
            });
        }

        // Heuristics to pick the "real" active session:
        // 1. Prefer one with a serviceSeekerId (means they are working with a client)
        // 2. Otherwise pick the most recent one (index 0 due to sort)

        let activeClockIn = activeClockIns.find(c => c.serviceSeekerId || c.shiftAssignment?.shift?.serviceSeekerId);

        if (!activeClockIn) {
            activeClockIn = activeClockIns[0];
        }

        console.log(`[API] Selected active clock-in ID: ${activeClockIn.id}`);

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
