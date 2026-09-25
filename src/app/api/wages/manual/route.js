import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isManager } from '@/lib/permissions';

// POST /api/wages/manual - Add manual wage entry (Managers/Admin only)
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!isManager(currentUser)) {
      return NextResponse.json(
        { success: false, error: 'Permission denied: Staff members cannot alter wage sheets. Only management can add manual entries.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, date, entryType, hours, amount, description } = body;

    if (!userId || !date || !entryType || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Staff member, date, entry type, and amount are required.' },
        { status: 400 }
      );
    }

    const entry = await prisma.wageManualEntry.create({
      data: {
        userId: parseInt(userId, 10),
        date: new Date(date),
        entryType, // "BONUS", "OVERTIME", "HOLIDAY_PAY", "MILEAGE", "EXPENSE", "DEDUCTION", "HOURS_ADJUSTMENT"
        hours: hours ? parseFloat(hours) : null,
        amount: parseFloat(amount) || 0,
        description: description || `${entryType} entry added by management`,
        createdById: currentUser.id
      }
    });

    return NextResponse.json({
      success: true,
      entry,
      message: 'Manual wage entry added successfully.'
    });

  } catch (error) {
    console.error('Error adding manual wage entry:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/wages/manual?id=...
export async function DELETE(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!isManager(currentUser)) {
      return NextResponse.json(
        { success: false, error: 'Permission denied: Only management can delete wage entries.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'), 10);
    if (!id) {
      return NextResponse.json({ success: false, error: 'Entry ID is required.' }, { status: 400 });
    }

    await prisma.wageManualEntry.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Wage adjustment removed successfully.' });
  } catch (error) {
    console.error('Error deleting manual wage entry:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
