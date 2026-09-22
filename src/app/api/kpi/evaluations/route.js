import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const DEFAULT_KPI_AREAS = [
  'Occupancy',
  'Live Enquiries',
  'Safeguardings',
  'CQC Notifications',
  'RIDDOR Reports',
  'Accidents',
  'Incidents',
  'Near Misses',
  'Complaints',
  'Compliments',
  'P&L',
  'Sickness'
];

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const totalEvaluations = await prisma.kpiMonthlyEvaluation.count();
    
    // Seed initial data from sheets/KPI Analysis.xlsx (July 2026 & August 2026) if empty
    if (totalEvaluations === 0) {
      // 1. July 2026
      await prisma.kpiMonthlyEvaluation.create({
        data: {
          monthYear: 'July 2026',
          periodCode: '2026-07',
          evaluationDate: new Date('2026-07-31'),
          evaluatedBy: currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Registered Manager',
          evaluatorRole: 'Registered Manager',
          status: 'COMPLETED',
          overallRating: 'Good',
          summaryNotes: 'Monthly KPI analysis completed for July 2026. High occupancy maintained with active enquiry pipeline. Safeguarding review completed with local authority.',
          createdById: currentUser.id,
          items: {
            create: [
              {
                area: 'Occupancy',
                data: '94% (16/17 Beds)',
                numericValue: 94,
                rationalle: 'Consistent bed occupancy across the month. 1 bed reserved pending hospital discharge assessment.',
                actionsRequired: 'Maintain liaison with Care Coordinator for pending admission.',
                addedToActionPlan: false,
                sortOrder: 1
              },
              {
                area: 'Live Enquiries',
                data: '8 Active Referrals',
                numericValue: 8,
                rationalle: 'Strong referral volume from Local Authority and private enquiries via website.',
                actionsRequired: 'Follow up with social worker for Arthur Pendelton and Evelyn Wright assessments.',
                addedToActionPlan: true,
                actionPlanStatus: 'IN_PROGRESS',
                sortOrder: 2
              },
              {
                area: 'Safeguardings',
                data: '1 Low Risk Alert',
                numericValue: 1,
                rationalle: 'Unexplained minor bruise reported and investigated in accordance with policy. Resolved satisfactorily.',
                actionsRequired: 'Refresher training for transfer and hoist protocols during morning team handover.',
                addedToActionPlan: true,
                actionPlanStatus: 'IN_PROGRESS',
                sortOrder: 3
              },
              {
                area: 'CQC Notifications',
                data: '0 Submitted',
                numericValue: 0,
                rationalle: 'No reportable statutory incidents occurred during the month of July.',
                actionsRequired: 'Continue weekly governance audit of daily shift logs.',
                addedToActionPlan: false,
                sortOrder: 4
              },
              {
                area: 'RIDDOR Reports',
                data: '0 Reports',
                numericValue: 0,
                rationalle: 'Zero HSE reportable workplace injuries or occupational diseases recorded.',
                actionsRequired: 'Quarterly slips, trips and falls audit scheduled for next month.',
                addedToActionPlan: false,
                sortOrder: 5
              },
              {
                area: 'Accidents',
                data: '2 Minor Incidents',
                numericValue: 2,
                rationalle: 'Two minor unwitnessed slips in lounge area; both residents assessed by senior nurse with no fractures.',
                actionsRequired: 'Environmental risk assessment completed and anti-slip mats replaced in high-traffic zone.',
                addedToActionPlan: true,
                actionPlanStatus: 'RESOLVED',
                sortOrder: 6
              },
              {
                area: 'Incidents',
                data: '1 Incident Logged',
                numericValue: 1,
                rationalle: 'Minor medication delay due to delayed pharmacy delivery. No harm caused.',
                actionsRequired: 'Standard Operating Procedure updated with pharmacy for emergency 24hr backup supply.',
                addedToActionPlan: true,
                actionPlanStatus: 'RESOLVED',
                sortOrder: 7
              },
              {
                area: 'Near Misses',
                data: '3 Near Misses',
                numericValue: 3,
                rationalle: 'Good staff reporting culture; 3 potential trip hazards and wet floor notices identified proactively.',
                actionsRequired: 'Commend team at staff meeting for proactive near-miss reporting.',
                addedToActionPlan: false,
                sortOrder: 8
              },
              {
                area: 'Complaints',
                data: '1 Formal Complaint',
                numericValue: 1,
                rationalle: 'Family concerned over delayed evening tea service during weekend shift.',
                actionsRequired: 'Met with family member, adjusted weekend kitchen rota, and issued formal response letter.',
                addedToActionPlan: false,
                sortOrder: 9
              },
              {
                area: 'Compliments',
                data: '4 Compliments',
                numericValue: 4,
                rationalle: 'Written thank you letters received from relatives appreciating personalized palliative care support.',
                actionsRequired: 'Share compliments in staff newsletter and add to Carer of the Month nominations.',
                addedToActionPlan: false,
                sortOrder: 10
              },
              {
                area: 'P&L',
                data: '+£14,820 Net Surplus',
                numericValue: 14820,
                rationalle: 'Agency staffing expenditure decreased by 18% through direct permanent carer recruitment.',
                actionsRequired: 'Monitor overtime hours in August to avoid staff burnout.',
                addedToActionPlan: false,
                sortOrder: 11
              },
              {
                area: 'Sickness',
                data: '2.8% Absence Rate',
                numericValue: 2.8,
                rationalle: 'Well below industry threshold of 5%. 3 short-term sickness days recorded with return-to-work interviews held.',
                actionsRequired: 'Conduct routine occupational wellness check-ins for returning staff.',
                addedToActionPlan: false,
                sortOrder: 12
              }
            ]
          }
        }
      });

      // 2. August 2026
      await prisma.kpiMonthlyEvaluation.create({
        data: {
          monthYear: 'August 2026',
          periodCode: '2026-08',
          evaluationDate: new Date('2026-08-31'),
          evaluatedBy: currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Registered Manager',
          evaluatorRole: 'Registered Manager',
          status: 'COMPLETED',
          overallRating: 'Outstanding',
          summaryNotes: 'August 2026 review demonstrates excellent quality metrics across all CQC key lines of enquiry. Zero RIDDOR and CQC notifications, excellent compliments.',
          createdById: currentUser.id,
          items: {
            create: [
              {
                area: 'Occupancy',
                data: '97% (17/17 Beds Full)',
                numericValue: 97,
                rationalle: '100% operational capacity reached following new resident admission on 12th August.',
                actionsRequired: 'Maintain waiting list for future vacancies.',
                addedToActionPlan: false,
                sortOrder: 1
              },
              {
                area: 'Other', // In August 2026 sheet of the xlsx, Area 2 is titled "Other"
                data: '5 On-hold Referrals',
                numericValue: 5,
                rationalle: 'Active enquiries transitioned to waiting list status due to full capacity.',
                actionsRequired: 'Review staffing run models for potential expansion or increased respite capacity.',
                addedToActionPlan: true,
                actionPlanStatus: 'IN_PROGRESS',
                sortOrder: 2
              },
              {
                area: 'Safeguardings',
                data: '0 Safeguarding Alerts',
                numericValue: 0,
                rationalle: 'Zero safeguarding concerns or investigations initiated during August.',
                actionsRequired: 'Continue bi-weekly senior carer governance walkarounds.',
                addedToActionPlan: false,
                sortOrder: 3
              },
              {
                area: 'CQC Notifications',
                data: '0 Submitted',
                numericValue: 0,
                rationalle: 'Full compliance maintained with zero notifiable events under regulations 16 to 18.',
                actionsRequired: 'No action required.',
                addedToActionPlan: false,
                sortOrder: 4
              },
              {
                area: 'RIDDOR Reports',
                data: '0 Reports',
                numericValue: 0,
                rationalle: 'Zero HSE RIDDOR reportable incidents.',
                actionsRequired: 'Health and safety representative conducted routine visual inspection of fire doors and stairs.',
                addedToActionPlan: false,
                sortOrder: 5
              },
              {
                area: 'Accidents',
                data: '1 Fall (No Injury)',
                numericValue: 1,
                rationalle: 'Resident assisted safely to floor by carer during unsteadiness; no bruising or medical intervention needed.',
                actionsRequired: 'Sensor mat installed beside resident bed as requested by family and OT.',
                addedToActionPlan: true,
                actionPlanStatus: 'RESOLVED',
                sortOrder: 6
              },
              {
                area: 'Incidents',
                data: '0 Incidents',
                numericValue: 0,
                rationalle: 'No behavioral or clinical adverse incidents.',
                actionsRequired: 'Maintain positive behavior support reviews.',
                addedToActionPlan: false,
                sortOrder: 7
              },
              {
                area: 'Near Misses',
                data: '2 Near Misses',
                numericValue: 2,
                rationalle: 'Staff noted trailing cable in administrative office; immediately rerouted with protective trunking.',
                actionsRequired: 'Facility maintenance signed off completion.',
                addedToActionPlan: false,
                sortOrder: 8
              },
              {
                area: 'Complaints',
                data: '0 Complaints',
                numericValue: 0,
                rationalle: 'Zero formal or informal complaints received in August.',
                actionsRequired: 'Keep resident feedback survey open for autumn cycle.',
                addedToActionPlan: false,
                sortOrder: 9
              },
              {
                area: 'Compliments',
                data: '6 Compliments Received',
                numericValue: 6,
                rationalle: 'Exceptional feedback following summer garden party event from local authority commissioners and families.',
                actionsRequired: 'Display feedback on community board in main reception.',
                addedToActionPlan: false,
                sortOrder: 10
              },
              {
                area: 'P&L',
                data: '+£19,450 Net Surplus',
                numericValue: 19450,
                rationalle: 'Full occupancy and optimized shift run allocations yielded strong financial operating margin.',
                actionsRequired: 'Reinvest portion of surplus into sensory room equipment upgrades.',
                addedToActionPlan: true,
                actionPlanStatus: 'IN_PROGRESS',
                sortOrder: 11
              },
              {
                area: 'Sickness',
                data: '1.9% Absence Rate',
                numericValue: 1.9,
                rationalle: 'Staff attendance rate remains exceptionally strong across both day and night rotas.',
                actionsRequired: 'Ensure holiday entitlement is evenly scheduled ahead of winter period.',
                addedToActionPlan: false,
                sortOrder: 12
              }
            ]
          }
        }
      });
    }

    const evaluations = await prisma.kpiMonthlyEvaluation.findMany({
      include: {
        items: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { periodCode: 'desc' }
    });

    // Calculate aggregated statistics
    const stats = {
      totalEvaluations: evaluations.length,
      totalActionPlanItems: await prisma.kpiActionPlanItem.count(),
      openActionsCount: await prisma.kpiActionPlanItem.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      latestEvaluation: evaluations[0] || null
    };

    return NextResponse.json({
      success: true,
      evaluations,
      stats
    });
  } catch (error) {
    console.error('Error fetching KPI evaluations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { monthYear, periodCode, evaluatedBy, evaluatorRole, overallRating, summaryNotes, items } = body;

    if (!monthYear || !periodCode) {
      return NextResponse.json(
        { success: false, error: 'Month & Year (e.g. September 2026) and Period Code (e.g. 2026-09) are required.' },
        { status: 400 }
      );
    }

    // Check if evaluation for this period already exists
    const existing = await prisma.kpiMonthlyEvaluation.findUnique({
      where: { periodCode }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `An evaluation for period ${periodCode} (${monthYear}) already exists.` },
        { status: 409 }
      );
    }

    // Prepare items - default to the 12 standard areas if none provided
    const itemsData = (items && items.length > 0)
      ? items.map((item, idx) => ({
          area: item.area || 'Custom Area',
          data: item.data || '',
          numericValue: item.numericValue !== undefined && item.numericValue !== '' ? parseFloat(item.numericValue) : null,
          rationalle: item.rationalle || '',
          actionsRequired: item.actionsRequired || '',
          addedToActionPlan: Boolean(item.addedToActionPlan),
          actionPlanStatus: item.addedToActionPlan ? 'PENDING' : 'N/A',
          sortOrder: idx + 1
        }))
      : DEFAULT_KPI_AREAS.map((area, idx) => ({
          area,
          data: '',
          numericValue: null,
          rationalle: '',
          actionsRequired: '',
          addedToActionPlan: false,
          actionPlanStatus: 'N/A',
          sortOrder: idx + 1
        }));

    const newEvaluation = await prisma.kpiMonthlyEvaluation.create({
      data: {
        monthYear,
        periodCode,
        evaluationDate: new Date(),
        evaluatedBy: evaluatedBy || (currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Registered Manager'),
        evaluatorRole: evaluatorRole || 'Registered Manager',
        status: 'DRAFT',
        overallRating: overallRating || 'Good',
        summaryNotes: summaryNotes || '',
        createdById: currentUser.id,
        items: {
          create: itemsData
        }
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Monthly evaluation for ${monthYear} created successfully.`,
      evaluation: newEvaluation
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating KPI evaluation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
