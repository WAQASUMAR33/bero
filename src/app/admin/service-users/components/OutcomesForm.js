'use client';
import { Shield, Link2, Search, Plus, AlertTriangle, CheckCircle2, FileText, User, Users, Target } from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';
import { getEvaluationStatus, getCategoryOverallStatus } from '@/lib/evaluationStatus';
import { SUPPORT_PLAN_CATEGORIES, getSupportPlanTitle } from '@/lib/supportPlanCategories';

const categories = SUPPORT_PLAN_CATEGORIES;

const standardSupportPlanFields = [
  { key: 'identifiedNeeds', label: 'Identified Needs:' },
  { key: 'goodDay', label: 'What Does a Good Day Look Like?:' },
  { key: 'badDay', label: 'What Does a Bad Day Look Like?:' },
  { key: 'goals', label: 'Goals:' },
  { key: 'howAchieved', label: 'How Can These Be Achieved?:' },
  { key: 'supportNeeded', label: 'What Support Do I Need In This Area?:' },
  { section: 'Sign-off' },
  { key: 'serviceUserSignature', label: 'Service User Signature:', type: 'text' },
  { key: 'signDate', label: 'Date:', type: 'date' },
  { key: 'staffMemberName', label: 'Staff Member Name:', type: 'text' },
  { key: 'staffMemberSignature', label: 'Staff Member Signature:', type: 'text' },
];

