import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper function to verify JWT token
function verifyToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET single medicine PRN task
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const task = await prisma.medicinePrnTask.findUnique({
      where: { id },
      include: {
        serviceSeeker: true,
        signoffByStaff: {
          select: { id: true, firstName: true, lastName: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Medicine PRN task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /medicine-prn-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medicine PRN task' },
      { status: 500 }
    );
  }
}

// PUT - Update medicine PRN task
export async function PUT(request, { params }) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      serviceSeekerId,
      applyDate,
      applyTime,
      prn,
      medicineName,
      medicineType,
      administrated,
      notes,
      requestSignoffBy,
      signoffByStaffId,
      completed,
      emotion
    } = body;

    const task = await prisma.medicinePrnTask.update({
      where: { id },
      data: {
        serviceSeekerId,
        applyDate: new Date(applyDate),
        applyTime,
        prn,
        medicineName,
        medicineType,
        administrated,
        notes: notes || null,
        requestSignoffBy,
        signoffByStaffId: requestSignoffBy === 'REQUIRED' ? signoffByStaffId : null,
        completed,
        emotion,
        updatedById: user.userId
      },
      include: {
        serviceSeeker: true,
        signoffByStaff: {
          select: { id: true, firstName: true, lastName: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('PUT /medicine-prn-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update medicine PRN task' },
      { status: 500 }
    );
  }
}

// DELETE medicine PRN task
export async function DELETE(request, { params }) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.medicinePrnTask.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Medicine PRN task deleted successfully' });
  } catch (error) {
    console.error('DELETE /medicine-prn-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete medicine PRN task' },
      { status: 500 }
    );
  }
}

