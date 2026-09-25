import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function calculateRowTotals(data) {
  const rent = parseFloat(data.rent) || 0;
  const gas = parseFloat(data.gas) || 0;
  const electricity = parseFloat(data.electricity) || 0;
  const water = parseFloat(data.water) || 0;
  const councilTax = parseFloat(data.councilTax) || 0;
  const tvLicence = parseFloat(data.tvLicence) || 0;
  const internet = parseFloat(data.internet) || 0;
  const furnishings = parseFloat(data.furnishings) || 0;
  const maintenance = parseFloat(data.maintenance) || 0;
  const insurance = parseFloat(data.insurance) || 0;
  const wages = parseFloat(data.wages) || 0;
  const other = parseFloat(data.other) || 0;

  const totalOutgoings = rent + gas + electricity + water + councilTax + tvLicence +
    internet + furnishings + maintenance + insurance + wages + other;

  const fees = parseFloat(data.fees) || 0;
  const utilities = parseFloat(data.utilities) || 0;
  const rentPayments = parseFloat(data.rentPayments) || 0;

  const totalIncoming = fees + utilities + rentPayments;
  const ebitdarm = totalIncoming - totalOutgoings;

  return {
    rent,
    gas,
    electricity,
    water,
    councilTax,
    tvLicence,
    internet,
    furnishings,
    maintenance,
    insurance,
    wages,
    other,
    totalOutgoings,
    fees,
    utilities,
    rentPayments,
    totalIncoming,
    ebitdarm,
  };
}

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetYear = parseInt(searchParams.get('year') || '2026', 10);

    let records = await prisma.pnlMonthlyRecord.findMany({
      where: { year: targetYear },
      orderBy: { month: 'asc' },
    });

    // Seed empty 12 months for the year if not present
    if (records.length === 0) {
      const seedData = MONTH_NAMES.map((name, idx) => {
        const monthNum = idx + 1;
        const periodCode = `${targetYear}-${String(monthNum).padStart(2, '0')}`;
        return {
          year: targetYear,
          month: monthNum,
          monthName: `${name} ${targetYear}`,
          periodCode,
          rent: 0,
          gas: 0,
          electricity: 0,
          water: 0,
          councilTax: 0,
          tvLicence: 0,
          internet: 0,
          furnishings: 0,
          maintenance: 0,
          insurance: 0,
          wages: 0,
          other: 0,
          totalOutgoings: 0,
          fees: 0,
          utilities: 0,
          rentPayments: 0,
          totalIncoming: 0,
          ebitdarm: 0,
        };
      });

      for (const row of seedData) {
        await prisma.pnlMonthlyRecord.upsert({
          where: { periodCode: row.periodCode },
          create: row,
          update: {},
        });
      }

      records = await prisma.pnlMonthlyRecord.findMany({
        where: { year: targetYear },
        orderBy: { month: 'asc' },
      });
    }

    // Calculate YTD totals
    const totals = records.reduce(
      (acc, r) => {
        acc.rent += r.rent;
        acc.gas += r.gas;
        acc.electricity += r.electricity;
        acc.water += r.water;
        acc.councilTax += r.councilTax;
        acc.tvLicence += r.tvLicence;
        acc.internet += r.internet;
        acc.furnishings += r.furnishings;
        acc.maintenance += r.maintenance;
        acc.insurance += r.insurance;
        acc.wages += r.wages;
        acc.other += r.other;
        acc.totalOutgoings += r.totalOutgoings;

        acc.fees += r.fees;
        acc.utilities += r.utilities;
        acc.rentPayments += r.rentPayments;
        acc.totalIncoming += r.totalIncoming;

        acc.ebitdarm += r.ebitdarm;
        return acc;
      },
      {
        rent: 0, gas: 0, electricity: 0, water: 0, councilTax: 0, tvLicence: 0,
        internet: 0, furnishings: 0, maintenance: 0, insurance: 0, wages: 0, other: 0,
        totalOutgoings: 0, fees: 0, utilities: 0, rentPayments: 0, totalIncoming: 0,
        ebitdarm: 0,
      }
    );

    const marginPercent = totals.totalIncoming > 0
      ? ((totals.ebitdarm / totals.totalIncoming) * 100).toFixed(1)
      : '0.0';

    // Get all available years for the selector
    const distinctYears = await prisma.pnlMonthlyRecord.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'asc' },
    });
    const years = Array.from(new Set([2026, 2027, ...distinctYears.map(d => d.year)])).sort();

    return NextResponse.json({
      success: true,
      year: targetYear,
      records,
      totals,
      marginPercent: parseFloat(marginPercent),
      availableYears: years,
    });
  } catch (error) {
    console.error('GET /api/finances/pnl error:', error);
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
    const { periodCode, year, month, ...financialFields } = body;

    if (!periodCode) {
      return NextResponse.json({ success: false, error: 'periodCode is required' }, { status: 400 });
    }

    const computed = calculateRowTotals(financialFields);
    const monthNum = parseInt(month, 10) || parseInt(periodCode.split('-')[1], 10);
    const yearNum = parseInt(year, 10) || parseInt(periodCode.split('-')[0], 10);
    const monthName = `${MONTH_NAMES[monthNum - 1] || 'Month'} ${yearNum}`;

    const record = await prisma.pnlMonthlyRecord.upsert({
      where: { periodCode },
      create: {
        periodCode,
        year: yearNum,
        month: monthNum,
        monthName,
        notes: body.notes || null,
        updatedById: currentUser.id,
        ...computed,
      },
      update: {
        notes: body.notes !== undefined ? body.notes : undefined,
        updatedById: currentUser.id,
        ...computed,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('POST /api/finances/pnl error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
