import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const investigation = await prisma.investigationTracker.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!investigation) {
      return NextResponse.json({ success: false, error: 'Investigation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: investigation });
  } catch (error) {
    console.error('Error in GET /api/investigations/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch investigation', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const investigationId = parseInt(id, 10);
    const body = await request.json();

    const existing = await prisma.investigationTracker.findUnique({
      where: { id: investigationId }
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Investigation not found' }, { status: 404 });
    }

    const parseDate = (val) => {
      if (val === undefined) return undefined;
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    const updateData = {};
    if (body.dateOfIncident !== undefined) updateData.dateOfIncident = parseDate(body.dateOfIncident);
    if (body.dateInvestigationCommenced !== undefined) updateData.dateInvestigationCommenced = parseDate(body.dateInvestigationCommenced);
    if (body.personsInvolved !== undefined) updateData.personsInvolved = body.personsInvolved?.trim() || null;
    if (body.areaBeingInvestigated !== undefined) updateData.areaBeingInvestigated = body.areaBeingInvestigated?.trim() || existing.areaBeingInvestigated;
    if (body.briefOverview !== undefined) updateData.briefOverview = body.briefOverview?.trim() || null;
    if (body.actionsTaken !== undefined) updateData.actionsTaken = body.actionsTaken?.trim() || null;
    if (body.outcome !== undefined) updateData.outcome = body.outcome?.trim() || null;
    if (body.progress !== undefined) {
      updateData.progress = body.progress?.trim() || existing.progress;
      // Auto-set dateCompleted if transitioning to Completed and no date was passed
      if (body.progress === 'Completed' && !body.dateCompleted && !existing.dateCompleted) {
        updateData.dateCompleted = new Date();
      }
    }
    if (body.dateCompleted !== undefined) updateData.dateCompleted = parseDate(body.dateCompleted);
    if (body.lessonsLearnt !== undefined) updateData.lessonsLearnt = body.lessonsLearnt?.trim() || 'N/A';
    if (body.comments !== undefined) updateData.comments = body.comments?.trim() || null;

    const updated = await prisma.investigationTracker.update({
      where: { id: investigationId },
      data: updateData
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in PUT /api/investigations/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update investigation', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const investigationId = parseInt(id, 10);

    const existing = await prisma.investigationTracker.findUnique({
      where: { id: investigationId }
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Investigation not found' }, { status: 404 });
    }

    await prisma.investigationTracker.delete({
      where: { id: investigationId }
    });

    return NextResponse.json({ success: true, message: 'Investigation deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/investigations/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete investigation', details: error.message },
      { status: 500 }
    );
  }
}
