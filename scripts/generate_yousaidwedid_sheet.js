const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function generateSheet() {
  const filePath = path.resolve(__dirname, '../sheets/You Said, We Did.xlsx');
  
  // Backup existing file first if it exists
  if (fs.existsSync(filePath)) {
    const backupPath = path.resolve(__dirname, '../sheets/You Said, We Did.backup.xlsx');
    fs.copyFileSync(filePath, backupPath);
    console.log('Created backup at:', backupPath);
  }

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

  // Columns definition
  wsMain.columns = [
    { header: 'Date', key: 'date', width: 16 },
    { header: 'Person', key: 'person', width: 28 },
    { header: 'Role', key: 'role', width: 32 },
    { header: 'How was this raised? ', key: 'howRaised', width: 36 },
    { header: 'You Said', key: 'youSaid', width: 48 },
    { header: 'We Did', key: 'weDid', width: 48 }
  ];

  // Header styling (Row 1)
  const headerRow = wsMain.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF17387A' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD0E0E3' } // Preserves the exact original pale cyan/blue fill
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF17387A' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  });

  // Prepare standard rows 2 to 100 with formatting & borders
  for (let r = 2; r <= 100; r++) {
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
      if (c === 1) {
        cell.numFmt = 'dd/mm/yyyy';
      }
    }
  }

  // ----------------------------------------------------
  // Sheet 2: Lists (Dropdown reference sheet)
  // ----------------------------------------------------
  const wsLists = wb.addWorksheet('Lists', {
    views: [{ showGridLines: true }]
  });

  wsLists.columns = [
    { header: 'Role (Person Category)', key: 'role', width: 34 },
    { header: 'How was this raised? (Channel / Method)', key: 'howRaised', width: 42 },
    { header: 'Instructions: How to add to this list', key: 'notes', width: 55 }
  ];

  // Header styling for Lists
  const listHeaderRow = wsLists.getRow(1);
  listHeaderRow.height = 26;
  listHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF224FA6' } // Brand blue
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF17387A' } },
      left: { style: 'thin', color: { argb: 'FF17387A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F234B' } },
      right: { style: 'thin', color: { argb: 'FF17387A' } }
    };
  });

  // Pre-populate Role options in Column A
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

  // Pre-populate comprehensive "How was this raised?" channels in Column B
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

  // Add helpful guidance in Column C
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

  // Format blank expandable rows up to row 50 on Lists sheet so borders look neat
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

  // ----------------------------------------------------
  // Defined Names & Data Validation
  // ----------------------------------------------------
  // Named ranges allow universal compatibility across Excel, Google Sheets, LibreOffice
  wb.definedNames.add('Lists!$A$2:$A$30', 'RoleList');
  wb.definedNames.add('Lists!$B$2:$B$50', 'HowRaisedList');

  // Apply validations to Main Sheet rows 2 through 500
  for (let r = 2; r <= 500; r++) {
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

  await wb.xlsx.writeFile(filePath);
  console.log('Successfully generated updated sheet at:', filePath);
}

generateSheet().catch(err => {
  console.error('Error generating sheet:', err);
  process.exit(1);
});
