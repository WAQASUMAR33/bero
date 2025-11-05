'use client';

import { useEffect, useState } from 'react';

export default function SafeguardingForm({ serviceSeekerId, serviceUserName, onNotification }){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [staff, setStaff] = useState([]);

  const [formData, setFormData] = useState({
    investigatorName:'', serviceUserLocation:'', incidentDate:'', incidentHour:'', incidentMinute:'', preciseLocation:'', incidentOverview:'', incidentDetails:'', witnesses:'', medicalAttentionRequired:'', injuriesDetails:'', decisionReached:'', immediateAction:'', lessonsLearned:'', outsideAgenciesContacted:'', managerRecommendations:'', summary:'', preventionActions:'', conductedBy:'', meetingReportedDate:'', reportedToManagementBy:''
  });

  useEffect(() => { fetchRows(); }, [serviceSeekerId]);
  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => { try{ const res = await fetch('/api/users'); if(res.ok){ setStaff(await res.json()); } }catch(e){ console.error(e); } };

  const fetchRows = async () => {
    if(!serviceSeekerId) return;
    setLoading(true);
    try{ const token = localStorage.getItem('token'); const res = await fetch(`/api/service-seekers/${serviceSeekerId}/safeguarding`,{ headers:{ Authorization:`Bearer ${token}` }}); if(res.ok){ setRows(await res.json()); } }catch(e){ console.error(e); } finally{ setLoading(false); }
  };

  const formatDate = (s) => { if(!s) return '-'; try{ const d = new Date(s); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});}catch{return s||'-'} };

  const openAdd = () => { setFormData({ investigatorName:'', serviceUserLocation:'', incidentDate:'', incidentHour:'', incidentMinute:'', preciseLocation:'', incidentOverview:'', incidentDetails:'', witnesses:'', medicalAttentionRequired:'', injuriesDetails:'', decisionReached:'', immediateAction:'', lessonsLearned:'', outsideAgenciesContacted:'', managerRecommendations:'', summary:'', preventionActions:'', conductedBy:'', meetingReportedDate:'', reportedToManagementBy:'' }); setShowModal(true); };

  const save = async () => { setSaving(true); try{ const token = localStorage.getItem('token'); const res = await fetch(`/api/service-seekers/${serviceSeekerId}/safeguarding`,{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(formData) }); if(res.ok){ await fetchRows(); setShowModal(false); if(onNotification) onNotification({ show:true, message:'Safeguarding record saved.', type:'success' }); } else { const err = await res.json(); if(onNotification) onNotification({ show:true, message: err.error || 'Failed to save.', type:'error' }); } }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Failed to save.', type:'error' }); } finally{ setSaving(false); } };

  const deleteRow = async (id) => { setSaving(true); try{ const token = localStorage.getItem('token'); await fetch(`/api/service-seekers/${serviceSeekerId}/safeguarding?id=${id}`,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` }}); await fetchRows(); if(onNotification) onNotification({ show:true, message:'Deleted.', type:'success' }); }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Delete failed.', type:'error' }); } finally{ setSaving(false); } };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Safeguarding</h2>
          <button type="button" onClick={openAdd} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-colors flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            <span>Add</span>
          </button>
        </div>
      </div>
      
      <div className="p-6">

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">No entries found</p>
          <p className="text-sm text-gray-400">Click Add to create one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Conducted By</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Incident overview</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Modified</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,idx) => (
                <tr key={r.id} className={`border-b border-gray-100 ${idx%2===0?'bg-blue-50':'bg-white'}`}>
                  <td className="py-3 px-4 text-sm text-gray-900">{formatDate(r.incidentDate)}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.conductedBy || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.incidentOverview || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.createdAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.updatedAt)}</td>
                  <td className="py-3 px-4"><button type="button" onClick={()=>deleteRow(r.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button></td>
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
                <h3 className="text-xl font-semibold">Assessment</h3>
                <button type="button" onClick={()=>setShowModal(false)} className="text-white/80 hover:text-white text-2xl leading-none transition-colors">×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Service User</label>
                  <input type="text" value={serviceUserName || ''} disabled className="w-full border rounded-lg px-3 py-2 text-gray-500 bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name of person investigating/completing this form</label>
                  <input type="text" value={formData.investigatorName} onChange={e=>setFormData(prev=>({...prev, investigatorName:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="Referrals Referrals" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Service User location</label>
                  <input type="text" value={formData.serviceUserLocation} onChange={e=>setFormData(prev=>({...prev, serviceUserLocation:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="e.g. Kitchen" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date and time of incident</label>
                  <div className="flex items-center space-x-2">
                    <input type="date" value={formData.incidentDate} onChange={e=>setFormData(prev=>({...prev, incidentDate:e.target.value}))} className="border rounded-lg px-3 py-2 text-gray-900" />
                    <input type="number" min="0" max="23" value={formData.incidentHour} onChange={e=>setFormData(prev=>({...prev, incidentHour:e.target.value}))} className="w-20 border rounded-lg px-3 py-2 text-gray-900" placeholder="HH" />
                    <input type="number" min="0" max="59" value={formData.incidentMinute} onChange={e=>setFormData(prev=>({...prev, incidentMinute:e.target.value}))} className="w-20 border rounded-lg px-3 py-2 text-gray-900" placeholder="MM" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Precise location of incident</label>
                  <input type="text" value={formData.preciseLocation} onChange={e=>setFormData(prev=>({...prev, preciseLocation:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="e.g. Between the fridge and the kitchen door" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Incident overview</label>
                  <input type="text" value={formData.incidentOverview} onChange={e=>setFormData(prev=>({...prev, incidentOverview:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="Summarise the incident in up to 10 words" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Details of incident</label>
                  <textarea value={formData.incidentDetails} onChange={e=>setFormData(prev=>({...prev, incidentDetails:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={4} placeholder="Include description and names of any individuals involved" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name of witness(es)</label>
                  <input type="text" value={formData.witnesses} onChange={e=>setFormData(prev=>({...prev, witnesses:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Was medical attention required?</label>
                  <select value={formData.medicalAttentionRequired} onChange={e=>setFormData(prev=>({...prev, medicalAttentionRequired:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Yes</option><option>No</option></select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Details of any injuries</label>
                  <textarea value={formData.injuriesDetails} onChange={e=>setFormData(prev=>({...prev, injuriesDetails:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} />
                </div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">What decision has been reached as a result of investigating the incident?</label><textarea value={formData.decisionReached} onChange={e=>setFormData(prev=>({...prev, decisionReached:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">What immediate action was taken?</label><textarea value={formData.immediateAction} onChange={e=>setFormData(prev=>({...prev, immediateAction:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">What lessons have been learned from this incident and investigation?</label><textarea value={formData.lessonsLearned} onChange={e=>setFormData(prev=>({...prev, lessonsLearned:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Were any outside agencies contacted?</label><select value={formData.outsideAgenciesContacted} onChange={e=>setFormData(prev=>({...prev, outsideAgenciesContacted:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Yes</option><option>No</option></select></div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Registered Manager recommendations, including Care Plan changes</label><textarea value={formData.managerRecommendations} onChange={e=>setFormData(prev=>({...prev, managerRecommendations:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} placeholder="After speaking to the Registered manager, complete this section" /></div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Summary</label><textarea value={formData.summary} onChange={e=>setFormData(prev=>({...prev, summary:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">What actions will be taken to prevent further incidents?</label><textarea value={formData.preventionActions} onChange={e=>setFormData(prev=>({...prev, preventionActions:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Conducted By</label><select value={formData.conductedBy} onChange={e=>setFormData(prev=>({...prev, conductedBy:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option>{staff.map(s => (<option key={s.id} value={`${s.firstName} ${s.lastName}`}>{s.firstName} {s.lastName}</option>))}</select></div>
                <div><label className="block text-sm text-gray-600 mb-1">Date</label><input type="date" value={formData.meetingReportedDate} onChange={e=>setFormData(prev=>({...prev, meetingReportedDate:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Reported to management meeting by:</label><select value={formData.reportedToManagementBy} onChange={e=>setFormData(prev=>({...prev, reportedToManagementBy:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option>{staff.map(s => (<option key={s.id} value={`${s.firstName} ${s.lastName}`}>{s.firstName} {s.lastName}</option>))}</select></div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button type="button" onClick={()=>setShowModal(false)} disabled={saving} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium">Cancel</button>
              <button type="button" onClick={save} disabled={saving} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


