'use client';

import { useEffect, useState } from 'react';

export default function CalendarForm({ serviceSeekerId, serviceUserName, onNotification }){
  const [visits, setVisits] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('FAMILY'); // FAMILY | PROFESSIONAL | RESIDENT_MEETING
  const [staff, setStaff] = useState([]);

  const [familyForm, setFamilyForm] = useState({ date:'', hour:'', minute:'', announced:'Yes', name:'', relationship:'', purpose:'', summary:'', completed:'No' });
  const [professionalForm, setProfessionalForm] = useState({ date:'', hour:'', minute:'', announced:'Yes', name:'', role:'', purpose:'', summary:'', completed:'No' });
  const [meetingForm, setMeetingForm] = useState({ meetingDate:'', chairedBy:'', about:'', notes:'', actions:'', concerns:'', invites: [] });

  const professionalRoles = ['111 Visit','Adult Transitions Team for Young People with Disabilities (18-25 year olds)','Chiropodist','Clinical Navigation','Clinical Psychologist','District Nurse','Dols','Enrich Team','FCPA','GP','Manager','Paramedic','Pharmacist','Probation Practitioner','Salt','Social Worker','Team Manager'];

  useEffect(() => { fetchAll(); }, [serviceSeekerId]);
  useEffect(() => { fetchStaff(); }, []);

  const fetchAll = async () => {
    if(!serviceSeekerId) return;
    setLoading(true);
    try{
      const token = localStorage.getItem('token');
      const [vRes, mRes] = await Promise.all([
        fetch(`/api/service-seekers/${serviceSeekerId}/calendar/visits`,{ headers:{ Authorization:`Bearer ${token}` }}),
        fetch(`/api/service-seekers/${serviceSeekerId}/calendar/resident-meetings`,{ headers:{ Authorization:`Bearer ${token}` }}),
      ]);
      if(vRes.ok){ setVisits(await vRes.json()); }
      if(mRes.ok){ setMeetings(await mRes.json()); }
    }catch(e){ console.error(e); }
    finally{ setLoading(false); }
  };

  const fetchStaff = async () => {
    try{
      const res = await fetch('/api/users');
      if(res.ok) setStaff(await res.json());
    }catch(e){ console.error(e); }
  };

  const formatDate = (s) => {
    if(!s) return '-';
    try{ const d = new Date(s); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});}catch{return s||'-'}
  };

  const summaryForRow = (row) => {
    if(row.visitType){
      return `${row.visitType === 'FAMILY' ? 'Family' : 'Professional'} visit by ${row.name || 'unknown'} - ${row.purpose || ''}`;
    }
    return `Resident meeting chaired by ${row.chairedBy || 'unknown'}`;
  };

  const allRows = [
    ...visits.map(v => ({ type: v.visitType === 'FAMILY' ? 'Family Visit' : 'Professional Visit', details: summaryForRow(v), createdAt: v.createdAt, id: `visit-${v.id}` })),
    ...meetings.map(m => ({ type: 'Resident Meeting', details: summaryForRow(m), createdAt: m.createdAt, id: `meet-${m.id}` })),
  ].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

  const handleSave = async () => {
    setSaving(true);
    try{
      const token = localStorage.getItem('token');
      if(modalType === 'FAMILY' || modalType === 'PROFESSIONAL'){
        const f = modalType === 'FAMILY' ? familyForm : professionalForm;
        const time = `${(f.hour||'00').toString().padStart(2,'0')}:${(f.minute||'00').toString().padStart(2,'0')}`;
        const res = await fetch(`/api/service-seekers/${serviceSeekerId}/calendar/visits`,{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ visitType: modalType === 'FAMILY' ? 'FAMILY' : 'PROFESSIONAL', date: f.date, time, announced: f.announced, name: f.name, relationship: f.relationship || null, role: f.role || null, purpose: f.purpose, summary: f.summary, completed: f.completed }) });
        if(res.ok){ await fetchAll(); setShowModal(false); if(onNotification) onNotification({ show:true, message:'Visit saved.', type:'success' }); }
        else { const err = await res.json(); if(onNotification) onNotification({ show:true, message: err.error || 'Failed to save visit.', type:'error' }); }
      } else {
        const res = await fetch(`/api/service-seekers/${serviceSeekerId}/calendar/resident-meetings`,{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(meetingForm) });
        if(res.ok){ await fetchAll(); setShowModal(false); if(onNotification) onNotification({ show:true, message:'Resident meeting saved.', type:'success' }); }
        else { const err = await res.json(); if(onNotification) onNotification({ show:true, message: err.error || 'Failed to save meeting.', type:'error' }); }
      }
    }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Failed to save.', type:'error' }); }
    finally{ setSaving(false); }
  };

  const deleteRow = async (rowId) => {
    setSaving(true);
    try{
      const token = localStorage.getItem('token');
      if(rowId.startsWith('visit-')){
        const id = rowId.replace('visit-','');
        await fetch(`/api/service-seekers/${serviceSeekerId}/calendar/visits?id=${id}`,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` }});
      } else {
        const id = rowId.replace('meet-','');
        await fetch(`/api/service-seekers/${serviceSeekerId}/calendar/resident-meetings?id=${id}`,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` }});
      }
      await fetchAll();
      if(onNotification) onNotification({ show:true, message:'Deleted.', type:'success' });
    }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Failed to delete.', type:'error' }); }
    finally{ setSaving(false); }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Calendar</h2>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : allRows.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">No items found</p>
          <p className="text-sm text-gray-400">Click the Add button to add an entry.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Details</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allRows.map((r,idx) => (
                <tr key={r.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.type}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.details}</td>
                  <td className="py-3 px-4">
                    <button type="button" onClick={()=>deleteRow(r.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          <span>Select items to delete</span>
        </div>
        <button type="button" onClick={()=>{ setModalType('FAMILY'); setShowModal(true); }} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          <span>Add</span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <select value={modalType} onChange={e=>setModalType(e.target.value)} className="border rounded-lg px-3 py-2 text-gray-900">
                  <option value="FAMILY">Family Visit</option>
                  <option value="PROFESSIONAL">Professional Visit</option>
                  <option value="RESIDENT_MEETING">Resident Meeting</option>
                </select>
              </div>
              <button type="button" onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {modalType === 'FAMILY' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Service User</label>
                    <input type="text" value={serviceUserName || ''} disabled className="w-full border rounded-lg px-3 py-2 text-gray-500 bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Date</label>
                    <input type="date" value={familyForm.date} onChange={e=>setFamilyForm(prev=>({...prev, date:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div className="flex items-end space-x-2">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Time</label>
                      <input type="number" min="0" max="23" value={familyForm.hour} onChange={e=>setFamilyForm(prev=>({...prev, hour:e.target.value}))} className="w-24 border rounded-lg px-3 py-2 text-gray-900" placeholder="HH" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 invisible">.</label>
                      <input type="number" min="0" max="59" value={familyForm.minute} onChange={e=>setFamilyForm(prev=>({...prev, minute:e.target.value}))} className="w-24 border rounded-lg px-3 py-2 text-gray-900" placeholder="MM" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Announced</label>
                    <select value={familyForm.announced} onChange={e=>setFamilyForm(prev=>({...prev, announced:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option>Yes</option><option>No</option></select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Name</label>
                    <input type="text" value={familyForm.name} onChange={e=>setFamilyForm(prev=>({...prev, name:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Relationship</label>
                    <input type="text" value={familyForm.relationship} onChange={e=>setFamilyForm(prev=>({...prev, relationship:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Purpose</label>
                    <input type="text" value={familyForm.purpose} onChange={e=>setFamilyForm(prev=>({...prev, purpose:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Summary</label>
                    <textarea value={familyForm.summary} onChange={e=>setFamilyForm(prev=>({...prev, summary:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Completed</label>
                    <select value={familyForm.completed} onChange={e=>setFamilyForm(prev=>({...prev, completed:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option>Yes</option><option>No</option></select>
                  </div>
                </div>
              )}

              {modalType === 'PROFESSIONAL' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Service User</label>
                    <input type="text" value={serviceUserName || ''} disabled className="w-full border rounded-lg px-3 py-2 text-gray-500 bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Date</label>
                    <input type="date" value={professionalForm.date} onChange={e=>setProfessionalForm(prev=>({...prev, date:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div className="flex items-end space-x-2">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Time</label>
                      <input type="number" min="0" max="23" value={professionalForm.hour} onChange={e=>setProfessionalForm(prev=>({...prev, hour:e.target.value}))} className="w-24 border rounded-lg px-3 py-2 text-gray-900" placeholder="HH" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 invisible">.</label>
                      <input type="number" min="0" max="59" value={professionalForm.minute} onChange={e=>setProfessionalForm(prev=>({...prev, minute:e.target.value}))} className="w-24 border rounded-lg px-3 py-2 text-gray-900" placeholder="MM" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Announced</label>
                    <select value={professionalForm.announced} onChange={e=>setProfessionalForm(prev=>({...prev, announced:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option>Yes</option><option>No</option></select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Name</label>
                    <input type="text" value={professionalForm.name} onChange={e=>setProfessionalForm(prev=>({...prev, name:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Role</label>
                    <select value={professionalForm.role} onChange={e=>setProfessionalForm(prev=>({...prev, role:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900">
                      <option value="">Please Select</option>
                      {professionalRoles.map(r => (<option key={r} value={r}>{r}</option>))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Purpose</label>
                    <input type="text" value={professionalForm.purpose} onChange={e=>setProfessionalForm(prev=>({...prev, purpose:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Summary</label>
                    <textarea value={professionalForm.summary} onChange={e=>setProfessionalForm(prev=>({...prev, summary:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Completed</label>
                    <select value={professionalForm.completed} onChange={e=>setProfessionalForm(prev=>({...prev, completed:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option>Yes</option><option>No</option></select>
                  </div>
                </div>
              )}

              {modalType === 'RESIDENT_MEETING' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Date</label>
                    <input type="date" value={meetingForm.meetingDate} onChange={e=>setMeetingForm(prev=>({...prev, meetingDate:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Chaired</label>
                    <input type="text" value={meetingForm.chairedBy} onChange={e=>setMeetingForm(prev=>({...prev, chairedBy:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="e.g., Referrals Referrals" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">About</label>
                    <input type="text" value={meetingForm.about || serviceUserName || ''} onChange={e=>setMeetingForm(prev=>({...prev, about:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Notes</label>
                    <textarea value={meetingForm.notes} onChange={e=>setMeetingForm(prev=>({...prev, notes:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Actions</label>
                    <textarea value={meetingForm.actions} onChange={e=>setMeetingForm(prev=>({...prev, actions:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Concerns</label>
                    <textarea value={meetingForm.concerns} onChange={e=>setMeetingForm(prev=>({...prev, concerns:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-2">Invite</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto border rounded-lg p-3">
                      {staff.map(u => (
                        <label key={u.id} className="text-sm text-gray-700 flex items-center space-x-2">
                          <input type="checkbox" checked={meetingForm.invites.includes(`${u.firstName} ${u.lastName}`)} onChange={(e)=>{
                            const name = `${u.firstName} ${u.lastName}`;
                            setMeetingForm(prev=>({ ...prev, invites: e.target.checked ? Array.from(new Set([...(prev.invites||[]), name])) : (prev.invites||[]).filter(x=>x!==name) }));
                          }} />
                          <span>{u.firstName} {u.lastName}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button type="button" onClick={()=>setShowModal(false)} disabled={saving} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="px-6 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


