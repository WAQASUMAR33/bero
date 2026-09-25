import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { get52WeeksForYear } from '@/lib/financialWeekUtils';

export async function GET(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) {
      return NextResponse.json({ success: false, error: 'Invalid Service Seeker ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const targetYear = parseInt(searchParams.get('year') || '2026', 10);

    const seeker = await prisma.serviceSeeker.findUnique({
      where: { id: serviceSeekerId },
      include: {
        admission: true,
        financialProfile: true,
      },
    });

    if (!seeker) {
      return NextResponse.json({ success: false, error: 'Service Seeker not found' }, { status: 404 });
    }

    // Ensure financial profile exists
    let profile = seeker.financialProfile;
    if (!profile) {
      profile = await prisma.serviceUserFinancialProfile.create({
        data: {
          serviceSeekerId,
          property: seeker.address || '',
          movedInDate: seeker.admission?.startDate ? new Date(seeker.admission.startDate) : null,
          rentAmount: 0,
          rentPaymentResponsibility: 'Housing Benefit',
          utilitiesPerWeek: 0,
          utilitiesPaymentResponsibility: 'Service User',
          supportHoursPerDay: seeker.admission?.hoursPerDay ? parseFloat(seeker.admission.hoursPerDay) : 0,
          costPerHour: 0,
          costPerWeek: 0,
          sleepingNight: seeker.admission?.sleepInNight === 'Yes',
          costPerNight: 0,
          nightCostPerWeek: 0,
          supportPaymentResponsibility: 'Local Authority',
          rentCarriedForward: 0,
          utilitiesCarriedForward: 0,
          supportCarriedForward: 0,
          comments: '',
        },
      });
    }

    // Fetch existing weekly ledgers for year
    let ledgers = await prisma.serviceUserWeeklyLedger.findMany({
      where: {
        profileId: profile.id,
        year: targetYear,
      },
      orderBy: { weekNumber: 'asc' },
    });

    // If no weekly ledgers exist for targetYear, initialize all 52 weeks
    if (ledgers.length === 0) {
      const generatedWeeks = get52WeeksForYear(targetYear);
      
      const defaultSupportDue = profile.costPerWeek || (profile.supportHoursPerDay && profile.costPerHour ? profile.supportHoursPerDay * profile.costPerHour * 7 : 0);
      const defaultUtilitiesDue = profile.utilitiesPerWeek || 0;
      const defaultRentDue = profile.rentAmount || 0;

      const createData = generatedWeeks.map(w => ({
        profileId: profile.id,
        serviceSeekerId,
        year: targetYear,
        weekNumber: w.weekNumber,
        monthName: w.monthName,
        weekStartDate: new Date(w.date),
        supportDue: defaultSupportDue,
        supportPaid: 0,
        utilitiesDue: defaultUtilitiesDue,
        utilitiesPaid: 0,
        rentDue: defaultRentDue,
        rentPaid: 0,
        notes: null,
      }));

      await prisma.serviceUserWeeklyLedger.createMany({
        data: createData,
      });

      ledgers = await prisma.serviceUserWeeklyLedger.findMany({
        where: {
          profileId: profile.id,
          year: targetYear,
        },
        orderBy: { weekNumber: 'asc' },
      });
    }

    // Calculate totals matching Row 62 in Service User Finances.xlsx
    const totals = ledgers.reduce(
      (acc, l) => {
        acc.supportDueTotal += l.supportDue || 0;
        acc.supportPaidTotal += l.supportPaid || 0;
        acc.utilitiesDueTotal += l.utilitiesDue || 0;
        acc.utilitiesPaidTotal += l.utilitiesPaid || 0;
        acc.rentDueTotal += l.rentDue || 0;
        acc.rentPaidTotal += l.rentPaid || 0;
        return acc;
      },
      {
        supportDueTotal: 0,
        supportPaidTotal: 0,
        utilitiesDueTotal: 0,
        utilitiesPaidTotal: 0,
        rentDueTotal: 0,
        rentPaidTotal: 0,
      }
    );

    // Summary calculations matching Top Right Cards in Service User Finances.xlsx
    const rentCurrentYear = totals.rentDueTotal - totals.rentPaidTotal; // =sum(G62-H62)
    const rentCarriedForward = profile.rentCarriedForward || 0;
    const totalRentOwing = rentCarriedForward + rentCurrentYear; // =sum(J4+K4)

    const utilitiesCurrentYear = totals.utilitiesDueTotal - totals.utilitiesPaidTotal; // =sum(E62-F62)
    const utilitiesCarriedForward = profile.utilitiesCarriedForward || 0;
    const totalUtilitiesOwing = utilitiesCarriedForward + utilitiesCurrentYear; // =sum(J8+K8)

    const supportCurrentYear = totals.supportDueTotal - totals.supportPaidTotal; // =sum(C62-D62)
    const supportCarriedForward = profile.supportCarriedForward || 0;
    const totalSupportOwing = supportCarriedForward + supportCurrentYear; // =sum(J12+K12)

    const grandTotalOwing = totalRentOwing + totalUtilitiesOwing + totalSupportOwing;

    return NextResponse.json({
      success: true,
      serviceSeeker: {
        id: seeker.id,
        name: `${seeker.firstName} ${seeker.lastName}`.trim(),
        firstName: seeker.firstName,
        lastName: seeker.lastName,
        photoUrl: seeker.photoUrl,
        status: seeker.status,
      },
      profile,
      year: targetYear,
      weeks: ledgers,
      totals,
      summary: {
        rent: {
          carriedForward: rentCarriedForward,
          currentYear: rentCurrentYear,
          totalOwing: totalRentOwing,
        },
        utilities: {
          carriedForward: utilitiesCarriedForward,
          currentYear: utilitiesCurrentYear,
          totalOwing: totalUtilitiesOwing,
        },
        support: {
          carriedForward: supportCarriedForward,
          currentYear: supportCurrentYear,
          totalOwing: totalSupportOwing,
        },
        grandTotalOwing,
      },
    });
  } catch (error) {
    console.error('GET /api/finances/service-users/[id] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) {
      return NextResponse.json({ success: false, error: 'Invalid Service Seeker ID' }, { status: 400 });
    }

    const body = await request.json();
    const { profile: profileData, weeks: weeksData, year } = body;

    // 1. Update Profile if provided
    let updatedProfile = null;
    if (profileData) {
      const movedIn = profileData.movedInDate ? new Date(profileData.movedInDate) : null;
      updatedProfile = await prisma.serviceUserFinancialProfile.upsert({
        where: { serviceSeekerId },
        create: {
          serviceSeekerId,
          property: profileData.property || '',
          movedInDate: movedIn,
          rentAmount: parseFloat(profileData.rentAmount) || 0,
          rentPaymentResponsibility: profileData.rentPaymentResponsibility || '',
          utilitiesPerWeek: parseFloat(profileData.utilitiesPerWeek) || 0,
          utilitiesPaymentResponsibility: profileData.utilitiesPaymentResponsibility || '',
          supportHoursPerDay: parseFloat(profileData.supportHoursPerDay) || 0,
          costPerHour: parseFloat(profileData.costPerHour) || 0,
          costPerWeek: parseFloat(profileData.costPerWeek) || 0,
          sleepingNight: profileData.sleepingNight === true || profileData.sleepingNight === 'Yes',
          costPerNight: parseFloat(profileData.costPerNight) || 0,
          nightCostPerWeek: parseFloat(profileData.nightCostPerWeek) || 0,
          supportPaymentResponsibility: profileData.supportPaymentResponsibility || '',
          rentCarriedForward: parseFloat(profileData.rentCarriedForward) || 0,
          utilitiesCarriedForward: parseFloat(profileData.utilitiesCarriedForward) || 0,
          supportCarriedForward: parseFloat(profileData.supportCarriedForward) || 0,
          comments: profileData.comments || '',
        },
        update: {
          property: profileData.property,
          movedInDate: movedIn,
          rentAmount: profileData.rentAmount !== undefined ? parseFloat(profileData.rentAmount) || 0 : undefined,
          rentPaymentResponsibility: profileData.rentPaymentResponsibility,
          utilitiesPerWeek: profileData.utilitiesPerWeek !== undefined ? parseFloat(profileData.utilitiesPerWeek) || 0 : undefined,
          utilitiesPaymentResponsibility: profileData.utilitiesPaymentResponsibility,
          supportHoursPerDay: profileData.supportHoursPerDay !== undefined ? parseFloat(profileData.supportHoursPerDay) || 0 : undefined,
          costPerHour: profileData.costPerHour !== undefined ? parseFloat(profileData.costPerHour) || 0 : undefined,
          costPerWeek: profileData.costPerWeek !== undefined ? parseFloat(profileData.costPerWeek) || 0 : undefined,
          sleepingNight: profileData.sleepingNight !== undefined ? (profileData.sleepingNight === true || profileData.sleepingNight === 'Yes') : undefined,
          costPerNight: profileData.costPerNight !== undefined ? parseFloat(profileData.costPerNight) || 0 : undefined,
          nightCostPerWeek: profileData.nightCostPerWeek !== undefined ? parseFloat(profileData.nightCostPerWeek) || 0 : undefined,
          supportPaymentResponsibility: profileData.supportPaymentResponsibility,
          rentCarriedForward: profileData.rentCarriedForward !== undefined ? parseFloat(profileData.rentCarriedForward) || 0 : undefined,
          utilitiesCarriedForward: profileData.utilitiesCarriedForward !== undefined ? parseFloat(profileData.utilitiesCarriedForward) || 0 : undefined,
          supportCarriedForward: profileData.supportCarriedForward !== undefined ? parseFloat(profileData.supportCarriedForward) || 0 : undefined,
          comments: profileData.comments !== undefined ? profileData.comments : undefined,
        },
      });
    }

    // 2. Update Weeks if provided
    if (Array.isArray(weeksData) && weeksData.length > 0) {
      await prisma.$transaction(
        weeksData.map(w =>
          prisma.serviceUserWeeklyLedger.update({
            where: { id: w.id },
            data: {
              supportDue: parseFloat(w.supportDue) || 0,
              supportPaid: parseFloat(w.supportPaid) || 0,
              utilitiesDue: parseFloat(w.utilitiesDue) || 0,
              utilitiesPaid: parseFloat(w.utilitiesPaid) || 0,
              rentDue: parseFloat(w.rentDue) || 0,
              rentPaid: parseFloat(w.rentPaid) || 0,
              notes: w.notes !== undefined ? w.notes : undefined,
              paymentMethod: w.paymentMethod !== undefined ? w.paymentMethod : undefined,
              paymentReference: w.paymentReference !== undefined ? w.paymentReference : undefined,
            },
          })
        )
      );
    }

    return NextResponse.json({ success: true, message: 'Finances saved successfully', profile: updatedProfile });
  } catch (error) {
    console.error('PUT /api/finances/service-users/[id] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
