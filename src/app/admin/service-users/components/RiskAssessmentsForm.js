'use client';

import { useEffect, useMemo, useState } from 'react';
import { getEvaluationStatus, getCategoryOverallStatus } from '@/lib/evaluationStatus';

const assessmentCategories = [
  { key: 'Generic Risk Assessment', title: 'Generic Risk' },
  { key: 'Falls Risk Assessment', title: 'Falls Risk' },
  { key: 'Falls Incident Log', title: 'Falls Incident Log' },
  { key: 'Falls Risk Action Plan', title: 'Falls Action Plan' },
  { key: 'Moving and Handling Risk Assessment', title: 'Moving & Handling' },
  { key: 'Personal Emergency Evacuation Plan (PEEP)', title: 'PEEP' },
  { key: 'Choking Risk Assessment', title: 'Choking Risk' },
  { key: 'Nutrition Screening Assessment', title: 'Nutrition / MUST' },
  { key: 'WATERLOW Assessment', title: 'WATERLOW Pressure Ulcer' },
  { key: 'Body Map and Skin Assessment', title: 'Body Map & Skin' },
  { key: 'Continence Assessment', title: 'Continence' },
  { key: 'Sleep Assessment', title: 'Sleep Assessment' },
  { key: 'Religion and Culture Assessment', title: 'Religion & Culture' },
  { key: 'Sexuality and Gender Assessment', title: 'Sexuality & Gender' },
  { key: 'Education Form', title: 'Education' },
  { key: 'Employment Form', title: 'Employment' },
  { key: 'Personal Care Assessment', title: 'Personal Care' },
  { key: 'Assessment of Behavioural Expression of Need', title: 'Positive Behaviour (PBS)' },
  { key: 'Self-Administration of Medication Risk Assessment', title: 'Medication Self-Admin' },
  { key: 'Protocol for PRN Medication', title: 'PRN Protocol' },
  { key: 'Abbey Pain Scale', title: 'Abbey Pain Scale' },
  { key: 'Capacity Assessment Form (MCA)', title: 'MCA Assessment' },
  { key: 'Best Interests Decision-making Form', title: 'Best Interests' },
  { key: 'Finance and Assets Risk Assessment', title: 'Finance & Assets' },
  { key: 'Communication Assessment', title: 'Communication' },
  { key: 'Pre-Admission Assessment', title: 'Pre-Admission' },
];

const chokingOptions = [
  'Weak or ineffectual cough; inability to clear throat',
  'Difficulty in swallowing',
  'Known to aspirate',
  'Frequent chest infections',
  'Poor physical state either as a result of condition or a health problem',
  'A diagnosis of epilepsy',
  'A diagnosis of cerebral Palsy',
  'Severe and enduring mental health problems',
  'Confusion/disorientation',
  'Poor head control',
  'Poor posture',
  'Tendency to tongue thrust',
  'Breathing difficulties',
  'Has previously required urgent attention due to choking when eating or drinking',
  'Feeds self independently and safely',
  'Feeds self independently and safely with supervision',
  'Tendency to take food from others if not supervised',
  'Tendency to take food from fruit bowl/cupboards if not supervised and be unsafe',
  'Drinks independently and safely',
  'Eats rapidly',
  'Drinks rapidly',
  'Requires assistance with food cutting or preparing prior to consuming',
  'Will overload mouth with food/drink',
  'Will store food and drink in mouth',
  'Will swallow food without chewing',
  'Will continue to eat whilst coughing',
  'Will continue to drink whilst coughing',
  'Eats safely with dentures/without dentures/without teeth',
  'Will accept/put any item into mouth',
  'Will accept/put any item into mouth and swallow',
  'Is prescribed a modified consistency diet',
  'Requires thickened fluids',
  'Requires specialist feeding aids to reduce the risk of choking',
  'Requires specialist drinking aids to reduce the risk of choking'
];

