'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper to get the service seeker from the user's active clock-in
async function getActiveServiceSeekerId(userId) {
    const activeClockIn = await prisma.clockInOut.findFirst({
        where: {
            userId: userId,
            clockOutTime: null // Still clocked in
        },
        orderBy: { clockInTime: 'desc' },
        select: { serviceSeekerId: true }
    });
    return activeClockIn?.serviceSeekerId || null;
}

// GET - Fetch visits for the currently clocked-in service user
export async function GET(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.userId || decoded.id;

        // Get the service seeker from active clock-in
        const serviceSeekerId = await getActiveServiceSeekerId(userId);
        if (!serviceSeekerId) {
            return NextResponse.json({
                success: false,
                error: 'You are not clocked in. Please clock in to view visits.',
                notClockedIn: true
            }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'upcoming'; // upcoming, history, all

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let whereClause = {
            serviceSeekerId: serviceSeekerId,
            entryType: { in: ['FAMILY_VISIT', 'PROFESSIONAL_VISIT'] }
        };

        if (status === 'upcoming') {
            whereClause.date = { gte: today };
            whereClause.completed = null;
        } else if (status === 'history') {
            whereClause.OR = [
                { date: { lt: today } },
                { completed: { not: null } }
            ];
        }
        // 'all' uses no additional filters

        const visits = await prisma.serviceSeekerCalendarEntry.findMany({
            where: whereClause,
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
            },
            orderBy: [{ date: 'asc' }, { time: 'asc' }]
        });

        // Get service seeker info for context
        const serviceSeeker = await prisma.serviceSeeker.findUnique({
            where: { id: serviceSeekerId },
            select: { id: true, firstName: true, lastName: true, preferredName: true }
        });

        return NextResponse.json({
            success: true,
            data: visits,
            serviceSeeker: serviceSeeker,
            serviceSeekerId: serviceSeekerId
        });

    } catch (error) {
        console.error('GET /api/mobile/visits error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch visits'
        }, { status: 500 });
    }
}

// POST - Report an unscheduled/unannounced visit
export async function POST(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.userId || decoded.id;

        // Get the service seeker from active clock-in
        const serviceSeekerId = await getActiveServiceSeekerId(userId);
        if (!serviceSeekerId) {
            return NextResponse.json({
                success: false,
                error: 'You are not clocked in. Please clock in to report visits.',
                notClockedIn: true
            }, { status: 403 });
        }

        const body = await request.json();
        const { name, visitType, role, relationship, purpose, summary, time, date } = body;

        // Map visitType to entryType
        let entryType = 'FAMILY_VISIT';
        if (visitType === 'PROFESSIONAL') {
            entryType = 'PROFESSIONAL_VISIT';
        }

        // Create the visit record
        const visit = await prisma.serviceSeekerCalendarEntry.create({
            data: {
                serviceSeekerId: serviceSeekerId,
                entryType: entryType,
                date: date ? new Date(date) : new Date(),
                time: time || new Date().toTimeString().slice(0, 5),
                announced: 'NO', // Unannounced since it was not scheduled
                name: name || '',
                relationship: visitType === 'FAMILY' ? relationship : null,
                role: visitType === 'PROFESSIONAL' ? role : null,
                purpose: purpose || '',
                summary: summary || '',
                completed: 'YES', // Immediately completed since we're reporting it
                createdById: userId,
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

        return NextResponse.json({
            success: true,
            message: 'Unscheduled visit reported successfully.',
            data: visit
        }, { status: 201 });

    } catch (error) {
        console.error('POST /api/mobile/visits error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to report visit',
            details: error.message
        }, { status: 500 });
    }
}
