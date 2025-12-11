'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/caretaker/tasks
// Get all tasks for service users assigned to the logged-in caretaker
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { searchParams } = new URL(request.url);
    
    const dateParam = searchParams.get('date'); // Optional: YYYY-MM-DD format
    const date = dateParam ? new Date(dateParam) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

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

    // Extract unique service seeker IDs
    const serviceSeekerIds = [...new Set(assignments.map(a => a.shift.serviceSeekerId))];

    if (serviceSeekerIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          tasks: {},
          serviceUsers: [],
          date: date.toISOString().split('T')[0]
        }
      });
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
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.behaviourTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          trigger: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.bloodPressureTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.bloodTestTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.comfortCheckTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.communicationNotesTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.encouragementTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.familyPhotoMessageTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.followUpTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.foodDrinkTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.generalSupportTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          supportList: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.houseKeepingTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.incidentFallTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
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
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          applyDate: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          signoffByStaff: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.muacTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.observationTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.oneToOneTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.oralCareTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.oxygenTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.personCentredTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          taskName: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.physicalInterventionTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.pulseTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.repositionTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.spendingMoneyTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stoolTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.temperatureTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.visitTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.weightTask.findMany({
        where: {
          serviceSeekerId: { in: serviceSeekerIds },
          date: { gte: date, lt: nextDay }
        },
        include: {
          serviceSeeker: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Get service user details
    const serviceUsers = await prisma.serviceSeeker.findMany({
      where: { id: { in: serviceSeekerIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        preferredName: true,
        photoUrl: true
      }
    });

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

