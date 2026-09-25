import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isManager } from '@/lib/permissions';

// GET /api/wages/amendments
export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isUserManager = isManager(currentUser);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = {};
    if (!isUserManager) {
      where.userId = currentUser.id;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const requests = await prisma.wageAmendmentRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            rateOfPay: true,
            role: { select: { displayName: true } }
          }
        },
        reviewedBy: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching amendment requests:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/wages/amendments - Staff requests wage/timesheet amendment
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shiftDate, requestedHours, requestedAmount, reason } = body;

    if (!reason?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please provide a reason / explanation for the requested amendment.' },
        { status: 400 }
      );
    }

    const amendment = await prisma.wageAmendmentRequest.create({
      data: {
        userId: currentUser.id,
        shiftDate: shiftDate ? new Date(shiftDate) : null,
        requestedHours: requestedHours ? parseFloat(requestedHours) : null,
        requestedAmount: requestedAmount ? parseFloat(requestedAmount) : null,
        reason: reason.trim(),
        status: 'PENDING',
      },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      amendment,
      message: 'Amendment request submitted successfully. A manager will review your request.'
    });
  } catch (error) {
    console.error('Error submitting amendment request:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/wages/amendments - Manager reviews amendment request (Approve / Reject)
export async function PUT(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!isManager(currentUser)) {
      return NextResponse.json(
        { success: false, error: 'Permission denied: Only management can approve or reject wage amendments.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status, managerNotes } = body;

    if (!id || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid Request ID and status (APPROVED or REJECTED) required.' },
        { status: 400 }
      );
    }

    const existingRequest = await prisma.wageAmendmentRequest.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        user: true
      }
    });

    if (!existingRequest) {
      return NextResponse.json({ success: false, error: 'Amendment request not found.' }, { status: 404 });
    }

    // Update amendment request
    const updated = await prisma.wageAmendmentRequest.update({
      where: { id: existingRequest.id },
      data: {
        status,
        managerNotes: managerNotes || null,
        reviewedById: currentUser.id,
        reviewedAt: new Date(),
      }
    });

    // If APPROVED, auto-apply adjustment to WageManualEntry
    if (status === 'APPROVED') {
      const rate = parseFloat(existingRequest.user.rateOfPay) || 12.50;
      let calculatedAmount = existingRequest.requestedAmount || 0;
      if (!calculatedAmount && existingRequest.requestedHours) {
        calculatedAmount = existingRequest.requestedHours * rate;
      }

      await prisma.wageManualEntry.create({
        data: {
          userId: existingRequest.userId,
          date: existingRequest.shiftDate || new Date(),
          entryType: 'HOURS_ADJUSTMENT',
          hours: existingRequest.requestedHours || null,
          amount: Math.round(calculatedAmount * 100) / 100,
          description: `Approved Amendment Request: ${existingRequest.reason}${managerNotes ? ` (Manager Notes: ${managerNotes})` : ''}`,
          createdById: currentUser.id
        }
      });
    }

    return NextResponse.json({
      success: true,
      updated,
      message: `Amendment request has been ${status.toLowerCase()}.${status === 'APPROVED' ? ' Wage adjustment applied automatically.' : ''}`
    });

  } catch (error) {
    console.error('Error reviewing amendment request:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
