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
    const evaluationId = parseInt(id, 10);
    if (isNaN(evaluationId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const evaluation = await prisma.kpiMonthlyEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        items: {
          include: {
            actionPlanItem: true
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!evaluation) {
      return NextResponse.json({ success: false, error: 'Evaluation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, evaluation });
  } catch (error) {
    console.error('Error fetching KPI evaluation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const evaluationId = parseInt(id, 10);
    if (isNaN(evaluationId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { evaluatedBy, evaluatorRole, status, overallRating, summaryNotes, evaluationDate, items } = body;

    // 1. Update evaluation record
    const updatedEvaluation = await prisma.kpiMonthlyEvaluation.update({
      where: { id: evaluationId },
      data: {
        evaluatedBy: evaluatedBy !== undefined ? evaluatedBy : undefined,
        evaluatorRole: evaluatorRole !== undefined ? evaluatorRole : undefined,
        status: status !== undefined ? status : undefined,
        overallRating: overallRating !== undefined ? overallRating : undefined,
        summaryNotes: summaryNotes !== undefined ? summaryNotes : undefined,
        evaluationDate: evaluationDate ? new Date(evaluationDate) : undefined,
      }
    });

    // 2. Update / Upsert items if provided
    if (Array.isArray(items)) {
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const isAddedToActionPlan = Boolean(item.addedToActionPlan);
        let linkedActionId = item.actionPlanId || null;

        // If item is marked as Added to Action Plan and has actionsRequired, ensure an action plan item exists
        if (isAddedToActionPlan && item.actionsRequired && item.actionsRequired.trim().length > 0) {
          if (!linkedActionId) {
            // Create corresponding Action Plan item
            const newAction = await prisma.kpiActionPlanItem.create({
              data: {
                title: `${item.area}: ${item.actionsRequired.slice(0, 60)}...`,
                area: item.area,
                sourceMonth: updatedEvaluation.monthYear,
                description: `Action identified during ${updatedEvaluation.monthYear} KPI evaluation. Collated Data: "${item.data || 'N/A'}". Rationale: "${item.rationalle || 'N/A'}"`,
                actionRequired: item.actionsRequired,
                assignedTo: evaluatedBy || 'Registered Manager',
                priority: 'HIGH',
                status: 'OPEN',
                createdById: currentUser.id
              }
            });
            linkedActionId = newAction.id;
          } else {
            // Update existing linked action
            await prisma.kpiActionPlanItem.update({
              where: { id: linkedActionId },
              data: {
                actionRequired: item.actionsRequired,
                sourceMonth: updatedEvaluation.monthYear
              }
            }).catch(() => {});
          }
        }

        if (item.id && !String(item.id).startsWith('temp-')) {
          // Update existing item
          await prisma.kpiEvaluationItem.update({
            where: { id: parseInt(item.id, 10) },
            data: {
              area: item.area,
              data: item.data !== undefined ? item.data : '',
              numericValue: item.numericValue !== undefined && item.numericValue !== '' ? parseFloat(item.numericValue) : null,
              rationalle: item.rationalle !== undefined ? item.rationalle : '',
              actionsRequired: item.actionsRequired !== undefined ? item.actionsRequired : '',
              addedToActionPlan: isAddedToActionPlan,
              actionPlanStatus: isAddedToActionPlan ? (item.actionPlanStatus || 'PENDING') : 'N/A',
              actionPlanId: linkedActionId,
              sortOrder: idx + 1
            }
          });
        } else {
          // Create new item in this evaluation
          await prisma.kpiEvaluationItem.create({
            data: {
              evaluationId,
              area: item.area || 'Custom Area',
              data: item.data || '',
              numericValue: item.numericValue !== undefined && item.numericValue !== '' ? parseFloat(item.numericValue) : null,
              rationalle: item.rationalle || '',
              actionsRequired: item.actionsRequired || '',
              addedToActionPlan: isAddedToActionPlan,
              actionPlanStatus: isAddedToActionPlan ? 'PENDING' : 'N/A',
              actionPlanId: linkedActionId,
              sortOrder: idx + 1
            }
          });
        }
      }
    }

    // Return complete updated evaluation with items
    const finalEvaluation = await prisma.kpiMonthlyEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        items: {
          include: { actionPlanItem: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Monthly evaluation updated successfully.',
      evaluation: finalEvaluation
    });
  } catch (error) {
    console.error('Error updating KPI evaluation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const evaluationId = parseInt(id, 10);
    if (isNaN(evaluationId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.kpiMonthlyEvaluation.delete({
      where: { id: evaluationId }
    });

    return NextResponse.json({
      success: true,
      message: 'Monthly evaluation removed successfully.'
    });
  } catch (error) {
    console.error('Error deleting KPI evaluation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