export default function OutcomesForm({ serviceSeekerId, onNotification, riskAssessmentsVersion }){
  const [active, setActive] = useState('ABOUT_ME');
  const [rows, setRows] = useState([]); // history for active
  const [allOutcomes, setAllOutcomes] = useState([]); // all seeker outcomes for category status
  const [allRiskAssessments, setAllRiskAssessments] = useState([]); // live synced risk assessments
  const [loadingRisks, setLoadingRisks] = useState(false);
  const [viewRiskAssessment, setViewRiskAssessment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categorySearch, setCategorySearch] = useState('');
  const [viewRecord, setViewRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [formData, setFormData] = useState({});
  const [newEvalDate, setNewEvalDate] = useState('');
  const [newEvaluatorName, setNewEvaluatorName] = useState('');
  const [newEvalRecord, setNewEvalRecord] = useState('');
  const [newServiceUserOption, setNewServiceUserOption] = useState(''); // 'READ' | 'DO_NOT_WISH' | ''
  const [newServiceUserViews, setNewServiceUserViews] = useState('');
  const [savingEval, setSavingEval] = useState(false);

  useEffect(() => { 
    fetchRows(active); 
  }, [serviceSeekerId, active]);

  useEffect(() => {
    fetchAllOutcomes();
  }, [serviceSeekerId]);

  useEffect(() => {
    fetchRiskAssessments();
  }, [serviceSeekerId, riskAssessmentsVersion]);

  // Live communication listener for risk assessments updates across components
  useEffect(() => {
    const handleUpdated = (event) => {
      if (!event?.detail?.serviceSeekerId || String(event.detail.serviceSeekerId) === String(serviceSeekerId)) {
        fetchRiskAssessments();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('bero:risk-assessments-updated', handleUpdated);
      return () => window.removeEventListener('bero:risk-assessments-updated', handleUpdated);
    }
  }, [serviceSeekerId]);

  const fetchRiskAssessments = async () => {
    if (!serviceSeekerId) return;
    setLoadingRisks(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/risk-assessments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllRiskAssessments(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to fetch risk assessments in OutcomesForm:', e);
    } finally {
      setLoadingRisks(false);
    }
  };

  const fetchAllOutcomes = async () => {
    if (!serviceSeekerId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/outcomes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllOutcomes(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRows = async (category) => {
    if(!serviceSeekerId) return;
    setLoading(true);
    try{
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/outcomes?category=${category}`,{ headers:{ Authorization:`Bearer ${token}` }});
      if(res.ok){ const data = await res.json(); setRows(data || []); }
    }catch(e){ console.error(e); }
    finally{ setLoading(false); }
  };

  const openAdd = () => {
    setFormData({
      evaluationDate: new Date().toISOString().split('T')[0],
      evaluatorName: '',
      evaluationRecord: '',
      serviceUserOption: '',
      serviceUserViews: '',
    });
    setShowModal(true);
  };

  const openView = (record) => {
    setViewRecord(record);
    setNewEvalDate(new Date().toISOString().split('T')[0]);
    setNewEvaluatorName('');
    setNewEvalRecord('');
    setNewServiceUserOption('');
    setNewServiceUserViews('');
  };

  const save = async () => {
    setSaving(true);
    try{
      const token = localStorage.getItem('token');
      const cleanData = { ...formData };
      const hasEval = cleanData.evaluationRecord?.trim() || cleanData.evaluatorName?.trim() || cleanData.serviceUserViews?.trim() || cleanData.serviceUserOption;
      const planTitle = `${getSupportPlanTitle(active)} Support Plan`;
      const initialEvaluations = hasEval ? [{
        id: `eval_${Date.now()}`,
        date: cleanData.evaluationDate || new Date().toISOString().split('T')[0],
        evaluatorName: cleanData.evaluatorName?.trim() || 'Staff',
        record: cleanData.evaluationRecord?.trim() || '',
        serviceUserOption: cleanData.serviceUserOption || null,
        serviceUserRead: cleanData.serviceUserOption === 'READ',
        serviceUserDoNotWish: cleanData.serviceUserOption === 'DO_NOT_WISH',
        serviceUserViews: cleanData.serviceUserViews?.trim() || '',
        planOrAssessmentName: planTitle,
        createdAt: new Date().toISOString(),
      }] : [];

      delete cleanData.evaluationDate;
      delete cleanData.evaluatorName;
      delete cleanData.evaluationRecord;
      delete cleanData.serviceUserOption;
      delete cleanData.serviceUserViews;

      cleanData.evaluations = initialEvaluations;

      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/outcomes`,{
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ category: active, data: cleanData })
      });
      if(res.ok){
        await fetchRows(active);
        await fetchAllOutcomes();
        setShowModal(false);
        if(onNotification) onNotification({ show:true, message:'Support plan saved successfully.', type:'success' });
      }
      else {
        const err = await res.json();
        if(onNotification) onNotification({ show:true, message: err.error || 'Failed to save.', type:'error' });
      }
    }catch(e){
      console.error(e);
      if(onNotification) onNotification({ show:true, message:'Failed to save.', type:'error' });
    }
    finally{ setSaving(false); }
  };

  const handleAddEvaluation = async () => {
    if (!viewRecord) return;
    if (!newEvalRecord.trim()) {
      if (onNotification) onNotification({ show: true, message: 'Please enter a staff evaluation record.', type: 'error' });
      return;
    }
    setSavingEval(true);
    try {
      const token = localStorage.getItem('token');
      const existingEvaluations = Array.isArray(viewRecord.data?.evaluations) ? viewRecord.data.evaluations : [];
      const planTitle = `${getSupportPlanTitle(viewRecord.category || active)} Support Plan`;
      const newEval = {
        id: `eval_${Date.now()}`,
        date: newEvalDate || new Date().toISOString().split('T')[0],
        evaluatorName: newEvaluatorName.trim() || 'Staff',
        record: newEvalRecord.trim(),
        serviceUserOption: newServiceUserOption || null,
        serviceUserRead: newServiceUserOption === 'READ',
        serviceUserDoNotWish: newServiceUserOption === 'DO_NOT_WISH',
        serviceUserViews: newServiceUserViews.trim(),
        planOrAssessmentName: planTitle,
        createdAt: new Date().toISOString(),
      };
      const updatedEvaluations = [...existingEvaluations, newEval];
      const updatedData = { ...(viewRecord.data || {}), evaluations: updatedEvaluations };

      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/outcomes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: viewRecord.id, data: updatedData })
      });

      if (res.ok) {
        const updatedRecord = { ...viewRecord, data: updatedData, updatedAt: new Date().toISOString() };
        setViewRecord(updatedRecord);
        setRows(prev => prev.map(r => r.id === viewRecord.id ? updatedRecord : r));
        setAllOutcomes(prev => prev.map(r => r.id === viewRecord.id ? updatedRecord : r));
        fetchAllOutcomes();
        setNewEvalRecord('');
        setNewEvaluatorName('');
        setNewServiceUserOption('');
        setNewServiceUserViews('');
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
    setSaving(true);
    try{
      const token = localStorage.getItem('token');
      await fetch(`/api/service-seekers/${serviceSeekerId}/outcomes?id=${id}`,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` }});
      await fetchRows(active);
      await fetchAllOutcomes();
      if(onNotification) onNotification({ show:true, message:'Deleted.', type:'success' });
    }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Failed to delete.', type:'error' }); }
    finally{ setSaving(false); }
  };

  const formatDate = (s) => {
    if(!s) return '-';
    try{ const d = new Date(s); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});}catch{return s||'-'}
  };

  const fieldsForActive = useMemo(() => {
    switch(active){
      case 'ABOUT_ME':
        return [
          { key:'aboutPast', label:'About my past:' },
          { key:'aboutUpbringing', label:'About my upbringing:' },
          { key:'importantPeople', label:'Other people who are important to me:' },
          { key:'routineImportant', label:'Routine is important to me:' , type:'select'},
          { key:'whatUpsets', label:'What upset, irritates, or makes me anxious:' },
          { key:'whatHelps', label:'What makes me feel better when I\'m upset, irritated or anxious:' },
          { section:'Things I Like' },
          { key:'likeToDo', label:'The things I like to do:' },
          { key:'likeToGo', label:'The places I like to go:' },
          { key:'likeToEat', label:'The food I like to eat:' },
          { key:'likeToDrink', label:'The drinks I like to drink:' },
          { section:'My Hobbies & Interests' },
          { key:'hobbies', label:'My hobbies:' },
          { key:'favFilms', label:'My favorite film/s:' },
          { key:'favSongs', label:'My favorite song/s:' },
          { key:'favColours', label:'My favorite colour/s:' },
          { section:'My Faith & Community' },
          { key:'faithCultures', label:'My faith/cultures:' },
          { key:'clubs', label:'The clubs/groups I go to:' },
          { key:'otherImportant', label:'Any other important details about me:' },
        ];
      case 'PHYSICAL_HEALTH':
        const makeTriplet = (prefix, label) => ([
          { key:`${prefix}Self`, label:`My ${label}:` },
          { key:`${prefix}Support`, label:'Support Required?', type:'select' },
          { key:`${prefix}Details`, label:'Details:' },
        ]);
        return [
          ...makeTriplet('speech','speech'),
          ...makeTriplet('hearing','hearing'),
          ...makeTriplet('eyesight','eyesight'),
          ...makeTriplet('memory','memory'),
          { key:'hygieneAbility', label:'My personal hygiene ability:' },
          { key:'hygieneSupport', label:'Support required?', type:'select' },
          { key:'hygieneDetails', label:'Details:' },
          { key:'oralHygiene', label:'My oral hygiene:' },
          { key:'oralSupport', label:'Support required?', type:'select' },
          { key:'oralDetails', label:'Details:' },
          ...makeTriplet('continence','continence'),
          ...makeTriplet('skin','skin condition'),
          ...makeTriplet('swallowing','swallowing'),
          ...makeTriplet('nutrition','nutrition'),
          ...makeTriplet('hydration','hydration'),
        ];
      case 'MENTAL_HEALTH':
        return [
          { key:'ableToDo', label:'I am able to do the following:' },
          { key:'needSupportWith', label:'I need support with the following:' },
          { key:'importantInfo', label:'Important information about my mental health you may need to know:' },
          { section:'My Outcomes' },
          { key:'desiredOutcomes', label:'What are my desired outcomes:' },
          { key:'supportToAchieve', label:'How do I want staff to support me to achieve my desired outcomes:' },
          { section:'Equipment' },
          { key:'equipment', label:'Special equipment/Instructions:' },
          { section:'Background' },
          { key:'backgroundInfo', label:'Relevant background information:' },
          { section:'Control measures to keep me safe' },
          { key:'controlMeasures', label:'Control measures to keep me safe' },
        ];
      case 'COMMUNICATION':
        return [
          { section:'Communication Methods' },
          { key:'sight', label:'Sight (include glasses and any other aids)' },
          { key:'sightSupport', label:'How I would like you to support me:' },
          { key:'hearing', label:'Hearing (include hearing aids, voice levels)' },
          { key:'hearingSupport', label:'How I would like you to support me:' },
          { key:'speech', label:'Speech (including different ways of communicating).' },
          { key:'speechSupport', label:'How I would like you to communicate with me:' },
          { section:'Modes' },
          { key:'modes', label:'Select all that apply', type:'checkboxes', options:['Verbal','non-Verbal','Written','listening','Visual','Picture cards','Gestures','Touch','Drawing','Facial expression','Sign language','Body movements and posture','Electronically (eg text messaging and email)','Makaton','Technical Aids'] },
          { key:'otherDetails', label:'Other details:' },
          { section:'When communicating with me' },
          { key:'whenCommunicating', label:'When communicating with me:' },
          { key:'interestingFacts', label:'Interesting facts about communicating with me:' },
          { section:'Communication History' },
          { key:'noLongerUse', label:'Communication methods I no longer use:' },
          { key:'reasonsChange', label:'Reasons for a change in my communication:' },
          { key:'anyOther', label:'Any other information:' },
        ];
      case 'ORAL_CARE':
        return [
          { section:'About My Teeth' },
          { key:'ownTeeth', label:'I have all my own teeth:', type:'select' },
          { key:'haveDentures', label:'I have dentures:', type:'select' },
          { section:'My Preference' },
          { key:'useMouthwash', label:'I use mouth wash:', type:'select' },
          { key:'usePrescribedMouthwash', label:'I use prescribed mouth wash:', type:'select' },
          { key:'mouthwashPreference', label:'My mouthwash preference:' },
          { key:'useFloss', label:'I use floss:', type:'select' },
          { key:'flossPreference', label:'My floss preference:' },
          { key:'useDentureTablets', label:'I use denture tablets:', type:'select' },
          { key:'dentureTabletPreference', label:'My denture tablet preference:' },
          { key:'toothbrushPreference', label:'My toothbrush preference:' },
          { key:'toothpastePreference', label:'My toothpaste preference:' },
          { section:'Support' },
          { key:'supportRequired', label:'I require support with my oral hygiene', type:'select' },
          { key:'supportDetails', label:'Details:' },
        ];
      case 'SKIN_INTEGRITY':
        return [
          { key:'skinCondition', label:'The condition of my skin:' },
          { key:'needs', label:'Needs:' },
          { key:'maintainPressure', label:'How you can help me maintain my skin in areas of pressure:' },
          { key:'preventTears', label:'How you can help me prevent skin tears, blisters, wounds, and pressure sores:' },
          { section:'Equipment' },
          { key:'equipment', label:'The equipment I need:' },
          { section:'Other' },
          { key:'otherInfo', label:'Any other information you need to know about my skin integrity:' },
        ];
      case 'MEDICATION':
        const select = { type:'select' };
        return [
          { key:'manageOwn', label:'I manage my own medication:', ...select },
          { key:'manageOwnSupportLevel', label:'Level of support:', ...select },
          { key:'administered', label:'I require my medication to be administered:', ...select },
          { key:'administeredSupportLevel', label:'Level of support:', ...select },
          { section:'Support:' },
          { key:'supportManage', label:'I require support to manage my medication (i.e.Ordering, collecting, or reminding to take)', ...select },
          { key:'supportManageLevel', label:'Level of support', ...select },
          { key:'topicalsSupport', label:'I have prescribed creams, eyedrops or inhalers which I require support with or applying or administering.', ...select },
          { key:'topicalsSupportLevel', label:'Level of support', ...select },
          { section:'Other Information' },
          { key:'othersHelp', label:'Others that help me with support/management of my medication:' },
          { key:'currentMeds', label:'List of my current medication (including topical creams, eyedrops, inhalers and what they are for):' },
        ];
      case 'NUTRITION_HYDRATION':
        return [
          { section:'My Nutrition' },
          { section:'About My Nutrition' },
          { key:'nutritionNeeds', label:'What care and support needs do I currently have with nutrition:' },
          { key:'nutritionDesired', label:'What are my desired outcomes?' },
          { key:'nutritionSupport', label:'How do I want staff to support me with my desired outcomes?' },
          { section:'My Hydration' },
          { key:'hydrationAbout', label:'About My Hydration:' },
          { key:'hydrationNeeds', label:'What care and support needs do I currently have with Hydration:' },
          { key:'hydrationDesired', label:'What are my desired outcomes?' },
          { key:'hydrationSupport', label:'How do I want staff to support me with my desired outcomes?' },
        ];
      case 'CONTINENCE_CARE':
        return [
          { section:'Continence' },
          { key:'urinaryIncontinence', label:'Any evidence of urinary incontinence?' },
          { key:'continenceAids', label:'Any continence aids used/Are they catheterized?' },
          { key:'urineInfections', label:'Any history of urine infections/frequency? (Prophylactic Antibiotics)' },
          { key:'constipation', label:'Any history of constipation/any aperients?' },
          { key:'autonomicDysreflexia', label:'Any history of Autonomic Dysreflexia?' },
          { key:'advisorsInvolved', label:'Are Continence Advisors involved?' },
          { section:'Needs' },
          { key:'identifyNeeds', label:'Identify my needs:' },
          { key:'plannedOutcomes', label:'My planned outcomes:' },
          { key:'howAchieved', label:'How will these outcomes be achieved:' },
        ];
      case 'MOBILITY':
        const equipmentOpts = ['Manual Wheelchair','Electric Wheelchair','Scooter','Hoist','Wall or ceiling hoist','Leg hoist','Toileting Sling','Sling','Slide sheet','Shower chair','Profiling bed','Cot sides','Pressure relieving cushions','Pressure relieving mattress','Reclining Chair','Commode','Slide board','Rotunda','Zimmer Frame','Walking stick','Stair lift','Lift/elevator','Other (specify)','None'];
        return [
          { key:'supportDetails', label:'Details of support required' },
          { key:'weightBearing', label:'Weight baring factors' },
          { key:'bestWaySupport', label:'The best way to support me with my mobility' },
          { key:'equipmentStaff', label:'Equipment, staff and resources.' },
          { key:'restrictions', label:'Best Interest Decisions/Safeguards or restrictions in place.', type:'select' },
          { section:'Equipment' },
          { key:'equipmentList', label:'My Equipment', type:'checkboxes', options: equipmentOpts },
        ];
      case 'MY_NEEDS_SUPPORT':
        return [
          { key:'supportINeed', label:'Support I need' },
          { key:'whyINeed', label:'Why I need support' },
        ];
      case 'DECISION_MAKING':
        return [
          { key:'othersHelp', label:'Others who help me make decisions about my care and support' },
          { key:'finalDecision', label:'Who makes the final decision about my care and support' },
        ];
      case 'EMOTIONAL_SUPPORT':
        return [
          { key:'knowTriggers', label:'Do you know your triggers?' },
          { key:'significantExperiences', label:'Any significant experiences that affect your emotion?' },
          { key:'currentNeeds', label:'What care and support needs do I currently have?' },
          { key:'desiredOutcomes', label:'What are my desired outcomes?' },
          { section:'My Progression' },
          { key:'stopDoing', label:'Things I would like to stop doing:' },
          { key:'doLess', label:'Things I would like to do less:' },
          { key:'startDoing', label:'Things I will start doing:' },
          { key:'doMore', label:'Things I will do more of:' },
        ];
      case 'PSYCHOLOGICAL_MENTAL_HEALTH':
        return [
          { key: 'ableToDo', label: 'I am able to do the following:' },
          { key: 'needSupportWith', label: 'I need support with the following:' },
          { key: 'importantInfo', label: 'Important information about my mental health you may need to know:' },
          ...standardSupportPlanFields,
        ];
      default:
        return standardSupportPlanFields;
    }
  }, [active]);

  const categoryRecordsMap = useMemo(() => {
    const map = {};
    allOutcomes.forEach(item => {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    });
    return map;
  }, [allOutcomes]);

  const categoryStatusMap = useMemo(() => {
    const map = {};
    categories.forEach(c => {
      const catRecords = categoryRecordsMap[c.key] || [];
      map[c.key] = getCategoryOverallStatus(catRecords);
    });
    return map;
  }, [categoryRecordsMap]);

  const statusCounts = useMemo(() => {
    let green = 0;
    let red = 0;
    let notCompleted = 0;
    categories.forEach(c => {
      const st = categoryStatusMap[c.key]?.status;
      if (st === 'GREEN') green++;
      else if (st === 'RED') red++;
      else notCompleted++;
    });
    return { all: categories.length, green, red, notCompleted };
  }, [categoryStatusMap]);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      const matchesSearch = !categorySearch.trim() || c.title.toLowerCase().includes(categorySearch.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === 'ALL') return true;
      const catStatus = categoryStatusMap[c.key]?.status;
      return catStatus === statusFilter;
    });
  }, [categorySearch, statusFilter, categoryStatusMap]);

  // Linked risk assessments for the currently active support plan category
  const linkedRiskAssessments = useMemo(() => {
    return allRiskAssessments.filter(ra => {
      const linked = Array.isArray(ra.extra?.linkedSupportPlans) ? ra.extra.linkedSupportPlans : [];
      return linked.includes(active);
    });
  }, [allRiskAssessments, active]);

  // Counts of linked risk assessments per category key
  const categoryLinkedRisksCountMap = useMemo(() => {
    const map = {};
    allRiskAssessments.forEach(ra => {
      const linked = Array.isArray(ra.extra?.linkedSupportPlans) ? ra.extra.linkedSupportPlans : [];
      linked.forEach(catKey => {
        map[catKey] = (map[catKey] || 0) + 1;
      });
    });
    return map;
  }, [allRiskAssessments]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Support Plan</h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Completed plans remain Green for 1 month, turning Red if not evaluated. Evaluated plans return to Green.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button type="button" onClick={()=>setShowHistory(true)} className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white font-medium transition-colors">View All</button>
            <button type="button" onClick={openAdd} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-colors flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6">

      {/* Search & Status Filter Bar */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search categories..."
            value={categorySearch}
            onChange={e => setCategorySearch(e.target.value)}
            className="w-full text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
          />
          {categorySearch && (
            <button onClick={() => setCategorySearch('')} className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600 text-xs">×</button>
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

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-6 max-h-48 overflow-y-auto p-1.5 border border-gray-200 rounded-xl bg-gray-50/50">
        {filteredCategories.map(c => {
          const catStatus = categoryStatusMap[c.key] || { status: 'NOT_COMPLETED', label: 'Not Started' };
          const isSelected = active === c.key;
          const linkedCount = categoryLinkedRisksCountMap[c.key] || 0;

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
              onClick={() => setActive(c.key)}
              title={`${c.title} • ${catStatus.label}${catStatus.sublabel ? ` (${catStatus.sublabel})` : ''}${linkedCount > 0 ? ` • ${linkedCount} Linked Risk Assessment(s)` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center ${pillClasses}`}
            >
              {dot}
              <span>{c.title}</span>
              {linkedCount > 0 && (
                <span
                  className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white/30 text-white' : 'bg-purple-100 text-purple-800 border border-purple-200'
                  }`}
                  title={`${linkedCount} Linked Risk Assessment${linkedCount > 1 ? 's' : ''}`}
                >
                  <Link2 className="w-3 h-3 inline mr-0.5" />{linkedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Linked Risk Assessments Section (Live Synchronized) */}
      <div className="mb-6 bg-gradient-to-br from-purple-50/70 via-indigo-50/30 to-blue-50/40 border border-purple-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-purple-100">
          <div className="flex items-center space-x-2.5">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center text-sm shadow-xs"><Shield className="w-4 h-4 inline" /></span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-gray-900">
                  Linked Risk Assessments
                </h4>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  {linkedRiskAssessments.length}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Synced
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Risk assessments linked to <strong className="text-gray-700">{categories.find(c => c.key === active)?.title}</strong>. Updates made in Risk Assessments reflect here live.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('risk-assessments-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Jump down to Risk Assessments section to link or manage assessments"
            >
              <span>Link / Manage Risks</span>
              <span>↓</span>
            </button>
          </div>
        </div>

        {linkedRiskAssessments.length === 0 ? (
          <div className="bg-white/80 border border-dashed border-purple-200 rounded-lg p-5 text-center">
            <p className="text-xs font-semibold text-gray-700 mb-1">
              No risk assessments currently linked to {categories.find(c => c.key === active)?.title}.
            </p>
            <p className="text-xs text-gray-500 max-w-lg mx-auto">
              To link a risk assessment to this support plan, scroll to the <strong>Risk Assessments</strong> section below, click Add or Edit on an assessment, and check <em>{categories.find(c => c.key === active)?.title}</em> in the <strong>Link into Support Plan(s)</strong> options.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {linkedRiskAssessments.map(ra => {
              const raStatus = getEvaluationStatus(ra);
              const evaluationsCount = Array.isArray(ra.extra?.evaluations) ? ra.extra.evaluations.length : 0;
              const riskLevel = ra.riskLevel || 'Low';

              let levelBadge = 'bg-blue-100 text-blue-800 border-blue-200';
              if (riskLevel === 'High') levelBadge = 'bg-red-100 text-red-800 border-red-200';
              else if (riskLevel === 'Medium') levelBadge = 'bg-amber-100 text-amber-800 border-amber-200';
              else if (riskLevel === 'Very High') levelBadge = 'bg-rose-200 text-rose-900 border-rose-300';

              return (
                <div
                  key={ra.id}
                  className="bg-white border border-purple-100 hover:border-purple-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h5 className="text-xs font-bold text-gray-900 line-clamp-1" title={ra.riskType}>
                        {ra.riskType}
                      </h5>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${levelBadge} uppercase tracking-wider shrink-0`}>
                        {riskLevel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-2.5">
                      {raStatus.status === 'GREEN' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{raStatus.label}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          <span>{raStatus.label}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-[10px] text-gray-500">
                        {formatDate(ra.lastAssessed)}
                      </span>
                    </div>

                    {(ra.whatIsRisk || ra.summary) && (
                      <div className="mb-2">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Identified Risk</p>
                        <p className="text-xs text-gray-800 line-clamp-2 mt-0.5">
                          {ra.whatIsRisk || ra.summary}
                        </p>
                      </div>
                    )}

                    {ra.actionToTake && (
                      <div className="mb-2 bg-blue-50/60 p-2 rounded-lg border border-blue-100">
                        <p className="text-[10px] font-semibold text-[#224fa6] uppercase tracking-wider">Controls / Actions</p>
                        <p className="text-xs text-gray-700 line-clamp-2 mt-0.5">
                          {ra.actionToTake}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-500">
                      {evaluationsCount} evaluation{evaluationsCount !== 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewRiskAssessment(ra)}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-800">
            {categories.find(c => c.key === active)?.title} Entries
          </h3>
          {categoryStatusMap[active] && (
            categoryStatusMap[active].status === 'GREEN' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{categoryStatusMap[active].label}</span>
                <span className="text-[10px] text-emerald-600 font-normal">({categoryStatusMap[active].sublabel})</span>
              </span>
            ) : categoryStatusMap[active].status === 'RED' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span>{categoryStatusMap[active].label}</span>
                <span className="text-[10px] text-red-600 font-normal">({categoryStatusMap[active].sublabel})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                Not Started
              </span>
            )
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">No entries for this section</p>
          <p className="text-sm text-gray-400">Click Add to create one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Updated</th>
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
                    <td className="py-3 px-4 text-sm text-gray-900">{formatDate(r.createdAt)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{formatDate(r.updatedAt)}</td>
                    <td className="py-3 px-4 text-sm">
                      {Array.isArray(r.data?.evaluations) && r.data.evaluations.length > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {r.data.evaluations.length} evaluation{r.data.evaluations.length > 1 ? 's' : ''} (latest: {formatDate(r.data.evaluations[r.data.evaluations.length - 1].date)})
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">0 recorded</span>
                      )}
                    </td>
                    <td className="py-3 px-4 space-x-3">
                      <button type="button" onClick={()=>openView(r)} className="text-[#224fa6] hover:text-blue-800 text-sm font-medium">View</button>
                      <button type="button" onClick={()=>deleteRow(r.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Add - {categories.find(c=>c.key===active)?.title}</h3>
                <button type="button" onClick={()=>setShowModal(false)} className="text-white/80 hover:text-white text-2xl leading-none transition-colors">×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldsForActive.map((f,idx) => f.section ? (
                  <div key={idx} className="md:col-span-2 pt-2"><h4 className="text-sm font-semibold text-gray-900">{f.section}</h4></div>
                ) : (
                  <div key={f.key} className={f.type==='checkboxes' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
                    {f.type==='select' ? (
                      <select value={formData[f.key] || ''} onChange={e=>setFormData(prev=>({...prev, [f.key]:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Yes</option><option>No</option></select>
                    ) : f.type==='checkboxes' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3">
                        {f.options.map(opt => (
                          <label key={opt} className="text-sm text-gray-700 flex items-center space-x-2">
                            <input type="checkbox" checked={(formData[f.key]||[]).includes(opt)} onChange={(e)=>{
                              setFormData(prev=>({ ...prev, [f.key]: e.target.checked ? Array.from(new Set([...(prev[f.key]||[]), opt])) : (prev[f.key]||[]).filter(x=>x!==opt) }));
                            }} />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea value={formData[f.key] || ''} onChange={e=>setFormData(prev=>({...prev, [f.key]:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} />
                    )}
                  </div>
                ))}

                {/* Evaluation Section at the End */}
                <div className="md:col-span-2 pt-4 mt-2 border-t-2 border-blue-100 space-y-4">
                  {/* Section 1: Staff Evaluation */}
                  <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200 rounded-xl p-5 shadow-xs">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#224fa6]"></span>
                      <h4 className="text-base font-bold text-gray-900">Staff Evaluation</h4>
                    </div>
                    <p className="text-xs text-gray-600 mb-4">
                      Record the staff member's evaluation review for this support plan.
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
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Member Completing Evaluation</label>
                        <input
                          type="text"
                          placeholder="Name of evaluator (staff / manager)"
                          value={formData.evaluatorName || ''}
                          onChange={e => setFormData(prev => ({ ...prev, evaluatorName: e.target.value }))}
                          className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Evaluation Record</label>
                      <textarea
                        rows={3}
                        placeholder="Enter staff evaluation record, review notes, progress toward goals, or necessary updates..."
                        value={formData.evaluationRecord || ''}
                        onChange={e => setFormData(prev => ({ ...prev, evaluationRecord: e.target.value }))}
                        className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Section 2: Service User Evaluation */}
                  <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-200 rounded-xl p-5 shadow-xs">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                      <h4 className="text-base font-bold text-gray-900">Service User Evaluation</h4>
                    </div>
                    <p className="text-xs text-gray-600 mb-4">
                      Record the service user's participation, choices, and views regarding this evaluation.
                    </p>

                    {/* Tick boxes */}
                    <div className="bg-white rounded-lg p-3.5 border border-amber-200/80 mb-4 space-y-2.5">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.serviceUserOption === 'READ'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            serviceUserOption: e.target.checked ? 'READ' : ''
                          }))}
                          className="mt-0.5 w-4 h-4 rounded text-[#224fa6] border-gray-300 focus:ring-[#224fa6]"
                        />
                        <span className="text-xs font-medium text-gray-800">
                          I have read the <strong className="text-gray-900">{getSupportPlanTitle(active)} Support Plan</strong>
                        </span>
                      </label>
                      <div className="flex items-center gap-2 pl-6">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">— OR —</span>
                      </div>
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.serviceUserOption === 'DO_NOT_WISH'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            serviceUserOption: e.target.checked ? 'DO_NOT_WISH' : ''
                          }))}
                          className="mt-0.5 w-4 h-4 rounded text-amber-600 border-gray-300 focus:ring-amber-500"
                        />
                        <span className="text-xs font-medium text-gray-800">
                          I do not wish to be involved in this evaluation
                        </span>
                      </label>
                    </div>

                    {/* Box for Service User views */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Service User's Views</label>
                      <textarea
                        rows={3}
                        placeholder="Record service user's views, comments, feelings, or choices regarding this evaluation..."
                        value={formData.serviceUserViews || ''}
                        onChange={e => setFormData(prev => ({ ...prev, serviceUserViews: e.target.value }))}
                        className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button type="button" onClick={()=>setShowModal(false)} disabled={saving} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70">Cancel</button>
              <button type="button" onClick={save} disabled={saving} className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 transition-all shadow-sm">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">History - {categories.find(c=>c.key===active)?.title}</h3>
                <button type="button" onClick={()=>setShowHistory(false)} className="text-white/80 hover:text-white text-2xl leading-none transition-colors">×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {rows.length === 0 ? (
                <p className="text-sm text-gray-500">No records yet.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Updated</th>
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
                          <td className="py-3 px-4 text-sm text-gray-900">{formatDate(r.createdAt)}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{formatDate(r.updatedAt)}</td>
                          <td className="py-3 px-4 text-sm">
                            {Array.isArray(r.data?.evaluations) && r.data.evaluations.length > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                {r.data.evaluations.length} evaluation{r.data.evaluations.length > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">0 recorded</span>
                            )}
                          </td>
                          <td className="py-3 px-4 space-x-3">
                            <button type="button" onClick={()=>{ openView(r); setShowHistory(false); }} className="text-[#224fa6] hover:text-blue-800 text-sm font-medium">View</button>
                            <button type="button" onClick={()=>deleteRow(r.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
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

      {viewRecord && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{categories.find(c=>c.key===viewRecord.category)?.title || viewRecord.category} Details</h3>
                <p className="text-xs text-blue-100 mt-0.5">Created: {formatDate(viewRecord.createdAt)} | Updated: {formatDate(viewRecord.updatedAt)}</p>
              </div>
              <button type="button" onClick={()=>setViewRecord(null)} className="text-white/80 hover:text-white text-2xl leading-none transition-colors">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Green / Red Evaluation Lifecycle Banner */}
              {(() => {
                const recordStatus = getEvaluationStatus(viewRecord);
                return recordStatus.status === 'RED' ? (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-xs">
                    <div className="leading-none mt-0.5"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
                    <div className="flex-1 text-sm text-red-800">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-red-900">Evaluation Overdue ({recordStatus.sublabel})</p>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-200 text-red-900">RED • Needs Review</span>
                      </div>
                      <p className="text-xs text-red-700 mt-1">
                        This support plan was last evaluated/completed on <strong>{formatDate(recordStatus.refDate)}</strong>. Support plans turn red after 1 month without evaluation. Please complete an evaluation below to return this plan to <strong>Green</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-xs">
                    <div className="leading-none mt-0.5"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
                    <div className="flex-1 text-sm text-emerald-800">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-emerald-900">Support Plan Up to Date ({recordStatus.label})</p>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-200 text-emerald-900">GREEN • Valid</span>
                      </div>
                      <p className="text-xs text-emerald-700 mt-1">
                        Last evaluated/completed on <strong>{formatDate(recordStatus.refDate)}</strong>. Next evaluation recommended on or before <strong>{formatDate(recordStatus.dueDate)}</strong> ({recordStatus.sublabel}).
                      </p>
                    </div>
                  </div>
                );
              })()}
              {/* Linked Risk Assessments in Support Plan view modal */}
              {(() => {
                const targetCategory = viewRecord.category || active;
                const categoryRisks = allRiskAssessments.filter(ra => {
                  const linked = Array.isArray(ra.extra?.linkedSupportPlans) ? ra.extra.linkedSupportPlans : [];
                  return linked.includes(targetCategory);
                });
                return (
                  <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                        <span><Shield className="w-4 h-4 inline" /></span> Linked Risk Assessments ({categoryRisks.length})
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-purple-200 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live Synced
                      </span>
                    </div>
                    {categoryRisks.length > 0 ? (
                      <div className="space-y-2">
                        {categoryRisks.map(ra => (
                          <div key={ra.id} className="bg-white border border-purple-100 rounded-lg p-2.5 flex items-center justify-between text-xs hover:border-purple-300 transition-colors">
                            <div className="pr-3">
                              <p className="font-semibold text-gray-900">{ra.riskType}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                Risk Level: <strong className="text-gray-700">{ra.riskLevel || 'Low'}</strong> | Assessed: {formatDate(ra.lastAssessed)} | By: {ra.conductedBy || 'Staff'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setViewRiskAssessment(ra)}
                              className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold rounded-md text-xs transition-colors cursor-pointer shrink-0"
                            >
                              View Risk Details
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-purple-700/80 italic">
                        No risk assessments currently linked to this support plan.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Question Questionnaire Details */}
              <div className="space-y-4">
                {viewRecord.data && typeof viewRecord.data === 'object' ? (
                  Object.entries(viewRecord.data)
                    .filter(([k]) => k !== 'evaluations' && k !== 'evaluationDate' && k !== 'evaluatorName' && k !== 'evaluationRecord' && k !== 'serviceUserOption' && k !== 'serviceUserViews')
                    .map(([k, v]) => {
                      const fieldDef = fieldsForActive.find(f => f.key === k);
                      const label = fieldDef?.label || k;
                      return (
                        <div key={k} className="border-b border-gray-100 pb-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{Array.isArray(v) ? v.join(', ') : (v || '-')}</p>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-sm text-gray-500">No details available.</p>
                )}
              </div>

              {/* Evaluations Section (All evaluations stay visible permanently) */}
              <div className="pt-6 border-t-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-[#224fa6]"></span>
                    <h4 className="text-lg font-bold text-gray-900">
                      Evaluations History ({Array.isArray(viewRecord.data?.evaluations) ? viewRecord.data.evaluations.length : 0})
                    </h4>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                    All evaluations preserved & visible
                  </span>
                </div>

                {/* List of past evaluations */}
                {!Array.isArray(viewRecord.data?.evaluations) || viewRecord.data.evaluations.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500 mb-6">
                    <p className="font-medium text-gray-700">No evaluations recorded yet.</p>
                    <p className="text-xs text-gray-400 mt-0.5">Use the evaluation box below to record the first evaluation.</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {viewRecord.data.evaluations.map((ev, idx) => {
                      const itemPlanName = ev.planOrAssessmentName || `${getSupportPlanTitle(viewRecord.category || active)} Support Plan`;
                      return (
                        <div key={ev.id || idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                          {/* Evaluation Card Header */}
                          <div className="bg-gradient-to-r from-slate-100 to-gray-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200">
                            <span className="px-2.5 py-0.5 rounded-md bg-[#224fa6] text-white text-xs font-bold">
                              Evaluation #{idx + 1}
                            </span>
                            <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-[#224fa6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                              Recorded: {formatDate(ev.date)}
                            </span>
                          </div>

                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Part 1: Staff Evaluation */}
                            <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-blue-100">
                                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wide">
                                    <User className="w-4 h-4 inline mr-1 text-gray-600" />Staff Evaluation
                                  </span>
                                  <span className="text-xs text-gray-700 font-semibold bg-white px-2 py-0.5 rounded border border-blue-200">
                                    {ev.evaluatorName || 'Staff'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                                  {ev.record || '—'}
                                </p>
                              </div>
                            </div>

                            {/* Part 2: Service User Evaluation */}
                            <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-100 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-100">
                                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                                    <Users className="w-4 h-4 inline mr-1 text-gray-600" />Service User Evaluation
                                  </span>
                                </div>
                                {/* Participation status */}
                                <div className="mb-2">
                                  {ev.serviceUserOption === 'READ' || ev.serviceUserRead ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                      I have read the {itemPlanName}
                                    </span>
                                  ) : ev.serviceUserOption === 'DO_NOT_WISH' || ev.serviceUserDoNotWish ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                      I do not wish to be involved in this evaluation
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-[11px] text-gray-500 italic">
                                      No participation selection recorded
                                    </span>
                                  )}
                                </div>
                                {/* Views */}
                                <div>
                                  <span className="text-[11px] font-semibold text-gray-600 block mb-0.5">Service User's Views:</span>
                                  <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed bg-white/70 p-2 rounded-lg border border-amber-100/80">
                                    {ev.serviceUserViews || <span className="italic text-gray-400">No views recorded</span>}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Evaluation Box */}
                <div className="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div>
                    <h5 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#224fa6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Record New Evaluation
                    </h5>
                    <p className="text-xs text-gray-500 mt-0.5">Add a new evaluation review to this support plan. It will be recorded alongside existing evaluations.</p>
                  </div>

                  {/* Section 1: Staff Evaluation */}
                  <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#224fa6]"></span>
                      <h6 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Staff Evaluation</h6>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Evaluation *</label>
                        <input
                          type="date"
                          value={newEvalDate}
                          onChange={e => setNewEvalDate(e.target.value)}
                          className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Member Completing *</label>
                        <input
                          type="text"
                          placeholder="e.g. Registered Manager / Staff Name"
                          value={newEvaluatorName}
                          onChange={e => setNewEvaluatorName(e.target.value)}
                          className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Evaluation Record *</label>
                      <textarea
                        rows={3}
                        placeholder="Record staff evaluation notes, progress towards outcomes, review observations, or necessary updates..."
                        value={newEvalRecord}
                        onChange={e => setNewEvalRecord(e.target.value)}
                        className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Section 2: Service User Evaluation */}
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      <h6 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Service User Evaluation</h6>
                    </div>
                    <p className="text-[11px] text-gray-600">Record service user involvement, acknowledgement, and feedback for this evaluation.</p>

                    {/* Tick Boxes */}
                    <div className="bg-white rounded-lg p-3 border border-amber-200/80 space-y-2.5">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={newServiceUserOption === 'READ'}
                          onChange={(e) => setNewServiceUserOption(e.target.checked ? 'READ' : '')}
                          className="mt-0.5 w-4 h-4 rounded text-[#224fa6] border-gray-300 focus:ring-[#224fa6]"
                        />
                        <span className="text-xs font-medium text-gray-800">
                          I have read the <strong className="text-gray-900">{getSupportPlanTitle(viewRecord.category || active)} Support Plan</strong>
                        </span>
                      </label>
                      <div className="flex items-center gap-2 pl-6">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">— OR —</span>
                      </div>
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={newServiceUserOption === 'DO_NOT_WISH'}
                          onChange={(e) => setNewServiceUserOption(e.target.checked ? 'DO_NOT_WISH' : '')}
                          className="mt-0.5 w-4 h-4 rounded text-amber-600 border-gray-300 focus:ring-amber-500"
                        />
                        <span className="text-xs font-medium text-gray-800">
                          I do not wish to be involved in this evaluation
                        </span>
                      </label>
                    </div>

                    {/* Box for Service User views */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Service User's Views</label>
                      <textarea
                        rows={3}
                        placeholder="Record service user's views, comments, feelings, or choices regarding this evaluation..."
                        value={newServiceUserViews}
                        onChange={e => setNewServiceUserViews(e.target.value)}
                        className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
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
              <button type="button" onClick={()=>setViewRecord(null)} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
      {/* View Linked Risk Assessment Modal */}
      {viewRiskAssessment && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-[#224fa6] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-base"><Shield className="w-4 h-4 inline" /></span>
                <div>
                  <h3 className="text-xl font-semibold">{viewRiskAssessment.riskType}</h3>
                  <p className="text-xs text-purple-100 mt-0.5">
                    Assessed: {formatDate(viewRiskAssessment.lastAssessed)} | Assessor: {viewRiskAssessment.conductedBy || 'Staff'} | Review: {viewRiskAssessment.reviewFrequency || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewRiskAssessment(null)}
                className="text-white/80 hover:text-white text-2xl leading-none transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Banner */}
              {(() => {
                const raStatus = getEvaluationStatus(viewRiskAssessment);
                return raStatus.status === 'RED' ? (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-xs">
                    <div className="leading-none mt-0.5"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
                    <div className="flex-1 text-sm text-red-800">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-red-900">Evaluation Overdue ({raStatus.sublabel})</p>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-200 text-red-900">RED • Needs Review</span>
                      </div>
                      <p className="text-xs text-red-700 mt-1">
                        Last evaluated on <strong>{formatDate(raStatus.refDate)}</strong>. Overdue for evaluation review.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-xs">
                    <div className="leading-none mt-0.5"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
                    <div className="flex-1 text-sm text-emerald-800">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-emerald-900">Risk Assessment Up to Date ({raStatus.label})</p>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-200 text-emerald-900">GREEN • Valid</span>
                      </div>
                      <p className="text-xs text-emerald-700 mt-1">
                        Last evaluated on <strong>{formatDate(raStatus.refDate)}</strong>. Due: <strong>{formatDate(raStatus.dueDate)}</strong> ({raStatus.sublabel}).
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Linked Plans summary pills */}
              <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-4 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5 mb-2">
                  <FileText className="w-3.5 h-3.5 inline mr-1 text-gray-500" />Linked into Support Plan(s):
                </span>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(viewRiskAssessment.extra?.linkedSupportPlans) && viewRiskAssessment.extra.linkedSupportPlans.length > 0 ? (
                    viewRiskAssessment.extra.linkedSupportPlans.map(key => (
                      <span
                        key={key}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border shadow-2xs ${
                          key === active
                            ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-300'
                            : 'bg-white text-purple-900 border-purple-200'
                        }`}
                      >
                        <span>{key === active ? "Current Plan:" : ""}</span>
                        <span>{getSupportPlanTitle(key)}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 italic">None</span>
                  )}
                </div>
              </div>

              {/* Core Details */}
              <div className="space-y-4">
                {viewRiskAssessment.riskLevel && (
                  <div className="border-b border-gray-100 pb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Risk Level / Score</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                        viewRiskAssessment.riskLevel === 'High' ? 'bg-red-100 text-red-800 border border-red-200' :
                        viewRiskAssessment.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {viewRiskAssessment.riskLevel}
                      </span>
                      {viewRiskAssessment.totalScore && (
                        <span className="text-xs text-gray-600 font-medium">Score: {viewRiskAssessment.totalScore}</span>
                      )}
                    </div>
                  </div>
                )}

                {viewRiskAssessment.whatIsRisk && (
                  <div className="border-b border-gray-100 pb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">What is the Risk? / Primary Hazard</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewRiskAssessment.whatIsRisk}</p>
                  </div>
                )}

                {viewRiskAssessment.actionToTake && (
                  <div className="border-b border-gray-100 pb-3 bg-blue-50/40 p-3 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold text-[#224fa6] uppercase tracking-wide mb-1">Actions & Controls</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewRiskAssessment.actionToTake}</p>
                  </div>
                )}

                {viewRiskAssessment.summary && (
                  <div className="border-b border-gray-100 pb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Summary / Additional Notes</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewRiskAssessment.summary}</p>
                  </div>
                )}

                {/* Questionnaire Answers from extra */}
                {viewRiskAssessment.extra && typeof viewRiskAssessment.extra === 'object' && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-semibold text-gray-800 border-b pb-1">Assessment Answers</h4>
                    {Object.entries(viewRiskAssessment.extra)
                      .filter(([k]) => k !== 'evaluations' && k !== 'evaluationDate' && k !== 'evaluatorName' && k !== 'evaluationRecord' && k !== 'linkedSupportPlans')
                      .map(([k, v]) => (
                        <div key={k} className="border-b border-gray-100 pb-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            {k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {Array.isArray(v) ? v.join(', ') : (v || '-')}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Evaluations History */}
              <div className="pt-4 border-t-2 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#224fa6]"></span>
                    Evaluations History ({Array.isArray(viewRiskAssessment.extra?.evaluations) ? viewRiskAssessment.extra.evaluations.length : 0})
                  </h4>
                </div>
                {!Array.isArray(viewRiskAssessment.extra?.evaluations) || viewRiskAssessment.extra.evaluations.length === 0 ? (
                  <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                    No evaluations recorded yet for this risk assessment.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {viewRiskAssessment.extra.evaluations.map((ev, idx) => (
                      <div key={ev.id || idx} className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs">
                        <div className="flex items-center justify-between border-b border-blue-100 pb-1.5 mb-1.5">
                          <span className="font-bold text-gray-900">
                            Evaluation #{idx + 1} - {ev.evaluatorName || 'Staff'}
                          </span>
                          <span className="text-gray-500">{formatDate(ev.date)}</span>
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap">{ev.record}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  setViewRiskAssessment(null);
                  const el = document.getElementById('risk-assessments-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Open in Risk Assessments Section</span>
                <span>↓</span>
              </button>
              <button
                type="button"
                onClick={() => setViewRiskAssessment(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
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



