import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getWeekInfoForDate } from '@/lib/financialWeekUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to map transaction category to P&L column
function mapCategoryToPnlField(type, category) {
  if (type === 'INCOMING') {
    if (category === 'SERVICE_USER_FEES') return 'fees';
    if (category === 'SERVICE_USER_UTILITIES') return 'utilities';
    if (category === 'SERVICE_USER_RENT') return 'rentPayments';
    return 'fees'; // Default incoming to fees
  } else {
    const map = {
      'ELECTRICITY': 'electricity',
      'GAS': 'gas',
      'WATER': 'water',
      'COUNCIL_TAX': 'councilTax',
      'TV_LICENCE': 'tvLicence',
      'INTERNET': 'internet',
      'FURNISHINGS': 'furnishings',
      'MAINTENANCE': 'maintenance',
      'INSURANCE': 'insurance',
      'WAGES': 'wages',
      'RENT': 'rent',
      'OTHER': 'other'
    };
    return map[category] || 'other';
  }
}

// GET /api/finances/transactions
export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const serviceSeekerId = searchParams.get('serviceSeekerId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const where = {};
    if (type) where.type = type.toUpperCase();
    if (category) where.category = category;
    if (serviceSeekerId) where.serviceSeekerId = parseInt(serviceSeekerId, 10);

    if (year) {
      const y = parseInt(year, 10);
      let startDate = new Date(Date.UTC(y, 0, 1));
      let endDate = new Date(Date.UTC(y, 11, 31, 23, 59, 59));

      if (month) {
        const m = parseInt(month, 10) - 1;
        startDate = new Date(Date.UTC(y, m, 1));
        endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));
      }

      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const transactions = await prisma.financialTransaction.findMany({
      where,
      include: {
        serviceSeeker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            preferredName: true,
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/finances/transactions
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type, // 'INCOMING' | 'OUTGOING'
      category,
      categoryLabel,
      date,
      amount,
      houseName,
      serviceSeekerId,
      description,
      paymentMethod,
      reference
    } = body;

    if (!type || !category || !date || amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, error: 'Type, category, date, and amount are required.' },
        { status: 400 }
      );
    }

    const parsedAmount = Math.abs(parseFloat(amount) || 0);
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid date provided.' }, { status: 400 });
    }

    const serviceSeekerIdNum = serviceSeekerId ? parseInt(serviceSeekerId, 10) : null;

    // 1. Create FinancialTransaction record
    const transaction = await prisma.financialTransaction.create({
      data: {
        type: type.toUpperCase(),
        category,
        categoryLabel: categoryLabel || category,
        date: parsedDate,
        amount: parsedAmount,
        houseName: houseName || null,
        serviceSeekerId: serviceSeekerIdNum,
        description: description || null,
        paymentMethod: paymentMethod || 'Bank Transfer',
        reference: reference || null,
        createdById: currentUser.id,
      },
      include: {
        serviceSeeker: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    // 2. Pull through to P&L record
    const targetYear = parsedDate.getFullYear();
    const targetMonth = parsedDate.getMonth() + 1;
    const periodCode = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const pnlField = mapCategoryToPnlField(type.toUpperCase(), category);

    // Find or seed monthly P&L
    let pnlRecord = await prisma.pnlMonthlyRecord.findUnique({
      where: { periodCode }
    });

    if (!pnlRecord) {
      const monthName = `${MONTH_NAMES[targetMonth - 1]} ${targetYear}`;
      pnlRecord = await prisma.pnlMonthlyRecord.create({
        data: {
          year: targetYear,
          month: targetMonth,
          monthName,
          periodCode,
          [pnlField]: parsedAmount,
          totalOutgoings: type.toUpperCase() === 'OUTGOING' ? parsedAmount : 0,
          totalIncoming: type.toUpperCase() === 'INCOMING' ? parsedAmount : 0,
          ebitdarm: type.toUpperCase() === 'INCOMING' ? parsedAmount : -parsedAmount,
        }
      });
    } else {
      const currentVal = parseFloat(pnlRecord[pnlField]) || 0;
      const newVal = currentVal + parsedAmount;

      const updatedFields = { [pnlField]: newVal };

      const allOutgoings = [
        'rent', 'gas', 'electricity', 'water', 'councilTax', 'tvLicence',
        'internet', 'furnishings', 'maintenance', 'insurance', 'wages', 'other'
      ];
      let totalOutgoings = 0;
      allOutgoings.forEach(f => {
        totalOutgoings += (f === pnlField ? newVal : (parseFloat(pnlRecord[f]) || 0));
      });

      const allIncomings = ['fees', 'utilities', 'rentPayments'];
      let totalIncoming = 0;
      allIncomings.forEach(f => {
        totalIncoming += (f === pnlField ? newVal : (parseFloat(pnlRecord[f]) || 0));
      });

      const ebitdarm = totalIncoming - totalOutgoings;

      pnlRecord = await prisma.pnlMonthlyRecord.update({
        where: { id: pnlRecord.id },
        data: {
          ...updatedFields,
          totalOutgoings,
          totalIncoming,
          ebitdarm,
        }
      });
    }

    // 3. Pull through to Service User Finances if applicable
    let serviceUserLedgerUpdated = false;
    if (serviceSeekerIdNum && ['SERVICE_USER_FEES', 'SERVICE_USER_RENT', 'SERVICE_USER_UTILITIES'].includes(category)) {
      try {
        let profile = await prisma.serviceUserFinancialProfile.findUnique({
          where: { serviceSeekerId: serviceSeekerIdNum }
        });

        if (!profile) {
          profile = await prisma.serviceUserFinancialProfile.create({
            data: {
              serviceSeekerId: serviceSeekerIdNum,
              property: houseName || 'Main Residence',
            }
          });
        }

        const weekInfo = getWeekInfoForDate(parsedDate, targetYear);
        if (weekInfo) {
          const weekStartDate = new Date(weekInfo.date);

          let ledger = await prisma.serviceUserWeeklyLedger.findUnique({
            where: {
              profileId_year_weekNumber: {
                profileId: profile.id,
                year: targetYear,
                weekNumber: weekInfo.weekNumber
              }
            }
          });

          const ledgerUpdates = {};
          if (category === 'SERVICE_USER_FEES') {
            ledgerUpdates.supportPaid = (ledger?.supportPaid || 0) + parsedAmount;
          } else if (category === 'SERVICE_USER_RENT') {
            ledgerUpdates.rentPaid = (ledger?.rentPaid || 0) + parsedAmount;
          } else if (category === 'SERVICE_USER_UTILITIES') {
            ledgerUpdates.utilitiesPaid = (ledger?.utilitiesPaid || 0) + parsedAmount;
          }

          if (ledger) {
            await prisma.serviceUserWeeklyLedger.update({
              where: { id: ledger.id },
              data: {
                ...ledgerUpdates,
                paymentMethod: paymentMethod || ledger.paymentMethod,
                paymentReference: reference || ledger.paymentReference,
              }
            });
          } else {
            await prisma.serviceUserWeeklyLedger.create({
              data: {
                profileId: profile.id,
                serviceSeekerId: serviceSeekerIdNum,
                year: targetYear,
                weekNumber: weekInfo.weekNumber,
                monthName: weekInfo.monthName,
                weekStartDate,
                supportDue: profile.costPerWeek || 0,
                rentDue: profile.rentAmount || 0,
                utilitiesDue: profile.utilitiesPerWeek || 0,
                ...ledgerUpdates,
                paymentMethod: paymentMethod || null,
                paymentReference: reference || null,
              }
            });
          }
          serviceUserLedgerUpdated = true;
        }
      } catch (suErr) {
        console.error('Error auto-syncing to service user ledger:', suErr);
      }
    }

    return NextResponse.json({
      success: true,
      transaction,
      pnlRecord,
      serviceUserLedgerUpdated,
      message: `Transaction recorded successfully. Pulled through to ${targetYear} P&L (${pnlField})${serviceUserLedgerUpdated ? ' and Service User weekly ledger.' : '.'}`
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/finances/transactions
export async function DELETE(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'), 10);

    if (!id) {
      return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
    }

    const tx = await prisma.financialTransaction.findUnique({ where: { id } });
    if (!tx) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    // Reverse from P&L
    const txDate = new Date(tx.date);
    const targetYear = txDate.getFullYear();
    const targetMonth = txDate.getMonth() + 1;
    const periodCode = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const pnlField = mapCategoryToPnlField(tx.type, tx.category);

    const pnlRecord = await prisma.pnlMonthlyRecord.findUnique({ where: { periodCode } });
    if (pnlRecord) {
      const currentVal = parseFloat(pnlRecord[pnlField]) || 0;
      const newVal = Math.max(0, currentVal - tx.amount);

      const allOutgoings = [
        'rent', 'gas', 'electricity', 'water', 'councilTax', 'tvLicence',
        'internet', 'furnishings', 'maintenance', 'insurance', 'wages', 'other'
      ];
      let totalOutgoings = 0;
      allOutgoings.forEach(f => {
        totalOutgoings += (f === pnlField ? newVal : (parseFloat(pnlRecord[f]) || 0));
      });

      const allIncomings = ['fees', 'utilities', 'rentPayments'];
      let totalIncoming = 0;
      allIncomings.forEach(f => {
        totalIncoming += (f === pnlField ? newVal : (parseFloat(pnlRecord[f]) || 0));
      });

      await prisma.pnlMonthlyRecord.update({
        where: { id: pnlRecord.id },
        data: {
          [pnlField]: newVal,
          totalOutgoings,
          totalIncoming,
          ebitdarm: totalIncoming - totalOutgoings
        }
      });
    }

    await prisma.financialTransaction.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Transaction deleted and P&L adjusted' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