export default function RiskAssessmentsForm({ serviceSeekerId, serviceUserName, onNotification }) {
  const [activeTab, setActiveTab] = useState('Generic Risk Assessment');
  const [tabSearch, setTabSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [allAssessments, setAllAssessments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);

  const [staff, setStaff] = useState([]);
  const [teams, setTeams] = useState([]);

  const [formData, setFormData] = useState({});
  const [newEvalDate, setNewEvalDate] = useState('');
  const [newEvaluatorName, setNewEvaluatorName] = useState('');
  const [newEvalRecord, setNewEvalRecord] = useState('');
  const [savingEval, setSavingEval] = useState(false);

  useEffect(() => {
    fetchRows(activeTab);
  }, [serviceSeekerId, activeTab]);

  useEffect(() => {
    fetchAllAssessments();
  }, [serviceSeekerId]);

  useEffect(() => {
    fetchStaff();
    fetchTeams();
  }, []);

  const fetchAllAssessments = async () => {
    if (!serviceSeekerId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/risk-assessments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAllAssessments(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStaff(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setTeams(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRows = async (riskType) => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = `/api/service-seekers/${serviceSeekerId}/risk-assessments${riskType ? `?riskType=${encodeURIComponent(riskType)}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setRows(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (s) => {
    if (!s) return '-';
    try {
      const d = new Date(s);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return s || '-';
    }
  };

  const openAdd = () => {
    setFormData({
      lastAssessed: new Date().toISOString().split('T')[0],
      reviewFrequency: 'Every six months or 26 weeks',
      riskLevel: 'Low',
      extra: {},
      staffTeam: [],
      sendSignoffs: false,
      evaluationDate: new Date().toISOString().split('T')[0],
      evaluatorName: '',
      evaluationRecord: '',
    });
    setShowModal(true);
  };

  const openView = (record) => {
    setViewRecord(record);
    setNewEvalDate(new Date().toISOString().split('T')[0]);
    setNewEvaluatorName(record.conductedBy || '');
    setNewEvalRecord('');
  };

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');

      // Pack custom fields into extra, excluding temporary evaluation inputs
      const standardKeys = [
        'lastAssessed', 'reviewFrequency', 'whatIsRisk', 'riskBeforeIntervention',
        'whoIsAtRisk', 'isHistorical', 'whatCouldHappen', 'actionToTake',
        'riskAfterControls', 'summary', 'riskLevel', 'totalScore',
        'staffTeam', 'conductedBy', 'office', 'sendSignoffs',
        'evaluationDate', 'evaluatorName', 'evaluationRecord'
      ];

      const extraData = { ...(formData.extra || {}) };
      Object.keys(formData).forEach(k => {
        if (!standardKeys.includes(k) && k !== 'extra') {
          extraData[k] = formData[k];
        }
      });

      // Handle initial evaluation if filled
      const hasEval = formData.evaluationRecord?.trim() || formData.evaluatorName?.trim();
      const initialEvaluations = hasEval ? [{
        id: `eval_${Date.now()}`,
        date: formData.evaluationDate || formData.lastAssessed || new Date().toISOString().split('T')[0],
        evaluatorName: formData.evaluatorName?.trim() || formData.conductedBy || 'Staff',
        record: formData.evaluationRecord?.trim() || '',
        createdAt: new Date().toISOString(),
      }] : [];

      extraData.evaluations = initialEvaluations;

      const payload = {
        riskType: activeTab,
        lastAssessed: formData.lastAssessed || null,
        reviewFrequency: formData.reviewFrequency || null,
        whatIsRisk: formData.whatIsRisk || formData.summary || activeTab,
        riskBeforeIntervention: formData.riskBeforeIntervention || null,
        whoIsAtRisk: formData.whoIsAtRisk || 'Service User',
        isHistorical: formData.isHistorical || 'No',
        whatCouldHappen: formData.whatCouldHappen || null,
        actionToTake: formData.actionToTake || null,
        riskAfterControls: formData.riskAfterControls || null,
        summary: formData.summary || null,
        riskLevel: formData.riskLevel || 'Low',
        totalScore: formData.totalScore ? String(formData.totalScore) : null,
        staffTeam: formData.staffTeam || [],
        conductedBy: formData.conductedBy || null,
        office: formData.office || null,
        sendSignoffs: !!formData.sendSignoffs,
        extra: extraData,
      };

      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/risk-assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchRows(activeTab);
        await fetchAllAssessments();
        setShowModal(false);
        if (onNotification) onNotification({ show: true, message: `${activeTab} saved successfully.`, type: 'success' });
      } else {
        const err = await res.json();
        if (onNotification) onNotification({ show: true, message: err.error || 'Failed to save assessment.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification) onNotification({ show: true, message: 'Failed to save assessment.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddEvaluation = async () => {
    if (!viewRecord) return;
    if (!newEvalRecord.trim()) {
      if (onNotification) onNotification({ show: true, message: 'Please enter an evaluation record.', type: 'error' });
      return;
    }
    setSavingEval(true);
    try {
      const token = localStorage.getItem('token');
      const existingEvaluations = Array.isArray(viewRecord.extra?.evaluations) ? viewRecord.extra.evaluations : [];
      const newEval = {
        id: `eval_${Date.now()}`,
        date: newEvalDate || new Date().toISOString().split('T')[0],
        evaluatorName: newEvaluatorName.trim() || viewRecord.conductedBy || 'Staff',
        record: newEvalRecord.trim(),
        createdAt: new Date().toISOString(),
      };
      const updatedEvaluations = [...existingEvaluations, newEval];
      const updatedExtra = { ...(viewRecord.extra || {}), evaluations: updatedEvaluations };

      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/risk-assessments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: viewRecord.id, extra: updatedExtra })
      });

      if (res.ok) {
        const updatedRecord = { ...viewRecord, extra: updatedExtra, updatedAt: new Date().toISOString() };
        setViewRecord(updatedRecord);
        setRows(prev => prev.map(r => r.id === viewRecord.id ? updatedRecord : r));
        setAllAssessments(prev => prev.map(r => r.id === viewRecord.id ? updatedRecord : r));
        fetchAllAssessments();
        setNewEvalRecord('');
        setNewEvaluatorName(viewRecord.conductedBy || '');
        setNewEvalDate(new Date().toISOString().split('T')[0]);
        if (onNotification) onNotification({ show: true, message: 'Evaluation added successfully.', type: 'success' });
      } else {
        const err = await res.json();
        if (onNotification) onNotification({ show: true, message: err.error || 'Failed to add evaluation.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification) onNotification({ show: true, message: 'Failed to add evaluation.', type: 'error' });
    } finally {
      setSavingEval(false);
    }
  };

  const deleteRow = async (id) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/risk-assessments?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchRows(activeTab);
        await fetchAllAssessments();
        if (onNotification) onNotification({ show: true, message: 'Deleted.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification) onNotification({ show: true, message: 'Delete failed.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const assessmentRecordsMap = useMemo(() => {
    const map = {};
    allAssessments.forEach(item => {
      if (!map[item.riskType]) map[item.riskType] = [];
      map[item.riskType].push(item);
    });
    return map;
  }, [allAssessments]);

  const categoryStatusMap = useMemo(() => {
    const map = {};
    assessmentCategories.forEach(c => {
      const catRecords = assessmentRecordsMap[c.key] || [];
      map[c.key] = getCategoryOverallStatus(catRecords);
    });
    return map;
  }, [assessmentRecordsMap]);

  const statusCounts = useMemo(() => {
    let green = 0;
    let red = 0;
    let notCompleted = 0;
    assessmentCategories.forEach(c => {
      const st = categoryStatusMap[c.key]?.status;
      if (st === 'GREEN') green++;
      else if (st === 'RED') red++;
      else notCompleted++;
    });
    return { all: assessmentCategories.length, green, red, notCompleted };
  }, [categoryStatusMap]);

  const filteredCategories = useMemo(() => {
    return assessmentCategories.filter(c => {
      const matchesSearch = !tabSearch.trim() || c.title.toLowerCase().includes(tabSearch.toLowerCase()) || c.key.toLowerCase().includes(tabSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === 'ALL') return true;
      const catStatus = categoryStatusMap[c.key]?.status;
      return catStatus === statusFilter;
    });
  }, [tabSearch, statusFilter, categoryStatusMap]);

  // Dynamic field definitions for active assessment tab
  const getFieldsForActiveTab = () => {
    switch (activeTab) {
      case 'Falls Risk Assessment':
        return [
          { section: 'History & Risk Factors' },
          { key: 'fallsHistory', label: 'History of falls in last 12 months:', type: 'select', options: ['None', '1 fall', '2-3 falls', 'Frequent (>3)'] },
          { key: 'fallsCircumstances', label: 'Previous fall circumstances & injuries:' },
          { key: 'mobilityStatus', label: 'Mobility & balance condition:', type: 'select', options: ['Fully independent', 'Independent with walking aid', 'Requires 1 carer assistance', 'Requires 2 carers / hoist', 'Bedbound'] },
          { key: 'cognitiveStatus', label: 'Mental state / Confusion:', type: 'select', options: ['Orientated / No impairment', 'Mild confusion', 'Intermittent confusion / delirium', 'Severely confused / advanced dementia'] },
          { key: 'sensoryImpairment', label: 'Sensory deficit (Vision / Hearing):' },
          { key: 'medicationFactor', label: 'Sedatives, antihypertensives or high-risk meds taken:' },
          { section: 'Environment & Controls' },
          { key: 'environmentalRisks', label: 'Environmental hazards identified (lighting, rugs, clutter):' },
          { key: 'actionToTake', label: 'Control measures & fall prevention plan:' },
          { key: 'riskLevel', label: 'Overall Falls Risk Level:', type: 'select', options: ['Low', 'Medium', 'High'] },
          { key: 'totalScore', label: 'Risk Score (optional):', type: 'text' },
        ];

      case 'Falls Incident Log':
        return [
          { section: 'Incident Details' },
          { key: 'incidentDate', label: 'Date and Time of Fall:', type: 'datetime-local' },
          { key: 'locationOfFall', label: 'Exact location of fall (e.g. bedroom, bathroom, stairs):' },
          { key: 'witnesses', label: 'Witnesses present:' },
          { key: 'apparentCause', label: 'Apparent cause or trigger of fall:' },
          { section: 'Assessment & Outcome' },
          { key: 'injuriesSustained', label: 'Injuries sustained (bruises, cuts, head impact):' },
          { key: 'medicalAttention', label: 'Medical attention sought? (GP / 111 / 999 / A&E):', type: 'select', options: ['None needed', 'First Aid administered', 'GP contacted', 'Paramedics called', 'Hospital admission'] },
          { key: 'nextOfKinInformed', label: 'Next of kin / family informed?:', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { key: 'preventiveAction', label: 'Action taken to prevent reoccurrence:' },
        ];

      case 'Falls Risk Action Plan':
        return [
          { section: 'Action Plan Details' },
          { key: 'identifiedRiskFactors', label: 'Summary of identified fall risk factors:' },
          { key: 'goalsObjectives', label: 'Fall reduction objectives:' },
          { key: 'preventativeActions', label: 'Preventative actions to be taken by staff:' },
          { key: 'equipmentProvided', label: 'Aids / Equipment provided (sensor mat, bed rails, walking frame):' },
          { key: 'referralsMade', label: 'Referrals made (Physiotherapist, OT, Falls Clinic):' },
          { key: 'reviewDate', label: 'Target Review Date:', type: 'date' },
        ];

      case 'Moving and Handling Risk Assessment':
        return [
          { section: 'Moving & Handling Profile' },
          { key: 'weightBearing', label: 'Weight bearing ability:', type: 'select', options: ['Fully weight bearing', 'Partial weight bearing', 'Non-weight bearing'] },
          { key: 'transfersAbility', label: 'Transfer ability (Bed, Chair, Toilet, Bath):' },
          { key: 'staffRequired', label: 'Number of staff required for transfers:', type: 'select', options: ['1 Carer', '2 Carers', '3+ Carers'] },
          { key: 'equipmentUsed', label: 'Equipment used (Hoist, Sling type, Rotunda, Slide sheets):' },
          { key: 'slingTypeSize', label: 'Specific sling model and size:' },
          { section: 'Risk Reduction' },
          { key: 'handlingInstructions', label: 'Step-by-step moving and handling instructions for carers:' },
          { key: 'serviceUserCooperation', label: 'Service user level of cooperation / involuntary movements:' },
          { key: 'riskLevel', label: 'Risk Level:', type: 'select', options: ['Low', 'Medium', 'High'] },
        ];

      case 'Personal Emergency Evacuation Plan (PEEP)':
        return [
          { section: 'Emergency Evacuation (PEEP)' },
          { key: 'evacuationCapability', label: 'Evacuation capability:', type: 'select', options: ['Independent evacuation', 'Requires verbal prompts/guidance', 'Requires 1:1 physical assistance', 'Requires equipment (Evac-chair, Wheelchair)'] },
          { key: 'hearingSightAids', label: 'Hearing / visual impairments during alarm:' },
          { key: 'mobilityImpairment', label: 'Specific mobility impairment affecting evacuation:' },
          { key: 'daytimeAssistance', label: 'Daytime assistance required:' },
          { key: 'nighttimeAssistance', label: 'Nighttime assistance required:' },
          { key: 'primaryEvacuationRoute', label: 'Designated primary escape route:' },
          { key: 'secondaryEscapeRoute', label: 'Secondary escape route:' },
          { key: 'safeRefugePoint', label: 'Safe refuge point (if applicable):' },
          { key: 'equipmentNeeded', label: 'Equipment needed for evacuation:' },
        ];

      case 'Choking Risk Assessment':
        return [
          { section: 'Choking Assessment' },
          { key: 'chokingHistory', label: 'History of choking / coughing when swallowing:' },
          { key: 'speechLanguageReferral', label: 'Speech & Language Therapy (SALT) assessment completed?:', type: 'select', options: ['Yes', 'No', 'Referred'] },
          { key: 'dietConsistency', label: 'Prescribed Food Consistency (IDDSI Level):', type: 'select', options: ['Level 7 - Regular', 'Level 6 - Soft & Bite-sized', 'Level 5 - Minced & Moist', 'Level 4 - Pureed', 'Level 3 - Liquidised'] },
          { key: 'fluidConsistency', label: 'Prescribed Fluid Consistency (IDDSI Level):', type: 'select', options: ['Level 0 - Thin', 'Level 1 - Slightly thick', 'Level 2 - Mildly thick', 'Level 3 - Moderately thick', 'Level 4 - Extremely thick'] },
          { key: 'supervisionLevel', label: 'Level of supervision required during meals:', type: 'select', options: ['Independent', 'Intermittent supervision', '1:1 continuous supervision'] },
          { key: 'chokingOptions', label: 'Check all observed choking risk indicators:', type: 'checkboxes', options: chokingOptions },
          { key: 'actionToTake', label: 'Emergency choking intervention protocol for carers:' },
          { key: 'riskLevel', label: 'Risk Level:', type: 'select', options: ['Low', 'Medium', 'High'] },
        ];

      case 'Nutrition Screening Assessment':
        return [
          { section: 'MUST & Nutrition Screening' },
          { key: 'currentWeight', label: 'Current Weight (kg):', type: 'text' },
          { key: 'currentHeight', label: 'Current Height (cm / m):', type: 'text' },
          { key: 'bmiScore', label: 'Calculated BMI & Score (0: >20, 1: 18.5-20, 2: <18.5):', type: 'text' },
          { key: 'weightLossPercent', label: 'Unplanned weight loss in past 3-6 months (%):', type: 'select', options: ['<5% (Score 0)', '5-10% (Score 1)', '>10% (Score 2)'] },
          { key: 'acuteDiseaseEffect', label: 'Acutely ill & no nutritional intake for >5 days? (Score 2):', type: 'select', options: ['No (0)', 'Yes (2)'] },
          { key: 'totalMustScore', label: 'Total MUST Score:', type: 'text' },
          { key: 'riskLevel', label: 'Nutritional Risk Category:', type: 'select', options: ['Low Risk (Score 0)', 'Medium Risk (Score 1)', 'High Risk (Score 2+)'] },
          { key: 'actionPlan', label: 'Nutritional action plan (dietician referral, food chart, supplements):' },
        ];

      case 'WATERLOW Assessment':
        return [
          { section: 'WATERLOW Pressure Ulcer Risk Assessment' },
          { key: 'buildWeight', label: 'Build / Weight for Height:', type: 'select', options: ['Average (0)', 'Above Average (1)', 'Obese (2)', 'Below Average (3)'] },
          { key: 'skinTypeRisk', label: 'Visual Skin Type / Risk Areas:', type: 'select', options: ['Healthy (0)', 'Tissue paper / thin (1)', 'Dry (1)', 'Oedematous (1)', 'Clammy / pyrexia (1)', 'Discoloured / Stage 1 (2)', 'Broken / Spots (3)'] },
          { key: 'sexAge', label: 'Sex and Age:', type: 'select', options: ['Male (1)', 'Female (2)', '14-49 (1)', '50-64 (2)', '65-74 (3)', '75-80 (4)', '81+ (5)'] },
          { key: 'mobilityScore', label: 'Mobility:', type: 'select', options: ['Fully (0)', 'Restless / fidgety (1)', 'Apathetic (2)', 'Restricted (3)', 'Bedbound (4)', 'Chairbound (5)'] },
          { key: 'continenceScore', label: 'Continence:', type: 'select', options: ['Complete / catheterised (0)', 'Occasional incontinence (1)', 'Catheter / Faeces (2)', 'Doubly incontinent (3)'] },
          { key: 'malnutritionScore', label: 'Nutritional Intake:', type: 'select', options: ['Average (0)', 'Poor (1)', 'Very poor / NG tube (2)', 'Anorexic (3)'] },
          { key: 'specialRisks', label: 'Special Risks (Tissue malnutrition, Major surgery, Neurological deficit):' },
          { key: 'totalScore', label: 'Total Waterlow Score:', type: 'text' },
          { key: 'riskLevel', label: 'Waterlow Risk Level:', type: 'select', options: ['10+ Risk', '15+ High Risk', '20+ Very High Risk'] },
          { key: 'actionToTake', label: 'Pressure care management & turning schedule:' },
        ];

      case 'Body Map and Skin Assessment':
        return [
          { section: 'Skin Condition & Marks' },
          { key: 'skinCondition', label: 'General skin condition (intact, dry, fragile, bruised):' },
          { key: 'woundOrMarkLocation', label: 'Location of marks / wounds / pressure sores (Head, Torso, Sacrum, Heels, etc.):' },
          { key: 'markType', label: 'Type of mark:', type: 'select', options: ['Bruise', 'Skin Tear', 'Pressure Ulcer Stage 1', 'Pressure Ulcer Stage 2', 'Pressure Ulcer Stage 3/4', 'Surgical Wound', 'Rash / Allergy', 'Other'] },
          { key: 'markDimensions', label: 'Size / Dimensions & Depth:' },
          { key: 'exudateOdour', label: 'Exudate / Discharge & Odour:' },
          { key: 'treatmentDressings', label: 'Prescribed dressings & barrier creams:' },
          { key: 'districtNurseInvolved', label: 'District Nurse involvement details:' },
        ];

      case 'Continence Assessment':
        return [
          { section: 'Continence Profile' },
          { key: 'bladderContinence', label: 'Bladder continence status:', type: 'select', options: ['Fully continent', 'Stress incontinence', 'Urge incontinence', 'Total urinary incontinence', 'Catheterised'] },
          { key: 'bowelContinence', label: 'Bowel continence status:', type: 'select', options: ['Fully continent', 'Occasional incontinence', 'Faecal incontinence', 'Prone to constipation', 'Stoma'] },
          { key: 'continenceAidsUsed', label: 'Continence aids used (Pads type/size, sheath, catheter, bed pads):' },
          { key: 'toiletingAssistance', label: 'Assistance needed with toileting (prompting, transfer, clothing):' },
          { key: 'bladderHistory', label: 'History of UTIs or aperient medication:' },
          { key: 'plannedOutcomes', label: 'Planned outcomes & hydration plan:' },
        ];

      case 'Sleep Assessment':
        return [
          { section: 'Sleep Routine & Preferences' },
          { key: 'bedTime', label: 'What time do you like to go to bed?:', type: 'text' },
          { key: 'wakeTime', label: 'What time do you like to get up?:', type: 'text' },
          { key: 'wakePreference', label: 'Do you prefer to be woken up or wake up naturally?:', type: 'select', options: ['Wake up naturally', 'Wake up with alarm / prompt', 'Call me at a specific time'] },
          { key: 'nightChecksConsent', label: 'Do you consent to being checked in the night (if required)?:', type: 'select', options: ['Yes', 'No', 'Only if necessary'] },
          { key: 'curtainsPreference', label: 'Do you prefer your curtains open or shut?:', type: 'select', options: ['Shut', 'Open', 'Partially open'] },
          { key: 'roomLighting', label: 'Do you like your room dark or with some light?:', type: 'select', options: ['Completely dark', 'Nightlight on', 'Hallway light on', 'Lamp on'] },
          { key: 'pillowsCount', label: 'How many pillows do you like?:', type: 'text' },
          { key: 'comfortItems', label: 'Comfort items to help you sleep (blanket, radio, hot water bottle):' },
          { key: 'sleepMedications', label: 'Do you take any medications that affect or help you to sleep?:' },
          { key: 'nightWakingNeeds', label: 'If you wake in the night, do you need anything to help you back to sleep?:' },
        ];

      case 'Religion and Culture Assessment':
        return [
          { section: 'Religious & Cultural Needs' },
          { key: 'religionPractice', label: 'What religion or spiritual practice do you follow (if any)?:' },
          { key: 'dailyRoutinesImpact', label: 'Does this have an impact on your daily routines (e.g. prayer times)?:' },
          { key: 'dietFluidImpact', label: 'Does this have an impact on your diet and fluid (e.g. Halal, Kosher, fasting)?:' },
          { key: 'personalCareImpact', label: 'Does this have an impact on your personal care needs (e.g. modesty, wash routines)?:' },
          { key: 'medicalInterventionsImpact', label: 'Does this have an impact on medical interventions (e.g. blood transfusions, pork gelatin)?:' },
          { key: 'celebrations', label: 'What celebrations or festivals do you participate in throughout the year?:' },
          { key: 'worshipPlaces', label: 'Do you like to visit a place of worship?:' },
          { key: 'importantPractices', label: 'Any other religious or spiritual practices carers need to support you with?:' },
        ];

      case 'Sexuality and Gender Assessment':
        return [
          { section: 'Gender Identity & Expression' },
          { key: 'genderIdentity', label: 'What gender do you identify as?:', type: 'select', options: ['Male', 'Female', 'Non-Binary', 'Other', 'Rather Not Say'] },
          { key: 'sameGenderBirth', label: 'Do you identify as the same gender you were assigned at birth?:', type: 'select', options: ['Yes', 'No', 'Other', 'Rather Not Say'] },
          { key: 'pronouns', label: 'What pronouns do you use?:', type: 'select', options: ['He / Him', 'She / Her', 'They / Them', 'Other', 'Rather Not Say'] },
          { key: 'prefixes', label: 'What prefix do you use?:', type: 'select', options: ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Mx', 'Other'] },
          { key: 'genderImportance', label: 'What is important to you in terms of your gender identity?:' },
          { section: 'Sexuality' },
          { key: 'sexuality', label: 'What sexuality do you identify as?:', type: 'select', options: ['Heterosexual', 'Gay / Lesbian', 'Bisexual', 'Other', 'Rather Not Say'] },
          { key: 'relationshipNeeds', label: 'Any relationship or intimacy support needs staff should respect and support?:' },
        ];

      case 'Education Form':
        return [
          { section: 'Education Details' },
          { key: 'educationPlace', label: 'Name and Address of place of Education:' },
          { key: 'officeContact', label: 'Main Office Contact Details:' },
          { key: 'allocatedSupportContact', label: 'Allocated education support name and contact details:' },
          { key: 'subjectStudied', label: 'What area / subjects are being studied:' },
          { key: 'attendanceDays', label: 'What days and times do they attend:' },
          { key: 'supportWorkerPresent', label: 'Do support workers need to be present?:', type: 'select', options: ['Yes', 'No', 'Part-time'] },
          { key: 'travelArrangements', label: 'Arrangements for travel to and from place of education:' },
          { key: 'mealArrangements', label: 'Arrangements for meals during education days:' },
          { key: 'echpInPlace', label: 'Is there an active EHCP (Education, Health and Care Plan) in place?:', type: 'select', options: ['Yes', 'No'] },
          { key: 'specialMeasures', label: 'Special measures or adaptations needed to maintain placement:' },
        ];

      case 'Employment Form':
        return [
          { section: 'Employment Details' },
          { key: 'employmentPlace', label: 'Name and Address of place of Employment:' },
          { key: 'officeContact', label: 'Main Office Contact Details:' },
          { key: 'lineManagerContact', label: 'Allocated line manager name and contact details:' },
          { key: 'jobRole', label: 'What is the Job Role:' },
          { key: 'attendanceSchedule', label: 'What days and hours do they work:' },
          { key: 'supportWorkerPresent', label: 'Do support workers need to be present at work?:', type: 'select', options: ['Yes', 'No', 'At start and finish only'] },
          { key: 'travelArrangements', label: 'Arrangements for travel to and from work:' },
          { key: 'mealArrangements', label: 'Arrangements for meals / lunch break:' },
          { key: 'workplaceAdjustments', label: 'Reasonable adjustments / adaptations in place at work:' },
          { key: 'otherServicesInvolved', label: 'Other services involved in supporting employment (e.g. Access to Work):' },
        ];

      case 'Personal Care Assessment':
        return [
          { section: 'Carer & Bathing Preferences' },
          { key: 'carerGenderPreference', label: 'Preference for gender of support worker for personal care:', type: 'select', options: ['Female', 'Male', 'No Preference'] },
          { key: 'bathOrShower', label: 'Do you prefer a bath or a shower?:', type: 'select', options: ['Shower', 'Bath', 'Strip wash', 'No Preference'] },
          { key: 'bathingFrequency', label: 'How often do you like to bathe / shower?:' },
          { key: 'shampooPreference', label: 'What type of shampoo / conditioner do you prefer?:' },
          { key: 'showerGelPreference', label: 'What type of shower gel / soap do you prefer?:' },
          { key: 'toiletriesResponsible', label: 'Who is responsible for ensuring you have enough toiletries?:' },
          { section: 'Grooming & Clothing' },
          { key: 'clothingStyle', label: 'What style of clothing do you like to wear?:' },
          { key: 'aftershavePerfume', label: 'Do you wear aftershave or perfume?:' },
          { key: 'hairStylingPreference', label: 'Hair styling / brushing preferences:' },
          { key: 'shavingPreferences', label: 'Shaving preferences (Wet shave, Electric, Beard trimmer, Carer assistance):' },
          { key: 'nailCarePreferences', label: 'Nail care preferences & assistance:' },
        ];

      case 'Assessment of Behavioural Expression of Need':
        return [
          { section: 'Positive Behaviour Support (PBS)' },
          { key: 'behaviourDescription', label: 'Description of behavioural expression (what does it look like?):' },
          { key: 'knownTriggers', label: 'Known triggers / antecedents (sensory, hunger, noise, pain, anxiety):' },
          { key: 'earlyWarningSigns', label: 'Early warning signs / agitation indicators:' },
          { key: 'deescalationStrategies', label: 'De-escalation strategies that work best (calm voice, space, distraction):' },
          { key: 'thingsToAvoid', label: 'What staff must NOT do (things that escalate behaviour):' },
          { key: 'postIncidentSupport', label: 'Post-incident recovery and emotional reassurance:' },
          { key: 'riskToSelfOthers', label: 'Risk to self, staff or public during behavioural distress:', type: 'select', options: ['Low', 'Medium', 'High'] },
          { key: 'controlMeasures', label: 'Control measures & safeguards in place:' },
        ];

      case 'Self-Administration of Medication Risk Assessment':
        return [
          { section: 'Medication Self-Administration' },
          { key: 'understandsMedication', label: 'Does the service user understand what each medication is for?:', type: 'select', options: ['Yes', 'Partially', 'No'] },
          { key: 'understandsDosage', label: 'Understands correct dosage, timing and frequency?:', type: 'select', options: ['Yes', 'Partially', 'No'] },
          { key: 'safeStorageCapability', label: 'Capable of keeping medications securely locked away?:', type: 'select', options: ['Yes', 'No'] },
          { key: 'dexterityCapability', label: 'Has physical dexterity to open bottles/blister packs safely?:', type: 'select', options: ['Yes', 'Requires aids/Dosette', 'No'] },
          { key: 'overdoseMisuseRisk', label: 'Any history or risk of overdose, missed doses or sharing medication?:', type: 'select', options: ['Low risk', 'Medium risk', 'High risk'] },
          { key: 'recommendedLevel', label: 'Recommended Level of Medication Support:', type: 'select', options: ['Level 1 - Self-administers independently', 'Level 2 - Staff prompt / open packaging', 'Level 3 - Staff fully administer'] },
          { key: 'reviewArrangements', label: 'Monitoring and review arrangements:' },
        ];

      case 'Protocol for PRN Medication':
        return [
          { section: 'PRN (When Required) Medication Protocol' },
          { key: 'medicationName', label: 'Medication Name, Strength and Form (e.g. Paracetamol 500mg tablets):' },
          { key: 'prescribedDose', label: 'Prescribed Dose (e.g. 1-2 tablets):' },
          { key: 'routeOfAdmin', label: 'Route of Administration (Oral, Inhalation, Topical, Sublingual):' },
          { key: 'frequencyMinInterval', label: 'Minimum interval between doses & Maximum dose in 24 hours:' },
          { key: 'specificIndications', label: 'Exact indications / symptoms when this medication should be given:' },
          { key: 'nonPharmaMeasures', label: 'Non-pharmacological measures to try BEFORE giving PRN:' },
          { key: 'expectedOutcome', label: 'Expected outcome & how soon it should take effect:' },
          { key: 'sideEffectsToWatch', label: 'Potential side effects to watch for & action if ineffective:' },
        ];

      case 'Abbey Pain Scale':
        return [
          { section: 'Abbey Pain Scale Assessment' },
          { key: 'vocalisationScore', label: '1. Vocalisation (whimpering, groaning, crying):', type: 'select', options: ['0 - Absent', '1 - Mild', '2 - Moderate', '3 - Severe'] },
          { key: 'facialExpressionScore', label: '2. Facial Expression (grimacing, frowning, looks frightened):', type: 'select', options: ['0 - Absent', '1 - Mild', '2 - Moderate', '3 - Severe'] },
          { key: 'bodyLanguageScore', label: '3. Change in body language (fidgeting, guarding, rocking, curled up):', type: 'select', options: ['0 - Absent', '1 - Mild', '2 - Moderate', '3 - Severe'] },
          { key: 'behaviouralChangeScore', label: '4. Behavioural change (increased confusion, refusing food, altered sleep):', type: 'select', options: ['0 - Absent', '1 - Mild', '2 - Moderate', '3 - Severe'] },
          { key: 'physiologicalScore', label: '5. Physiological change (temperature, pulse, blood pressure, sweating):', type: 'select', options: ['0 - Absent', '1 - Mild', '2 - Moderate', '3 - Severe'] },
          { key: 'physicalChangesScore', label: '6. Physical changes (skin tears, pressure areas, arthritis flare-up):', type: 'select', options: ['0 - Absent', '1 - Mild', '2 - Moderate', '3 - Severe'] },
          { key: 'totalScore', label: 'Total Pain Score (0-18):', type: 'text' },
          { key: 'riskLevel', label: 'Pain Category:', type: 'select', options: ['0-2 No pain', '3-7 Mild pain', '8-13 Moderate pain', '14+ Severe pain'] },
          { key: 'actionToTake', label: 'Pain relief administered & non-drug comfort provided:' },
        ];

      case 'Capacity Assessment Form (MCA)':
        return [
          { section: 'Mental Capacity Act (MCA) Assessment' },
          { key: 'decisionToBeMade', label: 'What is the specific decision to be made at this time?:' },
          { key: 'stage1Impairment', label: 'Stage 1: Is there an impairment or disturbance in mind/brain function?:', type: 'select', options: ['Yes', 'No'] },
          { key: 'stage1Details', label: 'Details of impairment (dementia, brain injury, delirium, severe distress):' },
          { section: 'Stage 2: Four Key Functional Tests' },
          { key: 'testUnderstand', label: '1. Can they understand the relevant information?:', type: 'select', options: ['Yes', 'No'] },
          { key: 'testRetain', label: '2. Can they retain the information long enough to decide?:', type: 'select', options: ['Yes', 'No'] },
          { key: 'testWeigh', label: '3. Can they weigh up / use information as part of decision?:', type: 'select', options: ['Yes', 'No'] },
          { key: 'testCommunicate', label: '4. Can they communicate their decision (verbally, signing, etc.)?:', type: 'select', options: ['Yes', 'No'] },
          { key: 'capacityConclusion', label: 'Conclusion: Does the person have capacity for this specific decision?:', type: 'select', options: ['Yes - Has capacity', 'No - Lacks capacity'] },
          { key: 'stepsTakenToSupport', label: 'All practicable steps taken to support decision making:' },
        ];

      case 'Best Interests Decision-making Form':
        return [
          { section: 'Best Interests Decision (MCA Section 4)' },
          { key: 'decisionRequired', label: 'What decision is required to be made in the person\'s best interests?:' },
          { key: 'pastAndPresentWishes', label: 'Person\'s past and present wishes and feelings regarding this decision:' },
          { key: 'beliefsAndValues', label: 'Beliefs and values that would be likely to influence their decision:' },
          { key: 'viewsConsulted', label: 'Views of family members, advocates, Power of Attorney or IMCA consulted:' },
          { key: 'lessRestrictiveOptions', label: 'Less restrictive alternative options considered:' },
          { key: 'decisionMade', label: 'Final Best Interests Decision reached:' },
          { key: 'decisionRationale', label: 'Rationale for why this decision is in the person\'s best interests:' },
        ];

      case 'Finance and Assets Risk Assessment':
        return [
          { section: 'Finance and Asset Security' },
          { key: 'financialCapacity', label: 'Does the service user have capacity to manage their own money?:', type: 'select', options: ['Yes', 'Partially (with support)', 'No (Power of Attorney / Appointee in place)'] },
          { key: 'appointeeDetails', label: 'Name and contact of Appointee / Financial Lasting Power of Attorney:' },
          { key: 'cashHandlingSupport', label: 'Do staff handle cash on behalf of the service user?:', type: 'select', options: ['Yes', 'No'] },
          { key: 'receiptBookInPlace', label: 'Is a double-signature transaction book and receipts kept?:', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { key: 'safeLocation', label: 'Where is cash / cards kept securely (e.g. locked tin in safe)?:' },
          { key: 'exploitationRisks', label: 'Risk of financial abuse, scamming or exploitation identified:' },
          { key: 'controlMeasures', label: 'Safeguards and control measures in place:' },
        ];

      case 'Communication Assessment':
        return [
          { section: 'Communication Assessment' },
          { key: 'hearingAbility', label: 'Hearing ability & hearing aids used:' },
          { key: 'sightAbility', label: 'Visual ability & glasses/magnifiers used:' },
          { key: 'speechClarity', label: 'Speech clarity & rate of speech:' },
          { key: 'comprehensionLevel', label: 'Level of understanding & how to explain things simply:' },
          { key: 'preferredMethods', label: 'Preferred communication methods (spoken, pictures, Makaton, gestures):' },
          { key: 'communicationAids', label: 'Communication aids / technology used:' },
          { key: 'goodCommunicationTips', label: 'Top tips for staff to communicate effectively:' },
        ];

      case 'Pre-Admission Assessment':
        return [
          { section: 'Pre-Admission Assessment' },
          { key: 'referralReason', label: 'Reason for referral & summary of background:' },
          { key: 'currentLivingSituation', label: 'Current living environment & safety factors:' },
          { key: 'primaryCareNeeds', label: 'Primary care & support needs identified:' },
          { key: 'hoursRequested', label: 'Hours / visits requested per week:' },
          { key: 'keyRisksIdentified', label: 'Key risks identified during assessment:' },
          { key: 'suitableForService', label: 'Is the provider suitable and able to meet all identified needs?:', type: 'select', options: ['Yes', 'Yes with specific adaptations', 'No'] },
          { key: 'proposedStartDate', label: 'Proposed Admission / Service Start Date:', type: 'date' },
        ];

      default:
        // Generic Risk Assessment
        return [
          { section: 'Risk Profile' },
          { key: 'whatIsRisk', label: 'What is the risk?:' },
          { key: 'whoIsAtRisk', label: 'Who is at risk?:', type: 'text' },
          { key: 'isHistorical', label: 'Is the risk historical?:', type: 'select', options: ['No', 'Yes'] },
          { key: 'whatCouldHappen', label: 'What could happen?:' },
          { section: 'Controls & Impact' },
          { key: 'riskBeforeIntervention', label: 'Risk before intervention?:', type: 'select', options: ['Low', 'Medium', 'High'] },
          { key: 'actionToTake', label: 'Action to take by staff (control measures):' },
          { key: 'riskAfterControls', label: 'Risk occurring following implementation of control measures?:', type: 'select', options: ['Low', 'Medium', 'High'] },
          { key: 'summary', label: 'Summary of assessment:' },
          { key: 'riskLevel', label: 'Risk Level:', type: 'select', options: ['Low', 'Medium', 'High'] },
          { key: 'totalScore', label: 'Total Score (optional):', type: 'text' },
        ];
    }
  };

  const fields = getFieldsForActiveTab();

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Risk Assessments & Specialized Forms</h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Completed assessments remain Green for 1 month, turning Red if not evaluated. Evaluated forms return to Green.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white font-medium transition-colors"
            >
              View All
            </button>
            <button
              type="button"
              onClick={openAdd}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Category Search & Filter */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search assessment forms..."
              value={tabSearch}
              onChange={e => setTabSearch(e.target.value)}
              className="w-full text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
            />
            {tabSearch && (
              <button onClick={() => setTabSearch('')} className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>

          {/* Quick Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-[#224fa6] text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('GREEN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'GREEN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Up to Date ({statusCounts.green})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('RED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'RED'
                  ? 'bg-red-600 text-white shadow-xs animate-pulse'
                  : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Needs Evaluation ({statusCounts.red})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('NOT_COMPLETED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'NOT_COMPLETED'
                  ? 'bg-gray-700 text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              Not Started ({statusCounts.notCompleted})
            </button>
          </div>
        </div>

        {/* Assessment Category Pill Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 max-h-48 overflow-y-auto p-1.5 border border-gray-200 rounded-xl bg-gray-50/50">
          {filteredCategories.map(c => {
            const catStatus = categoryStatusMap[c.key] || { status: 'NOT_COMPLETED', label: 'Not Started' };
            const isSelected = activeTab === c.key;

            let pillClasses = '';
            let dot = null;

            if (catStatus.status === 'GREEN') {
              pillClasses = isSelected
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300 font-semibold'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100';
              dot = (
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
              );
            } else if (catStatus.status === 'RED') {
              pillClasses = isSelected
                ? 'bg-red-600 text-white shadow-md ring-2 ring-red-300 font-semibold animate-pulse'
                : 'bg-red-50 text-red-800 border border-red-300 hover:bg-red-100 font-medium';
              dot = (
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${isSelected ? 'bg-white' : 'bg-red-500 animate-ping'}`} />
              );
            } else {
              pillClasses = isSelected
                ? 'bg-[#224fa6] text-white shadow-sm ring-2 ring-blue-300 font-medium'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200';
              dot = (
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${isSelected ? 'bg-white/60' : 'bg-gray-300'}`} />
              );
            }

            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveTab(c.key)}
                title={`${c.title} • ${catStatus.label}${catStatus.sublabel ? ` (${catStatus.sublabel})` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center ${pillClasses}`}
              >
                {dot}
                <span>{c.title}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-800">
              {activeTab} Records
            </h3>
            {categoryStatusMap[activeTab] && (
              categoryStatusMap[activeTab].status === 'GREEN' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{categoryStatusMap[activeTab].label}</span>
                  <span className="text-[10px] text-emerald-600 font-normal">({categoryStatusMap[activeTab].sublabel})</span>
                </span>
              ) : categoryStatusMap[activeTab].status === 'RED' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span>{categoryStatusMap[activeTab].label}</span>
                  <span className="text-[10px] text-red-600 font-normal">({categoryStatusMap[activeTab].sublabel})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  Not Started
                </span>
              )
            )}
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading assessments...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">No {activeTab} records found</p>
            <p className="text-sm text-gray-400">Click Add to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Assessed</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type / Title</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score / Level</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Review Frequency</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Conducted By</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Evaluations</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const rowStatus = getEvaluationStatus(r);
                  return (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 text-sm">
                        {rowStatus.status === 'GREEN' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>{rowStatus.label}</span>
                            <span className="text-[10px] text-emerald-600 font-normal">({rowStatus.sublabel})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span>{rowStatus.label}</span>
                            <span className="text-[10px] text-red-600 font-normal">({rowStatus.sublabel})</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{formatDate(r.lastAssessed)}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">{r.riskType}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {r.riskLevel ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            r.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                            r.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {r.riskLevel} {r.totalScore ? `(${r.totalScore})` : ''}
                          </span>
                        ) : (r.totalScore || '-')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{r.reviewFrequency || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{r.conductedBy || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.createdAt)}</td>
                      <td className="py-3 px-4 text-sm">
                        {Array.isArray(r.extra?.evaluations) && r.extra.evaluations.length > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            {r.extra.evaluations.length} evaluation{r.extra.evaluations.length > 1 ? 's' : ''} (latest: {formatDate(r.extra.evaluations[r.extra.evaluations.length - 1].date)})
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">0 recorded</span>
                        )}
                      </td>
                    <td className="py-3 px-4 space-x-3">
                      <button
                        type="button"
                        onClick={() => openView(r)}
                        className="text-[#224fa6] hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRow(r.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Add - {activeTab}</h3>
                <p className="text-xs text-blue-100 mt-0.5">Service User: {serviceUserName || 'Service User'}</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-white/80 hover:text-white text-2xl leading-none transition-colors">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Core Administrative Fields */}
                <div className="md:col-span-2"><h4 className="text-sm font-semibold text-gray-900 border-b pb-1">Assessment Administration</h4></div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Assessed Date</label>
                  <input
                    type="date"
                    value={formData.lastAssessed || ''}
                    onChange={e => setFormData(prev => ({ ...prev, lastAssessed: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Review Frequency</label>
                  <input
                    type="text"
                    value={formData.reviewFrequency || ''}
                    onChange={e => setFormData(prev => ({ ...prev, reviewFrequency: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    placeholder="e.g. Every six months or 26 weeks"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Conducted By</label>
                  <select
                    value={formData.conductedBy || ''}
                    onChange={e => setFormData(prev => ({ ...prev, conductedBy: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value="">Please Select Assessor</option>
                    {staff.map(s => (
                      <option key={s.id} value={`${s.firstName} ${s.lastName}`}>
                        {s.firstName} {s.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Office / Branch</label>
                  <input
                    type="text"
                    value={formData.office || ''}
                    onChange={e => setFormData(prev => ({ ...prev, office: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>

                {/* Specialized Assessment Dynamic Fields */}
                {fields.map((f, idx) => f.section ? (
                  <div key={idx} className="md:col-span-2 pt-3">
                    <h4 className="text-sm font-semibold text-gray-900 border-b pb-1">{f.section}</h4>
                  </div>
                ) : (
                  <div key={f.key} className={f.type === 'checkboxes' || f.type === 'textarea' || !f.type ? 'md:col-span-2' : ''}>
                    <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
                    {f.type === 'select' ? (
                      <select
                        value={formData[f.key] || ''}
                        onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      >
                        <option value="">Please Select</option>
                        {f.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : f.type === 'checkboxes' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3 max-h-56 overflow-y-auto">
                        {f.options.map(opt => (
                          <label key={opt} className="text-xs text-gray-700 flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={(formData[f.key] || []).includes(opt)}
                              onChange={e => {
                                const current = formData[f.key] || [];
                                setFormData(prev => ({
                                  ...prev,
                                  [f.key]: e.target.checked
                                    ? Array.from(new Set([...current, opt]))
                                    : current.filter(x => x !== opt)
                                }));
                              }}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : f.type === 'date' || f.type === 'datetime-local' ? (
                      <input
                        type={f.type}
                        value={formData[f.key] || ''}
                        onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      />
                    ) : f.type === 'text' ? (
                      <input
                        type="text"
                        value={formData[f.key] || ''}
                        onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      />
                    ) : (
                      <textarea
                        value={formData[f.key] || ''}
                        onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
                        rows={2}
                      />
                    )}
                  </div>
                ))}

                {/* Team Assignment & Signoff */}
                <div className="md:col-span-2 pt-3"><h4 className="text-sm font-semibold text-gray-900 border-b pb-1">Sign-off & Team Sharing</h4></div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Assigned Team</label>
                  <select
                    value={formData.extra?.teamId || ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      extra: { ...(prev.extra || {}), teamId: e.target.value }
                    }))}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value="">Select Team</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Send Signoffs to Care Workers?</label>
                  <select
                    value={formData.sendSignoffs ? 'Yes' : 'No'}
                    onChange={e => setFormData(prev => ({ ...prev, sendSignoffs: e.target.value === 'Yes' }))}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {/* Evaluation Section at the End */}
                <div className="md:col-span-2 pt-4 mt-2 border-t-2 border-blue-100">
                  <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200 rounded-xl p-5 shadow-xs">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#224fa6]"></span>
                      <h4 className="text-base font-bold text-gray-900">Evaluation</h4>
                    </div>
                    <p className="text-xs text-gray-600 mb-4">
                      Record an evaluation for this assessment / form. All recorded evaluations remain visible permanently.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Evaluation</label>
                        <input
                          type="date"
                          value={formData.evaluationDate || ''}
                          onChange={e => setFormData(prev => ({ ...prev, evaluationDate: e.target.value }))}
                          className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Name of Person Completing</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Name of evaluator (staff / manager)"
                            value={formData.evaluatorName || ''}
                            onChange={e => setFormData(prev => ({ ...prev, evaluatorName: e.target.value }))}
                            className="flex-1 text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                          />
                          {staff.length > 0 && (
                            <select
                              value=""
                              onChange={e => {
                                if (e.target.value) setFormData(prev => ({ ...prev, evaluatorName: e.target.value }));
                              }}
                              className="text-xs bg-white border border-gray-300 rounded-lg px-2 py-2 text-gray-700 cursor-pointer"
                              title="Select from staff list"
                            >
                              <option value="">Staff list...</option>
                              {staff.map(s => (
                                <option key={s.id} value={`${s.firstName} ${s.lastName}`.trim()}>
                                  {s.firstName} {s.lastName}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Evaluation Record</label>
                      <textarea
                        rows={3}
                        placeholder="Enter evaluation record, review notes, risk mitigation efficacy, or necessary updates..."
                        value={formData.evaluationRecord || ''}
                        onChange={e => setFormData(prev => ({ ...prev, evaluationRecord: e.target.value }))}
                        className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 transition-all shadow"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">History - {activeTab}</h3>
              <button type="button" onClick={() => setShowHistory(false)} className="text-white/80 hover:text-white text-2xl leading-none transition-colors">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {rows.length === 0 ? (
                <p className="text-sm text-gray-500">No records found for this assessment.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Assessed</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Risk Level / Score</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Assessor</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Evaluations</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => {
                      const rowStatus = getEvaluationStatus(r);
                      return (
                        <tr key={r.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                          <td className="py-3 px-4 text-sm">
                            {rowStatus.status === 'GREEN' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span>{rowStatus.label}</span>
                                <span className="text-[10px] text-emerald-600 font-normal">({rowStatus.sublabel})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                <span>{rowStatus.label}</span>
                                <span className="text-[10px] text-red-600 font-normal">({rowStatus.sublabel})</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">{formatDate(r.lastAssessed)}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{r.riskLevel || r.totalScore || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{r.conductedBy || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.createdAt)}</td>
                          <td className="py-3 px-4 text-sm">
                            {Array.isArray(r.extra?.evaluations) && r.extra.evaluations.length > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                {r.extra.evaluations.length} evaluation{r.extra.evaluations.length > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">0 recorded</span>
                            )}
                          </td>
                          <td className="py-3 px-4 space-x-3">
                            <button
                              type="button"
                              onClick={() => { openView(r); setShowHistory(false); }}
                              className="text-[#224fa6] hover:text-blue-800 text-sm font-medium"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteRow(r.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Record Details Modal */}
      {viewRecord && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{viewRecord.riskType} Details</h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Assessed: {formatDate(viewRecord.lastAssessed)} | Conducted By: {viewRecord.conductedBy || 'N/A'} | Review: {viewRecord.reviewFrequency || 'N/A'}
                </p>
              </div>
              <button type="button" onClick={() => setViewRecord(null)} className="text-white/80 hover:text-white text-2xl leading-none transition-colors">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Green / Red Evaluation Lifecycle Banner */}
              {(() => {
                const recordStatus = getEvaluationStatus(viewRecord);
                return recordStatus.status === 'RED' ? (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-xs">
                    <div className="text-red-600 text-xl leading-none mt-0.5">⚠️</div>
                    <div className="flex-1 text-sm text-red-800">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-red-900">Evaluation Overdue ({recordStatus.sublabel})</p>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-200 text-red-900">RED • Needs Review</span>
                      </div>
                      <p className="text-xs text-red-700 mt-1">
                        This assessment was last evaluated/assessed on <strong>{formatDate(recordStatus.refDate)}</strong>. Risk assessments turn red after 1 month without evaluation. Please complete an evaluation below to return this form to <strong>Green</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-xs">
                    <div className="text-emerald-600 text-xl leading-none mt-0.5">✅</div>
                    <div className="flex-1 text-sm text-emerald-800">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-emerald-900">Assessment Up to Date ({recordStatus.label})</p>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-200 text-emerald-900">GREEN • Valid</span>
                      </div>
                      <p className="text-xs text-emerald-700 mt-1">
                        Last evaluated/assessed on <strong>{formatDate(recordStatus.refDate)}</strong>. Next evaluation recommended on or before <strong>{formatDate(recordStatus.dueDate)}</strong> ({recordStatus.sublabel}).
                      </p>
                    </div>
                  </div>
                );
              })()}
              {/* Questionnaire / Core details */}
              <div className="space-y-4">
                {viewRecord.riskLevel && (
                  <div className="border-b border-gray-100 pb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Risk Level / Score</p>
                    <p className="text-sm text-gray-900 font-medium">{viewRecord.riskLevel} {viewRecord.totalScore ? `(Score: ${viewRecord.totalScore})` : ''}</p>
                  </div>
                )}

                {viewRecord.whatIsRisk && (
                  <div className="border-b border-gray-100 pb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Risk / Primary Subject</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewRecord.whatIsRisk}</p>
                  </div>
                )}

                {viewRecord.actionToTake && (
                  <div className="border-b border-gray-100 pb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Actions / Controls</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewRecord.actionToTake}</p>
                  </div>
                )}

                {viewRecord.summary && (
                  <div className="border-b border-gray-100 pb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Summary</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewRecord.summary}</p>
                  </div>
                )}

                {/* Render all custom fields stored in extra, excluding evaluations */}
                {viewRecord.extra && typeof viewRecord.extra === 'object' && Object.keys(viewRecord.extra).length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-semibold text-gray-800 border-b pb-1">Assessment Questionnaire Answers</h4>
                    {Object.entries(viewRecord.extra)
                      .filter(([k]) => k !== 'evaluations' && k !== 'evaluationDate' && k !== 'evaluatorName' && k !== 'evaluationRecord')
                      .map(([k, v]) => {
                        const fieldDef = fields.find(f => f.key === k);
                        const label = fieldDef?.label || k;
                        return (
                          <div key={k} className="border-b border-gray-100 pb-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">
                              {Array.isArray(v) ? v.join(', ') : (v || '-')}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Evaluations Section (All evaluations stay visible permanently) */}
              <div className="pt-6 border-t-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-[#224fa6]"></span>
                    <h4 className="text-lg font-bold text-gray-900">
                      Evaluations History ({Array.isArray(viewRecord.extra?.evaluations) ? viewRecord.extra.evaluations.length : 0})
                    </h4>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                    All evaluations preserved & visible
                  </span>
                </div>

                {/* List of past evaluations */}
                {!Array.isArray(viewRecord.extra?.evaluations) || viewRecord.extra.evaluations.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500 mb-6">
                    <p className="font-medium text-gray-700">No evaluations recorded yet.</p>
                    <p className="text-xs text-gray-400 mt-0.5">Use the evaluation box below to record the first evaluation.</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {viewRecord.extra.evaluations.map((ev, idx) => (
                      <div key={ev.id || idx} className="bg-gradient-to-r from-blue-50/60 to-indigo-50/30 border border-blue-200 rounded-xl p-4 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-blue-100">
                          <div className="flex items-center space-x-2.5">
                            <span className="px-2.5 py-0.5 rounded-md bg-[#224fa6] text-white text-xs font-bold">
                              Evaluation #{idx + 1}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                              {ev.evaluatorName || 'Staff'}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-gray-700 flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-xs">
                            <svg className="w-3.5 h-3.5 text-[#224fa6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            {formatDate(ev.date)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{ev.record}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Evaluation Box */}
                <div className="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-xs">
                  <h5 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#224fa6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Record New Evaluation
                  </h5>
                  <p className="text-xs text-gray-500 mb-4">Add a new evaluation review to this assessment. It will be recorded alongside existing evaluations.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Evaluation *</label>
                      <input
                        type="date"
                        value={newEvalDate}
                        onChange={e => setNewEvalDate(e.target.value)}
                        className="w-full text-sm bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Name of Person Completing *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Registered Manager / Staff Name"
                          value={newEvaluatorName}
                          onChange={e => setNewEvaluatorName(e.target.value)}
                          className="flex-1 text-sm bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                        />
                        {staff.length > 0 && (
                          <select
                            value=""
                            onChange={e => {
                              if (e.target.value) setNewEvaluatorName(e.target.value);
                            }}
                            className="text-xs bg-white border border-gray-300 rounded-lg px-2 py-2 text-gray-700 cursor-pointer"
                            title="Select from staff list"
                          >
                            <option value="">Staff list...</option>
                            {staff.map(s => (
                              <option key={s.id} value={`${s.firstName} ${s.lastName}`.trim()}>
                                {s.firstName} {s.lastName}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Evaluation Record *</label>
                    <textarea
                      rows={3}
                      placeholder="Record progress, review notes, risk mitigation efficacy, or necessary updates..."
                      value={newEvalRecord}
                      onChange={e => setNewEvalRecord(e.target.value)}
                      className="w-full text-sm bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddEvaluation}
                      disabled={savingEval}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#224fa6] to-[#3270e9] hover:from-[#1a3d85] hover:to-[#2859c7] text-white rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                    >
                      {savingEval ? 'Saving Evaluation...' : 'Save Evaluation'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewRecord(null)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
