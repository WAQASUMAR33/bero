'use client';

import { useEffect, useMemo, useState } from 'react';

const categories = [
  { key: 'ABOUT_ME', title: 'About me' },
  { key: 'PHYSICAL_HEALTH', title: 'My Physical Health' },
  { key: 'MENTAL_HEALTH', title: 'Mental Health' },
  { key: 'COMMUNICATION', title: 'Communication' },
  { key: 'ORAL_CARE', title: 'My Oral Care' },
  { key: 'SKIN_INTEGRITY', title: 'Skin Integrity' },
  { key: 'MEDICATION', title: 'Medication' },
  { key: 'NUTRITION_HYDRATION', title: 'Nutrition & Hydration' },
  { key: 'CONTINENCE_CARE', title: 'Continence Care' },
  { key: 'MOBILITY', title: 'Mobility' },
  { key: 'MY_NEEDS_SUPPORT', title: 'My Needs/Support' },
  { key: 'DECISION_MAKING', title: 'Decision making' },
  { key: 'EMOTIONAL_SUPPORT', title: 'Emotional Support' },
];

export default function OutcomesForm({ serviceSeekerId, onNotification }){
  const [active, setActive] = useState('ABOUT_ME');
  const [rows, setRows] = useState([]); // history for active
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [formData, setFormData] = useState({});

  useEffect(() => { fetchRows(active); }, [serviceSeekerId, active]);

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
    setFormData({});
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    try{
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/outcomes`,{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ category: active, data: formData }) });
      if(res.ok){ await fetchRows(active); setShowModal(false); if(onNotification) onNotification({ show:true, message:'Saved.', type:'success' }); }
      else { const err = await res.json(); if(onNotification) onNotification({ show:true, message: err.error || 'Failed to save.', type:'error' }); }
    }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Failed to save.', type:'error' }); }
    finally{ setSaving(false); }
  };

  const deleteRow = async (id) => {
    setSaving(true);
    try{
      const token = localStorage.getItem('token');
      await fetch(`/api/service-seekers/${serviceSeekerId}/outcomes?id=${id}`,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` }});
      await fetchRows(active);
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
      default:
        return [];
    }
  }, [active]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Outcomes</h2>
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

      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(c => (
          <button key={c.key} type="button" onClick={()=>setActive(c.key)} className={`px-3 py-2 rounded-lg text-sm ${active===c.key? 'bg-[#224fa6] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{c.title}</button>
        ))}
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
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Updated</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0,1).map(r => (
                <tr key={r.id} className="border-b border-gray-100 bg-blue-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{formatDate(r.createdAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{formatDate(r.updatedAt)}</td>
                  <td className="py-3 px-4">
                    <button type="button" onClick={()=>deleteRow(r.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
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
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button type="button" onClick={()=>setShowModal(false)} disabled={saving} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70">Cancel</button>
              <button type="button" onClick={save} disabled={saving} className="px-6 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
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
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Updated</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-900">{formatDate(r.createdAt)}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{formatDate(r.updatedAt)}</td>
                        <td className="py-3 px-4"><button type="button" onClick={()=>deleteRow(r.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


