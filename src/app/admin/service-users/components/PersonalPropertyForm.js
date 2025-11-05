'use client';

import { useEffect, useState } from 'react';

export default function PersonalPropertyForm({ serviceSeekerId, serviceUserName, onNotification }){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [staff, setStaff] = useState([]);
  const [archived, setArchived] = useState('false');
  const [formData, setFormData] = useState({ item:'', pictureUrl:'', enteredBy:'' });

  useEffect(() => { fetchRows(); }, [serviceSeekerId, archived]);
  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => { try{ const res = await fetch('/api/users'); if(res.ok){ setStaff(await res.json()); } }catch(e){ console.error(e); } };

  const fetchRows = async () => {
    if(!serviceSeekerId) return;
    setLoading(true);
    try{ const token = localStorage.getItem('token'); const res = await fetch(`/api/service-seekers/${serviceSeekerId}/personal-property?archived=${archived}`,{ headers:{ Authorization:`Bearer ${token}` }}); if(res.ok){ setRows(await res.json()); } }catch(e){ console.error(e); } finally{ setLoading(false); }
  };

  const formatDate = (s) => { if(!s) return '-'; try{ const d = new Date(s); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});}catch{return s||'-'} };

  const openAdd = () => { setFormData({ item:'', pictureUrl:'', enteredBy:'' }); setShowModal(true); };

  const save = async () => { setSaving(true); try{ const token = localStorage.getItem('token'); const res = await fetch(`/api/service-seekers/${serviceSeekerId}/personal-property`,{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(formData) }); if(res.ok){ await fetchRows(); setShowModal(false); if(onNotification) onNotification({ show:true, message:'Item added.', type:'success' }); } else { const err = await res.json(); if(onNotification) onNotification({ show:true, message: err.error || 'Failed to add item.', type:'error' }); } }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Failed to add item.', type:'error' }); } finally{ setSaving(false); } };

  const archiveRow = async (id) => { setSaving(true); try{ const token = localStorage.getItem('token'); await fetch(`/api/service-seekers/${serviceSeekerId}/personal-property?id=${id}`,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` }}); await fetchRows(); if(onNotification) onNotification({ show:true, message:'Item archived.', type:'success' }); }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Failed to archive.', type:'error' }); } finally{ setSaving(false); } };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Personal Property</h2>
          <button type="button" onClick={openAdd} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-colors flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            <span>Add</span>
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <label className="text-sm text-gray-700">Archived</label>
          <select value={archived} onChange={e=>setArchived(e.target.value)} className="border rounded-lg px-3 py-2 text-gray-900">
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">No items</p>
          <p className="text-sm text-gray-400">Click Add to add a personal property item.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Entered By</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Modified</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Deleted</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,idx) => (
                <tr key={r.id} className={`border-b border-gray-100 ${idx%2===0?'bg-blue-50':'bg-white'}`}>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.item}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.enteredBy || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.createdAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.updatedAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.archived ? 'Yes' : 'No'}</td>
                  <td className="py-3 px-4"><button type="button" onClick={()=>archiveRow(r.id)} className="text-red-600 hover:text-red-800 text-sm">Archive</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Add Item</h3>
                <button type="button" onClick={()=>setShowModal(false)} className="text-white/80 hover:text-white text-2xl leading-none transition-colors">×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-600 mb-1">Item</label><input type="text" value={formData.item} onChange={e=>setFormData(prev=>({...prev, item:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Entered By</label><select value={formData.enteredBy} onChange={e=>setFormData(prev=>({...prev, enteredBy:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option>{staff.map(s => (<option key={s.id} value={`${s.firstName} ${s.lastName}`}>{s.firstName} {s.lastName}</option>))}</select></div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Picture</label><button type="button" className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-8 text-center text-sm text-gray-600" onClick={()=>alert('Picture upload will be implemented later')}>Choose file (not yet implemented)</button></div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button type="button" onClick={()=>setShowModal(false)} disabled={saving} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium">Cancel</button>
              <button type="button" onClick={save} disabled={saving || !formData.item} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


