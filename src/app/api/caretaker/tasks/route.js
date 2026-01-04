'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { generateEncouragementTasksFromSchedules } from '@/lib/generateEncouragementTasks';
import { generateStoolTasksFromSchedules } from '@/lib/generateStoolTasks';

// GET /api/caretaker/tasks
// Get all tasks for service users assigned to the logged-in caretaker
// For care workers/support workers: Only shows tasks for service users they have shift assignments for
// For admins/managers: Can see all tasks (or filter by serviceSeekerId if provided)
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user role to check if care worker
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userRoleName = currentUser.role?.name;
    const isCareWorker = userRoleName === 'CAREWORKER' || userRoleName === 'SUPPORT_WORKER';

    const { searchParams } = new URL(request.url);
    
    const dateParam = searchParams.get('date'); // Optional: YYYY-MM-DD format
    const serviceSeekerIdParam = searchParams.get('serviceSeekerId'); // Optional: For admins/managers
    
    const date = dateParam ? new Date(dateParam) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    let serviceSeekerIds = [];

    // For care workers/support workers: Only show tasks for service users they have shift assignments for
    if (isCareWorker) {
      // Get shift assignments for this user on this date to find assigned service users
      const assignments = await prisma.shiftAssignment.findMany({
        where: {
          userId: decoded.userId,
          date: date,
          status: 'SCHEDULED'
        },
        include: {
          shift: {
            select: {
              serviceSeekerId: true
            }
          }
        }
      });

      // Extract unique service seeker IDs from shift assignments
      serviceSeekerIds = [...new Set(assignments.map(a => a.shift.serviceSeekerId))];

      if (serviceSeekerIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            tasks: {},
            serviceUsers: [],
            date: date.toISOString().split('T')[0],
            message: 'No shift assignments found for this date. You will only see tasks for service users you are assigned to.'
          }
        });
      }
    } else {
      // For admins/managers: Allow filtering by serviceSeekerId if provided, otherwise show all
      if (serviceSeekerIdParam) {
        serviceSeekerIds = [parseInt(serviceSeekerIdParam)];
      } else {
        // If no serviceSeekerId provided, we'll fetch all tasks (no filtering by serviceSeekerId)
        // This means serviceSeekerIds will be empty array, and we'll need to handle that in the queries
        serviceSeekerIds = [];
      }
    }

    // Build where clause for task queries
    const taskWhereClause = {
      date: { gte: date, lt: nextDay }
    };
    
    // Only filter by serviceSeekerId if we have IDs (for care workers or when admin filters)
    if (serviceSeekerIds.length > 0) {
      taskWhereClause.serviceSeekerId = { in: serviceSeekerIds };
    }

    // Build where clause for medicine PRN tasks (uses applyDate instead of date)
    const medicinePrnWhereClause = {
      applyDate: { gte: date, lt: nextDay }
    };
    if (serviceSeekerIds.length > 0) {
      medicinePrnWhereClause.serviceSeekerId = { in: serviceSeekerIds };
    }

    // Generate encouragement tasks from schedules for this date (if we have service seeker IDs)
    if (serviceSeekerIds.length > 0) {
      await Promise.all([
        generateEncouragementTasksFromSchedules(serviceSeekerIds, date, decoded.userId),
        generateStoolTasksFromSchedules(serviceSeekerIds, date, decoded.userId),
      ]);
    }

    // Fetch all tasks for these service users on this date
    const [
      bathingTasks,
      behaviourTasks,
      bloodPressureTasks,
      bloodTestTasks,
      comfortCheckTasks,
      communicationNotesTasks,
      encouragementTasks,
      familyPhotoMessageTasks,
      followUpTasks,
      foodDrinkTasks,
      generalSupportTasks,
      houseKeepingTasks,
      incidentFallTasks,
      medicinePrnTasks,
      muacTasks,
      observationTasks,
      oneToOneTasks,
      oralCareTasks,
      oxygenTasks,
      personCentredTasks,
      physicalInterventionTasks,
      pulseTasks,
      repositionTasks,
      spendingMoneyTasks,
      stoolTasks,
      temperatureTasks,
      visitTasks,
      weightTasks
    ] = await Promise.all([
      prisma.bathingTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.behaviourTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          trigger: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.bloodPressureTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.bloodTestTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.comfortCheckTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.communicationNotesTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.encouragementTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.familyPhotoMessageTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.followUpTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.foodDrinkTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.generalSupportTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          supportList: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.houseKeepingTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.incidentFallTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          incidentType: true,
          location: true,
          witnessedByStaff: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.medicinePrnTask.findMany({
        where: medicinePrnWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          signoffByStaff: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.muacTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.observationTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.oneToOneTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.oralCareTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.oxygenTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.personCentredTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          taskName: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.physicalInterventionTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.pulseTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.repositionTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.spendingMoneyTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stoolTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.temperatureTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.visitTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.weightTask.findMany({
        where: taskWhereClause,
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Get service user details
    // For care workers: Only get service users from their shift assignments
    // For admins: Get all service users if no filter, or specific one if filtered
    let serviceUsers = [];
    if (serviceSeekerIds.length > 0) {
      serviceUsers = await prisma.serviceSeeker.findMany({
        where: { id: { in: serviceSeekerIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          preferredName: true,
          photoUrl: true
        }
      });
    } else if (!isCareWorker) {
      // For admins/managers with no filter, get all service users (optional - can be removed if not needed)
      // For now, we'll return empty array if no serviceSeekerIds
      serviceUsers = [];
    }

    // Group tasks by type
    const tasks = {
      bathing: bathingTasks,
      behaviour: behaviourTasks,
      bloodPressure: bloodPressureTasks,
      bloodTest: bloodTestTasks,
      comfortCheck: comfortCheckTasks,
      communicationNotes: communicationNotesTasks,
      encouragement: encouragementTasks,
      familyPhotoMessage: familyPhotoMessageTasks,
      followUp: followUpTasks,
      foodDrink: foodDrinkTasks,
      generalSupport: generalSupportTasks,
      houseKeeping: houseKeepingTasks,
      incidentFall: incidentFallTasks,
      medicinePrn: medicinePrnTasks,
      muac: muacTasks,
      observation: observationTasks,
      oneToOne: oneToOneTasks,
      oralCare: oralCareTasks,
      oxygen: oxygenTasks,
      personCentred: personCentredTasks,
      physicalIntervention: physicalInterventionTasks,
      pulse: pulseTasks,
      reposition: repositionTasks,
      spendingMoney: spendingMoneyTasks,
      stool: stoolTasks,
      temperature: temperatureTasks,
      visit: visitTasks,
      weight: weightTasks
    };

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        serviceUsers,
        date: date.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('GET /caretaker/tasks error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch tasks', 
      details: error.message 
    }, { status: 500 });
  }
}

