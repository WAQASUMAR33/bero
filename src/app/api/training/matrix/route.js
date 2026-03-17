'use server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/training/matrix - Returns the compliance matrix: staff × training types
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const today = new Date();
    const in30Days = new Date(today); in30Days.setDate(today.getDate() + 30);
    const in60Days = new Date(today); in60Days.setDate(today.getDate() + 60);
    const in90Days = new Date(today); in90Days.setDate(today.getDate() + 90);

    // Get all active staff
    const staff = await prisma.user.findMany({
      where: { status: 'CURRENT' },
      select: { id: true, firstName: true, lastName: true, employeeNumber: true, role: { select: { name: true, displayName: true } } },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
    });

    // Get all active training types
    const trainingTypes = await prisma.trainingType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    // Get all training records for current staff
    const records = await prisma.staffTrainingRecord.findMany({
      where: { userId: { in: staff.map(s => s.id) } },
      include: { trainingType: true },
      orderBy: { completedDate: 'desc' }
    });

    // Build matrix: for each staff, get their latest record per training type
    const matrix = staff.map(member => {
      const memberRecords = {};

      trainingTypes.forEach(tt => {
        const latestRecord = records
          .filter(r => r.userId === member.id && r.trainingTypeId === tt.id)
          .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate))[0];

        if (!latestRecord) {
          memberRecords[tt.id] = { status: 'MISSING', record: null };
        } else if (!latestRecord.expiryDate) {
          memberRecords[tt.id] = { status: 'VALID', record: latestRecord };
        } else {
          const expiry = new Date(latestRecord.expiryDate);
          if (expiry < today) {
            memberRecords[tt.id] = { status: 'EXPIRED', record: latestRecord };
          } else if (expiry <= in30Days) {
            memberRecords[tt.id] = { status: 'EXPIRING_30', record: latestRecord };
          } else if (expiry <= in60Days) {
            memberRecords[tt.id] = { status: 'EXPIRING_60', record: latestRecord };
          } else if (expiry <= in90Days) {
            memberRecords[tt.id] = { status: 'EXPIRING_90', record: latestRecord };
          } else {
            memberRecords[tt.id] = { status: 'VALID', record: latestRecord };
          }
        }
      });

      return { ...member, trainingStatus: memberRecords };
    });

    // Summary counts
    const summary = {
      totalStaff: staff.length,
      totalTrainingTypes: trainingTypes.length,
      expired: 0,
      expiring30: 0,
      expiring60: 0,
      missing: 0
    };

    matrix.forEach(member => {
      Object.values(member.trainingStatus).forEach(s => {
        if (s.status === 'EXPIRED') summary.expired++;
        else if (s.status === 'EXPIRING_30') summary.expiring30++;
        else if (s.status === 'EXPIRING_60') summary.expiring60++;
        else if (s.status === 'MISSING') summary.missing++;
      });
    });

    return NextResponse.json({ success: true, data: { staff: matrix, trainingTypes, summary } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
