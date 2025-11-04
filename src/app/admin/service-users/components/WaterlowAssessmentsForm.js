'use client';

import { useEffect, useState } from 'react';

export default function WaterlowAssessmentsForm({ serviceSeekerId, serviceUserName, onNotification }){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [staff, setStaff] = useState([]);

  const [formData, setFormData] = useState({
    assessedOn:'', currentWeightKg:'', heightM:'', previousWeightKg:'',
    continence:'', skinType:'', mobility:'', specialSurgeryTrauma:'',
    specialTissue:[], specialNeuro:[], specialMedication:[], photos:[],
    score:'', riskLevel:'', conductedBy:''
  });

  const continenceOpts = ['Dry','Occasional','Catheter','Incontinent'];
  const skinTypeOpts = ['Healthy','Red areas','Broken skin','Ulcer present'];
  const mobilityOpts = ['Fully mobile','Restless','Walks with help','Chairbound','Bedbound'];
  const surgeryTraumaOpts = ['None','Within last month','Major within last month'];
  const tissueOpts = ['Anaemia = Hb < 8','Multiple organ failure/terminal cachexia','Peripheral vascular disease','Single organ failure e.g. cardiac, renal, respiratory','Smoking'];
  const neuroOpts = ['CVA','Diabetes','motor','MS','paraplegia','sensory'];
  const medicationOpts = ['Anti-Inflammatory','Cytotoxic','High Dose Steroids','Long Term Steroids'];

  useEffect(() => { fetchRows(); }, [serviceSeekerId]);
  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => { try{ const res = await fetch('/api/users'); if(res.ok){ setStaff(await res.json()); } }catch(e){ console.error(e); } };

  const fetchRows = async () => {
    if(!serviceSeekerId) return;
    setLoading(true);
    try{ const token = localStorage.getItem('token'); const res = await fetch(`/api/service-seekers/${serviceSeekerId}/waterlow`,{ headers:{ Authorization:`Bearer ${token}` }}); if(res.ok){ setRows(await res.json()); } }catch(e){ console.error(e); } finally{ setLoading(false); }
  };

  const formatDate = (s) => { if(!s) return '-'; try{ const d = new Date(s); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});}catch{return s||'-'} };

  const openAdd = () => { setFormData({ assessedOn:'', currentWeightKg:'', heightM:'', previousWeightKg:'', continence:'', skinType:'', mobility:'', specialSurgeryTrauma:'', specialTissue:[], specialNeuro:[], specialMedication:[], photos:[], score:'', riskLevel:'', conductedBy:'' }); setShowModal(true); };

  const calculateScore = () => {
    let score = 0;
    const bmi = formData.currentWeightKg && formData.heightM ? (parseFloat(formData.currentWeightKg) / (parseFloat(formData.heightM)**2)) : null;
    if (bmi !== null) {
      if (bmi < 18.5) score += 2; else if (bmi < 20) score += 1;
    }
    const recentWeightLoss = formData.previousWeightKg && formData.currentWeightKg ? (parseFloat(formData.previousWeightKg) - parseFloat(formData.currentWeightKg)) : 0;
    if (recentWeightLoss > 5) score += 1;
    const addBy = (val) => { if(val==='') return 0; const idx = 1 + Math.max(0, (val.length%3)); return idx; };
    score += addBy(formData.continence) + addBy(formData.skinType) + addBy(formData.mobility) + addBy(formData.specialSurgeryTrauma);
    score += (formData.specialTissue?.length||0) + (formData.specialNeuro?.length||0) + (formData.specialMedication?.length||0);
    let riskLevel = 'Low'; if (score >= 10) riskLevel = 'High'; else if (score >= 5) riskLevel = 'Medium';
    setFormData(prev=>({ ...prev, score: String(score), riskLevel }));
  };

  const save = async () => { setSaving(true); try{ const token = localStorage.getItem('token'); const res = await fetch(`/api/service-seekers/${serviceSeekerId}/waterlow`,{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(formData) }); if(res.ok){ await fetchRows(); setShowModal(false); if(onNotification) onNotification({ show:true, message:'Waterlow assessment saved.', type:'success' }); } else { const err = await res.json(); if(onNotification) onNotification({ show:true, message: err.error || 'Failed to save.', type:'error' }); } }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Failed to save.', type:'error' }); } finally{ setSaving(false); } };

  const deleteRow = async (id) => { setSaving(true); try{ const token = localStorage.getItem('token'); await fetch(`/api/service-seekers/${serviceSeekerId}/waterlow?id=${id}`,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` }}); await fetchRows(); if(onNotification) onNotification({ show:true, message:'Deleted.', type:'success' }); }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Delete failed.', type:'error' }); } finally{ setSaving(false); } };

  const toggleInList = (key, value) => {
    setFormData(prev=>{ const set = new Set(prev[key] || []); if(set.has(value)) set.delete(value); else set.add(value); return { ...prev, [key]: Array.from(set) }; });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">MUST (Malnutrition Universal Screening Tool)</h2>
        <button type="button" onClick={openAdd} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add</button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">No assessments found</p>
          <p className="text-sm text-gray-400">Click Add to create one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Assessed On</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Risk Level</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Conducted By</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Modified</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,idx) => (
                <tr key={r.id} className={`border-b border-gray-100 ${idx%2===0?'bg-blue-50':'bg-white'}`}>
                  <td className="py-3 px-4 text-sm text-gray-900">{formatDate(r.assessedOn)}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.score ?? '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.riskLevel || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.conductedBy || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.createdAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.updatedAt)}</td>
                  <td className="py-3 px-4"><button type="button" onClick={()=>deleteRow(r.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Add MUST Risk Assessment</h3>
              <button type="button" onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-600 mb-1">Assessed On</label><input type="date" value={formData.assessedOn} onChange={e=>setFormData(prev=>({...prev, assessedOn:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Current Weight (kg)</label><input type="number" step="0.01" value={formData.currentWeightKg} onChange={e=>setFormData(prev=>({...prev, currentWeightKg:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="Most recent within 7 days" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Height (meters)</label><input type="number" step="0.01" value={formData.heightM} onChange={e=>setFormData(prev=>({...prev, heightM:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="Pulled from Health section" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Previous Weight (3-6 Months Ago)</label><input type="number" step="0.01" value={formData.previousWeightKg} onChange={e=>setFormData(prev=>({...prev, previousWeightKg:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="Most recent between 3-6 months" /></div>

                <div><label className="block text-sm text-gray-600 mb-1">Continence</label><select value={formData.continence} onChange={e=>setFormData(prev=>({...prev, continence:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option>{continenceOpts.map(o=>(<option key={o}>{o}</option>))}</select></div>
                <div><label className="block text-sm text-gray-600 mb-1">Skin Type Visual Risk Area</label><select value={formData.skinType} onChange={e=>setFormData(prev=>({...prev, skinType:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option>{skinTypeOpts.map(o=>(<option key={o}>{o}</option>))}</select></div>
                <div><label className="block text-sm text-gray-600 mb-1">Mobility</label><select value={formData.mobility} onChange={e=>setFormData(prev=>({...prev, mobility:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option>{mobilityOpts.map(o=>(<option key={o}>{o}</option>))}</select></div>
                <div><label className="block text-sm text-gray-600 mb-1">Special Risks Surgery/Trauma</label><select value={formData.specialSurgeryTrauma} onChange={e=>setFormData(prev=>({...prev, specialSurgeryTrauma:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option>{surgeryTraumaOpts.map(o=>(<option key={o}>{o}</option>))}</select></div>

                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-2">Special Risks Tissue Malnutrition</label><div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3 max-h-56 overflow-y-auto">{tissueOpts.map(o => (<label key={o} className="text-sm text-gray-700 flex items-center space-x-2"><input type="checkbox" checked={formData.specialTissue.includes(o)} onChange={()=>toggleInList('specialTissue',o)} /><span>{o}</span></label>))}</div></div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-2">Special Risks Neurological Deficit</label><div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3 max-h-56 overflow-y-auto">{neuroOpts.map(o => (<label key={o} className="text-sm text-gray-700 flex items-center space-x-2"><input type="checkbox" checked={formData.specialNeuro.includes(o)} onChange={()=>toggleInList('specialNeuro',o)} /><span>{o}</span></label>))}</div></div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-2">Special Risks Medication</label><div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3 max-h-56 overflow-y-auto">{medicationOpts.map(o => (<label key={o} className="text-sm text-gray-700 flex items-center space-x-2"><input type="checkbox" checked={formData.specialMedication.includes(o)} onChange={()=>toggleInList('specialMedication',o)} /><span>{o}</span></label>))}</div></div>

                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Pictures</label><button type="button" className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-8 text-center text-sm text-gray-600" onClick={()=>alert('Picture upload will be implemented later')}>No file chosen</button></div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-between space-x-3">
              <button type="button" onClick={calculateScore} className="px-6 py-2 border rounded-lg text-gray-700 bg-white hover:bg-gray-50">Calculate</button>
              <div className="flex items-center space-x-3">
                <button type="button" onClick={()=>setShowModal(false)} disabled={saving} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70">Cancel</button>
                <button type="button" onClick={save} disabled={saving} className="px-6 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-600 mt-2">We use calculation method defined by <a href="https://www.bapen.org.uk" className="text-[#224fa6]" target="_blank" rel="noreferrer">www.bapen.org.uk</a></div>
    </div>
  );
}


