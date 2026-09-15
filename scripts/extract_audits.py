import os
import json
import zipfile
import xml.etree.ElementTree as ET

audits_dir = 'Beerusys/Audits'

file_mapping = {
    '72 hour Admission': '72 Hour Admission Audit_.xlsx',
    'Accidents and Incidents': 'Accident_Incident_Near Miss Audit.xlsx',
    'COSHH': 'COSHH Audit_.xlsx',
    'CQC': 'CQC Audit.xlsx',
    'Complaints and Compliments': 'Complaints and Compliments Audit.xlsx',
    'Dignity': 'Dignity Audit.xlsx',
    'Financial': 'Financial Audit.xlsx',
    'Fire Safety': 'Fire Safety Audit.xlsx',
    'First Impressions': 'First Impressions Audit_.xlsx',
    'GDPR': 'GDPR Audit.xlsx',
    'Hand Wash': 'Hand Wash Audit.xlsx',
    'IPC': 'IPC Audit.xlsx',
    'DoLS and MCA': 'MCA and DoLS Audit.xlsx',
    'Medication': 'Medication Audit.xlsx',
    'RIDDOR': 'RIDDOR Audit.xlsx',
    'Service Checks': 'Service Check Audit.xlsx',
    'Staff Files': 'Staff File Audit.xlsx',
    'Subject Access Request': 'Subject Access Request Audit.xlsx',
    'Support Plan': 'Support Plan Audit_.xlsx',
}

matrix_meta = [
    {'title': 'Support Plan Audit', 'category': 'Care Quality', 'location': 'Head Office', 'frequency': 'Monthly', 'targetScore': 90.0, 'key': 'Support Plan', 'comments': "Complete 10% of Service User's file per month"},
    {'title': 'Medication Administration Audit', 'category': 'Clinical and Medicines', 'location': 'All Locations', 'frequency': 'Monthly', 'targetScore': 95.0, 'key': 'Medication', 'comments': 'Review MAR charts, storage, records'},
    {'title': '72-Hour Admission Audit', 'category': 'Admissions and Transitions', 'location': 'All Locations', 'frequency': 'Ad Hoc', 'targetScore': 90.0, 'key': '72 hour Admission', 'comments': 'Complete within 72 hours of admission'},
    {'title': 'Infection Prevention and Control (IPC) Audit', 'category': 'Clinical Governance', 'location': 'All Locations', 'frequency': 'Bi-Monthly', 'targetScore': 95.0, 'key': 'IPC', 'comments': 'PPE, hand hygiene, cleanliness'},
    {'title': 'First Impressions and Environment Audit', 'category': 'Safety and Environment', 'location': 'All Locations', 'frequency': 'Monthly', 'targetScore': 90.0, 'key': 'First Impressions', 'comments': 'External and entrance presentation'},
    {'title': 'Staff Files and Compliance Audit', 'category': 'HR and Workforce', 'location': 'Head Office', 'frequency': 'Monthly', 'targetScore': 90.0, 'key': 'Staff Files', 'comments': "Complete 10% of Staff's file per month"},
    {'title': 'GDPR and Data Protection Audit', 'category': 'Governance and Compliance', 'location': 'Head Office', 'frequency': 'Bi-Monthly', 'targetScore': 90.0, 'key': 'GDPR', 'comments': 'Data security, consent, storage'},
    {'title': 'Safeguarding Audit', 'category': 'Governance and Compliance', 'location': 'Head Office', 'frequency': 'Monthly', 'targetScore': 95.0, 'key': 'Safeguarding', 'comments': 'Safeguarding records, referrals, training'},
    {'title': 'CQC Fundamental Standards Audit', 'category': 'Quality and Compliance', 'location': 'Head Office', 'frequency': 'Monthly', 'targetScore': 90.0, 'key': 'CQC', 'comments': 'KLOE alignment and CQC evidence'},
    {'title': 'Dignity in Care Audit', 'category': 'Care Quality', 'location': 'All Locations', 'frequency': 'Monthly', 'targetScore': 90.0, 'key': 'Dignity', 'comments': 'Privacy, choice, dignity observations'},
    {'title': 'Subject Access Request Audit', 'category': 'Governance and Compliance', 'location': 'Head Office', 'frequency': 'Quarterly', 'targetScore': 90.0, 'key': 'Subject Access Request', 'comments': 'SAR compliance and response timings'},
    {'title': 'Hand Wash Competency Audit', 'category': 'Clinical Governance', 'location': 'Rotates', 'frequency': 'Quarterly', 'targetScore': 95.0, 'key': 'Hand Wash', 'comments': 'All staff completed annually'},
    {'title': 'Fire Safety Audit', 'category': 'Safety and Environment', 'location': 'All Locations', 'frequency': 'Monthly', 'targetScore': 95.0, 'key': 'Fire Safety', 'comments': 'Alarms, escapes, drills, extinguishers'},
    {'title': 'Accidents, Incidents and Near Misses Audit', 'category': 'Governance and Compliance', 'location': 'Head Office', 'frequency': 'Monthly', 'targetScore': 90.0, 'key': 'Accidents and Incidents', 'comments': 'RCA, trends, lessons learned'},
    {'title': 'Complaints and Compliments Audit', 'category': 'Quality and Compliance', 'location': 'Head Office', 'frequency': 'Bi-Annual', 'targetScore': 90.0, 'key': 'Complaints and Compliments', 'comments': 'Investigation, responses, improvements'},
    {'title': 'RIDDOR Compliance Audit', 'category': 'Governance and Compliance', 'location': 'Head Office', 'frequency': 'Quarterly', 'targetScore': 90.0, 'key': 'RIDDOR', 'comments': 'Statutory notifications and follow-up'},
    {'title': 'MCA and DoLS Audit', 'category': 'Care Quality', 'location': 'Head Office', 'frequency': 'Bi-Monthly', 'targetScore': 90.0, 'key': 'DoLS and MCA', 'comments': 'Mental Capacity Assessments and Best Interest'},
    {'title': 'Service Checks Audit', 'category': 'Care Quality', 'location': 'All Locations', 'frequency': 'Monthly', 'targetScore': 90.0, 'key': 'Service Checks', 'comments': 'Routine quality service checks'},
    {'title': 'Financial Management Audit', 'category': 'Governance and Compliance', 'location': 'Head Office', 'frequency': 'Monthly', 'targetScore': 95.0, 'key': 'Financial', 'comments': 'Service user money, receipts, transactions'},
    {'title': 'COSHH Audit', 'category': 'Safety and Environment', 'location': 'All Locations', 'frequency': 'Monthly', 'targetScore': 90.0, 'key': 'COSHH', 'comments': 'Chemical safety data sheets, storage, PPE'},
]

