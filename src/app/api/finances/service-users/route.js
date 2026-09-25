import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetYear = parseInt(searchParams.get('year') || '2026', 10);

    const seekers = await prisma.serviceSeeker.findMany({
      where: {
        status: { in: ['LIVE', 'PRE_ADMISSION', 'ON_HOLD_HOSPITAL'] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        address: true,
        postalCode: true,
        photoUrl: true,
        admission: {
          select: {
            startDate: true,
            hoursPerDay: true,
            sleepInNight: true,
            banding: true,
          },
        },
        financialProfile: true,
        weeklyFinancialLedgers: {
          where: { year: targetYear },
          orderBy: { weekNumber: 'asc' },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    const userSummaries = seekers.map((s) => {
      const profile = s.financialProfile || {};
      const ledgers = s.weeklyFinancialLedgers || [];

      // Calculate Current Year Totals
      const rentDueTotal = ledgers.reduce((acc, l) => acc + (l.rentDue || 0), 0);
      const rentPaidTotal = ledgers.reduce((acc, l) => acc + (l.rentPaid || 0), 0);
      const rentCurrentYear = rentDueTotal - rentPaidTotal;
      const rentCarriedForward = profile.rentCarriedForward || 0;
      const totalRentOwing = rentCarriedForward + rentCurrentYear;

      const utilitiesDueTotal = ledgers.reduce((acc, l) => acc + (l.utilitiesDue || 0), 0);
      const utilitiesPaidTotal = ledgers.reduce((acc, l) => acc + (l.utilitiesPaid || 0), 0);
      const utilitiesCurrentYear = utilitiesDueTotal - utilitiesPaidTotal;
      const utilitiesCarriedForward = profile.utilitiesCarriedForward || 0;
      const totalUtilitiesOwing = utilitiesCarriedForward + utilitiesCurrentYear;

      const supportDueTotal = ledgers.reduce((acc, l) => acc + (l.supportDue || 0), 0);
      const supportPaidTotal = ledgers.reduce((acc, l) => acc + (l.supportPaid || 0), 0);
      const supportCurrentYear = supportDueTotal - supportPaidTotal;
      const supportCarriedForward = profile.supportCarriedForward || 0;
      const totalSupportOwing = supportCarriedForward + supportCurrentYear;

      const netTotalOwing = totalRentOwing + totalUtilitiesOwing + totalSupportOwing;

      let status = 'BALANCED';
      if (netTotalOwing > 0.01) status = 'ARREARS';
      else if (netTotalOwing < -0.01) status = 'IN_CREDIT';

      return {
        id: s.id,
        name: `${s.firstName} ${s.lastName}`.trim(),
        firstName: s.firstName,
        lastName: s.lastName,
        photoUrl: s.photoUrl,
        status: s.status,
        property: profile.property || s.address || 'Unassigned',
        movedInDate: profile.movedInDate || s.admission?.startDate || null,
        rentAmount: profile.rentAmount ?? 0,
        rentPaymentResponsibility: profile.rentPaymentResponsibility || 'Not Specified',
        utilitiesPerWeek: profile.utilitiesPerWeek ?? 0,
        utilitiesPaymentResponsibility: profile.utilitiesPaymentResponsibility || 'Not Specified',
        supportHoursPerDay: profile.supportHoursPerDay ?? (s.admission?.hoursPerDay ? parseFloat(s.admission.hoursPerDay) : 0),
        costPerHour: profile.costPerHour ?? 0,
        costPerWeek: profile.costPerWeek ?? 0,
        sleepingNight: profile.sleepingNight ?? (s.admission?.sleepInNight === 'Yes'),
        supportPaymentResponsibility: profile.supportPaymentResponsibility || 'Not Specified',
        comments: profile.comments || '',

        // Financial Balances
        rent: {
          carriedForward: rentCarriedForward,
          dueTotal: rentDueTotal,
          paidTotal: rentPaidTotal,
          currentYear: rentCurrentYear,
          totalOwing: totalRentOwing,
        },
        utilities: {
          carriedForward: utilitiesCarriedForward,
          dueTotal: utilitiesDueTotal,
          paidTotal: utilitiesPaidTotal,
          currentYear: utilitiesCurrentYear,
          totalOwing: totalUtilitiesOwing,
        },
        support: {
          carriedForward: supportCarriedForward,
          dueTotal: supportDueTotal,
          paidTotal: supportPaidTotal,
          currentYear: supportCurrentYear,
          totalOwing: totalSupportOwing,
        },
        netTotalOwing,
        financialStatus: status,
        weeksCount: ledgers.length,
      };
    });

    // High level collation statistics
    const stats = userSummaries.reduce(
      (acc, u) => {
        acc.totalRentOutstanding += u.rent.totalOwing;
        acc.totalUtilitiesOutstanding += u.utilities.totalOwing;
        acc.totalSupportOutstanding += u.support.totalOwing;
        acc.netOutstandingBalance += u.netTotalOwing;

        if (u.financialStatus === 'ARREARS') acc.arrearsCount++;
        else if (u.financialStatus === 'IN_CREDIT') acc.creditCount++;
        else acc.balancedCount++;

        return acc;
      },
      {
        totalRentOutstanding: 0,
        totalUtilitiesOutstanding: 0,
        totalSupportOutstanding: 0,
        netOutstandingBalance: 0,
        arrearsCount: 0,
        creditCount: 0,
        balancedCount: 0,
        totalUsers: userSummaries.length,
      }
    );

    return NextResponse.json({
      success: true,
      year: targetYear,
      stats,
      serviceUsers: userSummaries,
    });
  } catch (error) {
    console.error('GET /api/finances/service-users error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
