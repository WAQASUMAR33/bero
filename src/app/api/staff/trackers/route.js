import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isManager } from '@/lib/permissions';

// GET /api/staff/trackers
// Collated stats, due date flags, and summaries across all staff trackers
export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isManagerUser = isManager(currentUser);
    const userFilter = isManagerUser ? {} : { id: currentUser.id };
    const trackerUserFilter = isManagerUser ? {} : { userId: currentUser.id };

    const now = new Date();

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(now.getDate() + 60);

    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);

    // DBS 3-year and 2.5-year reference dates
    // Expired if dbsDate <= 3 years ago
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(now.getFullYear() - 3);

    // Expiring within 6 months if between 2.5 years ago and 3 years ago
    const twoAndHalfYearsAgo = new Date();
    twoAndHalfYearsAgo.setFullYear(now.getFullYear() - 2);
    twoAndHalfYearsAgo.setMonth(twoAndHalfYearsAgo.getMonth() - 6);

    // 1. Fetch Users with compliance details
    const users = await prisma.user.findMany({
      where: {
        ...userFilter,
        status: 'CURRENT'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeNumber: true,
        startDate: true,
        dbsDate: true,
        dbsUpdateCode: true,
        sponsorshipStatus: true,
        shareCode: true,
        visaExpiryDate: true,
        cosNumber: true,
        visaType: true,
        contractedHours: true,
        rateOfPay: true,
        salary: true,
        role: {
          select: { id: true, name: true, displayName: true }
        }
      }
    });

    // 2. Fetch Supervisions
    const supervisions = await prisma.staffSupervision.findMany({
      where: trackerUserFilter,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true, role: true }
        },
        supervisor: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { nextDueDate: 'asc' }
    });

    // 3. Fetch Appraisals
    const appraisals = await prisma.staffAppraisal.findMany({
      where: trackerUserFilter,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true, role: true }
        },
        appraiser: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // 4. Fetch Probations
    const probations = await prisma.staffProbation.findMany({
      where: trackerUserFilter,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true, role: true }
        },
        reviewer: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // 5. Fetch PDPs
    const pdps = await prisma.staffPdp.findMany({
      where: trackerUserFilter,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true, role: true }
        }
      },
      orderBy: { targetDate: 'asc' }
    });

    // Compute Summaries
    // Supervisions stats
    let supervisionsOverdue = 0;
    let supervisionsDueSoon = 0;
    let supervisionsUpToDate = 0;

    supervisions.forEach(s => {
      if (s.nextDueDate) {
        const d = new Date(s.nextDueDate);
        if (d < now) supervisionsOverdue++;
        else if (d <= thirtyDaysFromNow) supervisionsDueSoon++;
        else supervisionsUpToDate++;
      }
    });

    // Appraisals stats
    let appraisalsOverdue = 0;
    let appraisalsDueSoon = 0;
    let appraisalsUpToDate = 0;

    appraisals.forEach(a => {
      if (a.dueDate) {
        const d = new Date(a.dueDate);
        if (d < now) appraisalsOverdue++;
        else if (d <= sixtyDaysFromNow) appraisalsDueSoon++;
        else appraisalsUpToDate++;
      }
    });

    // Probations stats
    let probationsUnderWay = 0;
    let probationsDueSoon = 0;
    let probationsOverdue = 0;
    let probationsPassed = 0;

    probations.forEach(p => {
      if (p.status === 'PASSED') {
        probationsPassed++;
      } else if (p.status === 'FAILED') {
        // failed
      } else if (p.dueDate) {
        const d = new Date(p.dueDate);
        if (d < now) probationsOverdue++;
        else if (d <= thirtyDaysFromNow) probationsDueSoon++;
        else probationsUnderWay++;
      } else {
        probationsUnderWay++;
      }
    });

    // Sponsorship & Visa stats
    let sponsoredCount = 0;
    let visaExpiredCount = 0;
    let visaExpiringSoonCount = 0; // within 3 months
    let visaInDateCount = 0;

    // DBS stats
    let dbsExpiredCount = 0; // 3+ years
    let dbsExpiringSoonCount = 0; // within 6 months of 3 years
    let dbsInDateCount = 0;

    const nonSponsoredStatuses = ['British Citizen', 'Irish Citizen', 'Settled Status (ILR)', 'Permanent Resident'];

    users.forEach(u => {
      // Sponsorship
      const isSponsored = u.sponsorshipStatus && !nonSponsoredStatuses.includes(u.sponsorshipStatus);
      if (isSponsored || u.visaExpiryDate) {
        sponsoredCount++;
        if (u.visaExpiryDate) {
          const vDate = new Date(u.visaExpiryDate);
          if (vDate < now) visaExpiredCount++;
          else if (vDate <= ninetyDaysFromNow) visaExpiringSoonCount++;
          else visaInDateCount++;
        }
      }

      // DBS
      if (u.dbsDate) {
        const dDate = new Date(u.dbsDate);
        if (dDate <= threeYearsAgo) dbsExpiredCount++;
        else if (dDate <= twoAndHalfYearsAgo) dbsExpiringSoonCount++;
        else dbsInDateCount++;
      }
    });

    // PDP stats
    let pdpNotStarted = 0;
    let pdpInProgress = 0;
    let pdpCompleted = 0;
    let pdpOverdue = 0;

    pdps.forEach(p => {
      if (p.progress === 'COMPLETED') {
        pdpCompleted++;
      } else if (p.targetDate && new Date(p.targetDate) < now) {
        pdpOverdue++;
      } else if (p.progress === 'IN_PROGRESS') {
        pdpInProgress++;
      } else {
        pdpNotStarted++;
      }
    });

    return NextResponse.json({
      summary: {
        totalStaff: users.length,
        supervisions: {
          total: supervisions.length,
          overdue: supervisionsOverdue,
          dueSoon: supervisionsDueSoon,
          upToDate: supervisionsUpToDate
        },
        appraisals: {
          total: appraisals.length,
          overdue: appraisalsOverdue,
          dueSoon: appraisalsDueSoon,
          upToDate: appraisalsUpToDate
        },
        probation: {
          total: probations.length,
          underProbation: probationsUnderWay,
          dueSoon: probationsDueSoon,
          overdue: probationsOverdue,
          passed: probationsPassed
        },
        sponsorship: {
          totalSponsored: sponsoredCount,
          expired: visaExpiredCount,
          expiringSoon: visaExpiringSoonCount,
          inDate: visaInDateCount
        },
        dbs: {
          expired: dbsExpiredCount,
          expiringSoon: dbsExpiringSoonCount,
          inDate: dbsInDateCount
        },
        pdp: {
          total: pdps.length,
          overdue: pdpOverdue,
          inProgress: pdpInProgress,
          completed: pdpCompleted,
          notStarted: pdpNotStarted
        }
      }
    });
  } catch (error) {
    console.error('Error generating tracker summary:', error);
    return NextResponse.json({ error: 'Failed to generate tracker summary' }, { status: 500 });
  }
}