def parse_audit_questions(xlsx_path):
    z = zipfile.ZipFile(xlsx_path)
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        s_tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in s_tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
            t = ''.join([node.text for node in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if node.text])
            shared_strings.append(t)
            
    sh_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    rows = []
    for row in sh_tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
        row_vals = {}
        for c in row.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
            r_ref = c.attrib.get('r', '')
            col_letter = ''.join([ch for ch in r_ref if ch.isalpha()])
            t = c.attrib.get('t')
            v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
            val = v.text if v is not None else ''
            if t == 's' and val.isdigit():
                val = shared_strings[int(val)]
            row_vals[col_letter] = val
        rows.append(row_vals)
        
    questions = []
    for idx, r in enumerate(rows):
        q_num = r.get('A', '').strip()
        q_text = r.get('B', '').strip()
        if q_num and any(c.isdigit() for c in q_num) and q_text:
            questions.append({'id': f'q_{len(questions)+1}', 'number': q_num, 'text': q_text})
        elif not q_num and q_text and len(q_text) > 15 and not q_text.lower().startswith('question') and not q_text.lower().startswith('score'):
            questions.append({'id': f'q_{len(questions)+1}', 'number': f'{len(questions)+1}.0', 'text': q_text})
    return questions

os.makedirs('src/data', exist_ok=True)
all_templates = []
for item in matrix_meta:
    fname = file_mapping.get(item['key'])
    questions = []
    if fname:
        fpath = os.path.join(audits_dir, fname)
        if os.path.exists(fpath):
            questions = parse_audit_questions(fpath)
    if item['key'] == 'Safeguarding' and len(questions) == 0:
        questions = [
            {'id': 'q_1', 'number': '1.0', 'text': 'Safeguarding Policy is up-to-date and compliant with local authority multi-agency procedures.'},
            {'id': 'q_2', 'number': '2.0', 'text': 'All staff have completed mandatory Safeguarding Adults Level 2/3 training within the last 12 months.'},
            {'id': 'q_3', 'number': '3.0', 'text': 'Safeguarding lead contact details and whistleblowing procedure are visibly displayed in all services.'},
            {'id': 'q_4', 'number': '4.0', 'text': 'All safeguarding concerns and alerts are logged immediately in the central safeguarding tracker.'},
            {'id': 'q_5', 'number': '5.0', 'text': 'CQC statutory notifications (Regulation 18) submitted within 24 hours for all reportable incidents.'},
            {'id': 'q_6', 'number': '6.0', 'text': 'Root cause analysis (RCA) and internal investigations completed for all closed safeguarding cases.'},
            {'id': 'q_7', 'number': '7.0', 'text': 'Service user risk assessments and care plans updated following safeguarding investigations.'},
            {'id': 'q_8', 'number': '8.0', 'text': 'Lessons learned from safeguarding reviews are disseminated to all support workers during team meetings.'}
        ]
    print(f"{item['title']}: {len(questions)} questions extracted")
    all_templates.append({
        'title': item['title'],
        'category': item['category'],
        'location': item['location'],
        'frequency': item['frequency'],
        'targetScore': item['targetScore'],
        'description': item['comments'],
        'comments': item['comments'],
        'checklist': questions
    })

with open('src/data/qaAuditTemplates.json', 'w', encoding='utf-8') as f:
    json.dump(all_templates, f, indent=2, ensure_ascii=False)

print('Successfully created src/data/qaAuditTemplates.json!')
