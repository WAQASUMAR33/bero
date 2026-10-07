import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const howRaised = searchParams.get('howRaised');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where = {};
    if (type && type !== 'all') where.type = type;
    if (status && status !== 'all') where.status = status;
    if (role && role !== 'all') where.role = role;
    if (howRaised && howRaised !== 'all') where.howRaised = howRaised;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const entries = await prisma.qualityAssurance.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Bero Quality Assurance';
    wb.lastModifiedBy = 'Bero Quality Assurance';
    wb.created = new Date();
    wb.modified = new Date();

    // ----------------------------------------------------
    // Sheet 1: You Said, We Did
    // ----------------------------------------------------
    const wsMain = wb.addWorksheet('You Said, We Did', {
      views: [{ showGridLines: true }]
    });

    wsMain.columns = [
      { header: 'Date', key: 'date', width: 16 },
      { header: 'Person', key: 'person', width: 28 },
      { header: 'Role', key: 'role', width: 32 },
      { header: 'How was this raised? ', key: 'howRaised', width: 36 },
      { header: 'You Said', key: 'youSaid', width: 48 },
      { header: 'We Did', key: 'weDid', width: 48 }
    ];

    // Header styling
    const headerRow = wsMain.getRow(1);
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF17387A' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD0E0E3' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'medium', color: { argb: 'FF17387A' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } }
      };
    });

    // Populate data rows
    entries.forEach((e, idx) => {
      const row = wsMain.getRow(idx + 2);
      row.height = 24;

      const dateVal = e.date ? new Date(e.date) : null;
      row.getCell(1).value = dateVal;
      row.getCell(1).numFmt = 'dd/mm/yyyy';

      row.getCell(2).value = e.person || e.from || '';
      row.getCell(3).value = e.role || '';
      row.getCell(4).value = e.howRaised || '';
      row.getCell(5).value = e.youSaid || '';
      row.getCell(6).value = e.weDid || '';

      for (let c = 1; c <= 6; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Arial', size: 10, color: { argb: 'FF1E293B' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: (c >= 5) };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }
    });

    // Add remaining formatted blank rows up to at least row 50
    const startBlank = entries.length + 2;
    const endBlank = Math.max(startBlank + 20, 50);
    for (let r = startBlank; r <= endBlank; r++) {
      const row = wsMain.getRow(r);
      row.height = 22;
      for (let c = 1; c <= 6; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Arial', size: 10, color: { argb: 'FF1E293B' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: (c >= 5) };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        if (c === 1) cell.numFmt = 'dd/mm/yyyy';
      }
    }

    // ----------------------------------------------------
    // Sheet 2: Lists
    // ----------------------------------------------------
    const wsLists = wb.addWorksheet('Lists', {
      views: [{ showGridLines: true }]
    });

    wsLists.columns = [
      { header: 'Role (Person Category)', key: 'role', width: 34 },
      { header: 'How was this raised? (Channel / Method)', key: 'howRaised', width: 42 },
      { header: 'Instructions: How to add to this list', key: 'notes', width: 55 }
    ];

    const listHeaderRow = wsLists.getRow(1);
    listHeaderRow.height = 26;
    listHeaderRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF224FA6' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF17387A' } },
        left: { style: 'thin', color: { argb: 'FF17387A' } },
        bottom: { style: 'medium', color: { argb: 'FF0F234B' } },
        right: { style: 'thin', color: { argb: 'FF17387A' } }
      };
    });

    const roles = [
      'Service User / Resident',
      'Relative / Family Member',
      'Staff / Care Worker',
      'Professional / Social Worker',
      'GP / Healthcare Professional',
      'Advocate',
      'Visitor / Volunteer',
      'Other'
    ];

    roles.forEach((role, idx) => {
      const row = wsLists.getRow(idx + 2);
      const cell = row.getCell(1);
      cell.value = role;
      cell.font = { name: 'Arial', size: 10 };
      cell.border = {
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });

    const howRaisedChannels = [
      'Residents Meeting / House Meeting',
      'Family Meeting / Relative Visit',
      '1:1 Review / Keyworker Session',
      'Verbal / In-Person Conversation',
      'Survey / Feedback Questionnaire',
      'Suggestion Box',
      'Phone Call',
      'Email / Written Letter',
      'Care Plan / Support Plan Review',
      'Staff Meeting',
      'Supervision / Appraisal',
      'Complaint / Formal Grievance',
      'Compliment',
      'General Comment / Concern',
      'Healthcare Professional / MDT Meeting',
      'Audit / Inspection Feedback',
      'Other'
    ];

    howRaisedChannels.forEach((channel, idx) => {
      const row = wsLists.getRow(idx + 2);
      const cell = row.getCell(2);
      cell.value = channel;
      cell.font = { name: 'Arial', size: 10 };
      cell.border = {
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });

    const instructions = [
      'HOW TO ADD MORE OPTIONS TO THE DROPDOWN LIST:',
      '1. Simply type your new option below the existing items in Column B (for "How was this raised?") or Column A (for "Role").',
      '2. The dropdown on the "You Said, We Did" sheet is linked to this list and will automatically include your new option!',
      '3. You can also edit or rename any item here to suit your service needs.',
      '',
      'Note: Rows 2 to 50 are pre-configured to link directly into the dropdown list.'
    ];

    instructions.forEach((line, idx) => {
      const row = wsLists.getRow(idx + 2);
      const cell = row.getCell(3);
      cell.value = line;
      cell.font = {
        name: 'Arial',
        size: 9.5,
        bold: idx === 0,
        italic: idx > 4,
        color: { argb: idx === 0 ? 'FF17387A' : 'FF475569' }
      };
    });

    for (let r = Math.max(roles.length, howRaisedChannels.length) + 2; r <= 50; r++) {
      const row = wsLists.getRow(r);
      for (let c = 1; c <= 2; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Arial', size: 10 };
        cell.border = {
          left: { style: 'thin', color: { argb: 'FFF1F5F9' } },
          right: { style: 'thin', color: { argb: 'FFF1F5F9' } },
          bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } }
        };
      }
    }

    // Defined Names
    wb.definedNames.add('Lists!$A$2:$A$30', 'RoleList');
    wb.definedNames.add('Lists!$B$2:$B$50', 'HowRaisedList');

    const totalRowsValidation = Math.max(endBlank, 100);
    for (let r = 2; r <= totalRowsValidation; r++) {
      wsMain.getCell(`C${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['RoleList'],
        showErrorMessage: true,
        errorTitle: 'Invalid Role',
        error: 'Please choose a role from the dropdown list or add a new one in the Lists tab.'
      };

      wsMain.getCell(`D${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['HowRaisedList'],
        showErrorMessage: true,
        errorTitle: 'Invalid Channel',
        error: 'Please select a channel from the dropdown list or add a new one in the Lists tab.'
      };
    }

    const buffer = await wb.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="You_Said_We_Did_Register_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Error generating Excel file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate Excel export', details: error.message },
      { status: 500 }
    );
  }
}
