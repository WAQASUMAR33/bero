import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const DEFAULT_AUDITS = [
  {
    title: 'Medication Administration & MAR Audit',
    category: 'Clinical & Medicines',
    frequency: 'Monthly',
    targetScore: 95.0,
    description: 'Audit of MAR charts, medication storage, controlled drugs, missed doses, and blister pack checks.',
    checklist: [
      { id: 'm1', text: 'All MAR charts signed for administered medications with no blanks', weight: 20 },
      { id: 'm2', text: 'Controlled drugs register reconciled with physical stock', weight: 20 },
      { id: 'm3', text: 'Medication administration times match prescribed instructions', weight: 20 },
      { id: 'm4', text: 'Topical medication administration records (TMAR) fully up to date', weight: 20 },
      { id: 'm5', text: 'Medication storage temperature logs completed daily and within range', weight: 20 },
    ]
  },
  {
    title: 'Care Plans & Risk Assessments Review Audit',
    category: 'Care Quality',
    frequency: 'Monthly',
    targetScore: 90.0,
    description: 'Audit of service user care plans, risk evaluations (Green/Red lifecycle), consent forms, and outcomes.',
    checklist: [
      { id: 'c1', text: 'Care plans reviewed within recommended 6-month or 26-week cycle', weight: 25 },
      { id: 'c2', text: 'All risk assessments evaluated within the past 30 days (Green status)', weight: 25 },
      { id: 'c3', text: 'Service user preferences and person-centred choices documented', weight: 25 },
      { id: 'c4', text: 'Signed consent and capacity documentation verified', weight: 25 },
    ]
  },
  {
    title: 'Health & Safety, Environment & Key-Safe Audit',
    category: 'Safety & Environment',
    frequency: 'Monthly',
    targetScore: 92.0,
    description: 'Environmental safety checks, equipment servicing, fire safety, and key-safe security audit.',
    checklist: [
      { id: 'h1', text: 'Moving and handling equipment (hoists, slings) serviced and inspected', weight: 25 },
      { id: 'h2', text: 'Key safe codes secure and updated in accordance with protocol', weight: 25 },
      { id: 'h3', text: 'Smoke alarms and carbon monoxide detectors tested and functional', weight: 25 },
      { id: 'h4', text: 'Emergency contacts and evacuation plans visible and accurate', weight: 25 },
    ]
  },
  {
    title: 'Infection Prevention & Control (IPC) Audit',
    category: 'Clinical Governance',
    frequency: 'Monthly',
    targetScore: 95.0,
    description: 'PPE supply levels, hand hygiene compliance, cross-contamination prevention, and waste disposal.',
    checklist: [
      { id: 'i1', text: 'Adequate PPE stock available for all visiting care workers', weight: 30 },
      { id: 'i2', text: 'Care workers adhere to 5 moments of hand hygiene protocols', weight: 40 },
      { id: 'i3', text: 'Clinical and sanitary waste disposed of according to regulations', weight: 30 },
    ]
  },
  {
    title: 'Staff Training, Competency & Supervision Audit',
    category: 'HR & Workforce',
    frequency: 'Quarterly',
    targetScore: 90.0,
    description: 'Mandatory training compliance, moving & handling competencies, spot checks, and supervisions.',
    checklist: [
      { id: 's1', text: 'Mandatory training certificates current with zero expired modules', weight: 35 },
      { id: 's2', text: 'Annual moving and handling practical competency signed off', weight: 35 },
      { id: 's3', text: 'Quarterly staff supervisions and unannounced spot checks recorded', weight: 30 },
    ]
  }
];

import fs from 'fs';
import path from 'path';

function loadAuditTemplates() {
  try {
    const filePath = path.join(process.cwd(), 'src/data/qaAuditTemplates.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading audit templates:', e);
  }
  return DEFAULT_AUDITS;
}

