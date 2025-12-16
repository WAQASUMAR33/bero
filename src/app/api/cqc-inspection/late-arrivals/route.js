'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/cqc-inspection/late-arrivals
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ 
        success: false, 
        error: 'startDate and endDate are required' 
      }, { status: 400 });
    }

    // Get all late clock-in records in the date range
    const lateClockIns = await prisma.clockInOut.findMany({
      where: {
        isLate: true,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true
          }
        },
        serviceSeeker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            preferredName: true
          }
        },
        shiftAssignment: {
          include: {
            shift: {
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
            }
          }
        }
      }
    });

    // Get all unique care workers
    const careWorkersMap = new Map();
    const serviceUsersMap = new Map();

    // Process late clock-ins to build matrix
    lateClockIns.forEach(record => {
      const userId = record.userId;
      const userName = `${record.user.firstName} ${record.user.lastName}`;
      
      // Get service user - prefer direct serviceSeeker, fallback to shift's serviceSeeker
      let serviceUser = record.serviceSeeker;
      if (!serviceUser && record.shiftAssignment?.shift?.serviceSeeker) {
        serviceUser = record.shiftAssignment.shift.serviceSeeker;
      }

      if (!serviceUser) return; // Skip if no service user

      const serviceUserId = serviceUser.id;
      const serviceUserName = serviceUser.preferredName || 
                              `${serviceUser.firstName} ${serviceUser.lastName}`;

      // Initialize care worker if not exists
      if (!careWorkersMap.has(userId)) {
        careWorkersMap.set(userId, {
          userId: userId,
          name: userName,
          employeeNumber: record.user.employeeNumber,
          serviceUsers: {}
        });
      }

      // Initialize service user if not exists
      if (!serviceUsersMap.has(serviceUserId)) {
        serviceUsersMap.set(serviceUserId, {
          id: serviceUserId,
          name: serviceUserName
        });
      }

      // Increment count for this care worker - service user combination
      const careWorker = careWorkersMap.get(userId);
      if (!careWorker.serviceUsers[serviceUserId]) {
        careWorker.serviceUsers[serviceUserId] = 0;
      }
      careWorker.serviceUsers[serviceUserId]++;
    });

    // Convert maps to arrays
    const careWorkers = Array.from(careWorkersMap.values());
    const serviceUsers = Array.from(serviceUsersMap.values());

    // Calculate totals for each care worker
    careWorkers.forEach(cw => {
      cw.total = Object.values(cw.serviceUsers).reduce((sum, count) => sum + count, 0);
    });

    // Calculate totals for each service user
    const serviceUserTotals = {};
    careWorkers.forEach(cw => {
      Object.entries(cw.serviceUsers).forEach(([serviceUserId, count]) => {
        if (!serviceUserTotals[serviceUserId]) {
          serviceUserTotals[serviceUserId] = 0;
        }
        serviceUserTotals[serviceUserId] += count;
      });
    });

    // Calculate grand total
    const grandTotal = careWorkers.reduce((sum, cw) => sum + (cw.total || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        careWorkers: careWorkers.sort((a, b) => (b.total || 0) - (a.total || 0)),
        serviceUsers: serviceUsers.sort((a, b) => a.name.localeCompare(b.name)),
        serviceUserTotals,
        grandTotal,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('GET /cqc-inspection/late-arrivals error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch late arrivals',
      details: error.message 
    }, { status: 500 });
  }
}