function calculateNextDueDate(frequency, fromDate = new Date()) {
  const next = new Date(fromDate);
  const freq = (frequency || '').toLowerCase();
  if (freq.includes('monthly') && !freq.includes('bi')) {
    next.setMonth(next.getMonth() + 1);
  } else if (freq.includes('bi-monthly')) {
    next.setMonth(next.getMonth() + 2);
  } else if (freq.includes('quarterly')) {
    next.setMonth(next.getMonth() + 3);
  } else if (freq.includes('bi-annual') || freq.includes('half')) {
    next.setMonth(next.getMonth() + 6);
  } else if (freq.includes('annual')) {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

function computeRagStatus(audit, latestSubmission) {
  const now = new Date();
  // If submitted within the current cycle (last 30 days for monthly)
  if (latestSubmission && audit.lastCompleted) {
    const daysSince = (now - new Date(audit.lastCompleted)) / (1000 * 60 * 60 * 24);
    const freq = (audit.frequency || '').toLowerCase();
    let cycleDays = 30;
    if (freq.includes('bi-monthly')) cycleDays = 60;
    else if (freq.includes('quarterly')) cycleDays = 90;
    else if (freq.includes('bi-annual')) cycleDays = 180;
    else if (freq.includes('annual')) cycleDays = 365;

    if (daysSince <= cycleDays) {
      return 'GREEN'; // Completed
    }
  }

  if (audit.nextDue) {
    const dueDate = new Date(audit.nextDue);
    if (dueDate < now) {
      return 'RED'; // Overdue
    }
    const daysUntilDue = (dueDate - now) / (1000 * 60 * 60 * 24);
    if (daysUntilDue <= 14) {
      return 'YELLOW'; // Due soon
    }
  }

  return 'YELLOW';
}

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Seed audits from templates if none or fewer than 10 configured
    const auditCount = await prisma.qaAudit.count();
    if (auditCount < 10) {
      const templates = loadAuditTemplates();
      for (const item of templates) {
        const existing = await prisma.qaAudit.findFirst({
          where: { title: item.title }
        });
        if (!existing) {
          const nextDueDate = calculateNextDueDate(item.frequency);
          const createdAudit = await prisma.qaAudit.create({
            data: {
              title: item.title,
              category: item.category,
              location: item.location || 'Head Office',
              frequency: item.frequency || 'Monthly',
              targetScore: item.targetScore || 90.0,
              description: item.description || item.comments || '',
              comments: item.comments || '',
              checklist: item.checklist || [],
              assignedToId: currentUser.id,
              nextDue: nextDueDate,
              ragStatus: 'DUE'
            }
          });

          // Seed sample historical submissions for previous 2 months to provide immediate trends
          const now = new Date();
          for (let i = 2; i >= 1; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            const score = Math.round(88 + Math.random() * 10);
            const checklistLen = Array.isArray(item.checklist) && item.checklist.length > 0 ? item.checklist.length : 10;
            const passed = Math.round((score / 100) * checklistLen);
            await prisma.qaAuditSubmission.create({
              data: {
                auditId: createdAudit.id,
                auditTitle: createdAudit.title,
                month: m,
                year: y,
                scorePercentage: score,
                totalItems: checklistLen,
                passedItems: passed,
                status: score >= createdAudit.targetScore ? 'COMPLIANT' : 'NEEDS_IMPROVEMENT',
                conductedById: currentUser.id,
                conductedAt: new Date(y, m - 1, 15, 10, 0, 0),
                findings: `Scheduled ${createdAudit.frequency.toLowerCase()} audit conducted for ${d.toLocaleString('default', { month: 'long' })} ${y}.`,
                actionsRequired: score < createdAudit.targetScore ? 'Action plan items created for missed questions.' : 'No immediate remedial action required.',
              }
            });
          }
        }
      }
    }

    const { searchParams } = new URL(request.url);
    const selectedYear = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);
    const locationFilter = searchParams.get('location');

    // Fetch all active audits
    const whereAudit = { isActive: true };
    if (locationFilter && locationFilter !== 'all') {
      whereAudit.location = locationFilter;
    }

    const rawAudits = await prisma.qaAudit.findMany({
      where: whereAudit,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        submissions: {
          orderBy: { conductedAt: 'desc' },
          take: 12,
          include: {
            conductedBy: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { title: 'asc' }
      ]
    });

    // Compute dynamic RAG status for each audit
    const audits = rawAudits.map(audit => {
      const latestSub = audit.submissions?.[0] || null;
      const ragStatus = computeRagStatus(audit, latestSub);
      return {
        ...audit,
        ragStatus,
        lastScore: latestSub ? latestSub.scorePercentage : null,
      };
    });

    // Fetch all submissions for the selected year and the previous year for historical tracking
    const submissions = await prisma.qaAuditSubmission.findMany({
      where: {
        year: { in: [selectedYear, selectedYear - 1] }
      },
      include: {
        conductedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { conductedAt: 'desc' }
      ]
    });

    // Calculate monthly percentage averages for tracking
    const monthsData = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    for (let m = 1; m <= 12; m++) {
      const monthSubs = submissions.filter(s => s.year === selectedYear && s.month === m);
      const prevYearSubs = submissions.filter(s => s.year === selectedYear - 1 && s.month === m);

      const avgScore = monthSubs.length > 0
        ? Math.round((monthSubs.reduce((acc, s) => acc + s.scorePercentage, 0) / monthSubs.length) * 10) / 10
        : null;

      const prevYearAvg = prevYearSubs.length > 0
        ? Math.round((prevYearSubs.reduce((acc, s) => acc + s.scorePercentage, 0) / prevYearSubs.length) * 10) / 10
        : null;

      const monthName = new Date(selectedYear, m - 1, 1).toLocaleString('default', { month: 'short' });

      monthsData.push({
        month: m,
        monthName,
        year: selectedYear,
        score: avgScore,
        prevYearScore: prevYearAvg,
        auditsCount: monthSubs.length,
        isCurrent: selectedYear === currentYear && m === currentMonth,
        isPast: selectedYear < currentYear || (selectedYear === currentYear && m <= currentMonth),
      });
    }

    // Current month stats
    const currentMonthData = monthsData.find(m => m.month === currentMonth && m.year === currentYear) || monthsData[monthsData.length - 1];
    const prevMonthNumber = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonthSubs = submissions.filter(s => s.year === prevMonthYear && s.month === prevMonthNumber);
    const prevMonthScore = prevMonthSubs.length > 0
      ? Math.round((prevMonthSubs.reduce((acc, s) => acc + s.scorePercentage, 0) / prevMonthSubs.length) * 10) / 10
      : null;

    const delta = (currentMonthData.score !== null && prevMonthScore !== null)
      ? Math.round((currentMonthData.score - prevMonthScore) * 10) / 10
      : null;

    return NextResponse.json({
      success: true,
      data: {
        audits,
        submissions,
        monthsData,
        selectedYear,
        stats: {
          currentMonthScore: currentMonthData.score || 0,
          previousMonthScore: prevMonthScore,
          delta,
          totalAuditsConfigured: audits.length,
          totalSubmissionsThisYear: submissions.filter(s => s.year === selectedYear).length,
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/quality-assurance/audits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audits data', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { actionType } = body;

    // 1. Submit a completed audit run
    if (actionType === 'SUBMIT_AUDIT') {
      const {
        auditId,
        month,
        year,
        scorePercentage,
        totalItems,
        passedItems,
        findings,
        actionsRequired,
        checklistResults,
      } = body;

      const audit = await prisma.qaAudit.findUnique({ where: { id: parseInt(auditId, 10) } });
      if (!audit) {
        return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });
      }

      const score = parseFloat(scorePercentage);
      const status = score >= audit.targetScore ? 'COMPLIANT' : (score >= 70 ? 'NEEDS_IMPROVEMENT' : 'NON_COMPLIANT');

      const submission = await prisma.qaAuditSubmission.create({
        data: {
          auditId: audit.id,
          auditTitle: audit.title,
          month: parseInt(month, 10) || (new Date().getMonth() + 1),
          year: parseInt(year, 10) || new Date().getFullYear(),
          scorePercentage: score,
          totalItems: parseInt(totalItems, 10) || 0,
          passedItems: parseInt(passedItems, 10) || 0,
          status,
          conductedById: currentUser.id,
          conductedAt: new Date(),
          findings: findings || '',
          actionsRequired: actionsRequired || '',
          extra: checklistResults ? { checklistResults } : null,
        }
      });

      // Auto re-assign: schedule next due date according to frequency and update audit completion record
      const nextDue = calculateNextDueDate(audit.frequency, new Date());
      await prisma.qaAudit.update({
        where: { id: audit.id },
        data: {
          lastCompleted: new Date(),
          nextDue,
          ragStatus: 'GREEN'
        }
      });

      // Extract failed checklist questions so UI can prompt adding them to the Action Plan
      const failedQuestions = [];
      if (checklistResults && typeof checklistResults === 'object') {
        Object.entries(checklistResults).forEach(([qId, val]) => {
          if (val && (val.passed === false || val === false || (typeof val === 'object' && val.score === 0))) {
            failedQuestions.push({
              id: qId,
              number: val.number || '',
              text: val.text || (typeof val === 'string' ? val : `Audit item ${qId}`),
              comment: val.comment || val.comments || '',
            });
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: submission,
        nextDue,
        failedQuestions
      });
    }

    // 2. Re-assign or reschedule an audit
    if (actionType === 'REASSIGN_AUDIT') {
      const { auditId, assignedToId, nextDue, location, frequency } = body;
      if (!auditId) {
        return NextResponse.json({ success: false, error: 'Audit ID is required' }, { status: 400 });
      }

      const updateData = {};
      if (assignedToId !== undefined) {
        updateData.assignedToId = assignedToId ? parseInt(assignedToId, 10) : null;
      }
      if (nextDue) {
        updateData.nextDue = new Date(nextDue);
      }
      if (location) {
        updateData.location = location;
      }
      if (frequency) {
        updateData.frequency = frequency;
      }

      const updated = await prisma.qaAudit.update({
        where: { id: parseInt(auditId, 10) },
        data: updateData,
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // 3. Create a new audit template
    if (actionType === 'CREATE_AUDIT') {
      const { title, category, location, frequency, targetScore, description, assignedToId, checklist, comments } = body;
      if (!title?.trim()) {
        return NextResponse.json({ success: false, error: 'Audit title is required' }, { status: 400 });
      }

      const nextDue = calculateNextDueDate(frequency || 'Monthly');
      const newAudit = await prisma.qaAudit.create({
        data: {
          title: title.trim(),
          category: category || 'Care Quality',
          location: location || 'Head Office',
          frequency: frequency || 'Monthly',
          targetScore: parseFloat(targetScore) || 90.0,
          description: description || '',
          comments: comments || '',
          assignedToId: assignedToId ? parseInt(assignedToId, 10) : null,
          nextDue,
          ragStatus: 'DUE',
          checklist: checklist || [],
        }
      });

      return NextResponse.json({ success: true, data: newAudit });
    }

    return NextResponse.json({ success: false, error: 'Invalid action type' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/quality-assurance/audits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process audit request', details: error.message },
      { status: 500 }
    );
  }
}
