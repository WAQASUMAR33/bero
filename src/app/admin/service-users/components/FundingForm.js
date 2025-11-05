'use client';

import { useEffect, useState } from 'react';

const paymentTypes = [
  { value: 'BY_PERCENTAGE_SPENT', label: 'Per Percentage Split' },
  { value: 'PER_SHIFT', label: 'Per Shift' },
];

export default function FundingForm({ serviceSeekerId, onNotification }){
  const [rows, setRows] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showManageSources, setShowManageSources] = useState(false);

  const [formData, setFormData] = useState({
    fundingSourceId: '',
    percentageSplit: '',
    contractNumber: '',
    typeOfService: '',
    costNotes: '',
    paymentType: 'BY_PERCENTAGE_SPENT',
  });

  const [newSource, setNewSource] = useState({ name: '', organisation: '', contact: '', email: '', address: '' });

  const formatDate = (s) => {
    if(!s) return '-';
    try{ const d = new Date(s); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});}catch{return s||'-'}
  };

  useEffect(() => { fetchSources(); }, []);
  useEffect(() => { fetchRows(); }, [serviceSeekerId]);

  const fetchSources = async () => {
    try{
      const res = await fetch('/api/funding-sources');
      const data = await res.json();
      if(data.success){
        let items = data.data;
        if(items.length === 0){
          // seed defaults
          const defaults = ['service user','cheshire east','warrington council'];
          for(const name of defaults){ await fetch('/api/funding-sources',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name })}); }
          const again = await fetch('/api/funding-sources');
          const againJson = await again.json();
          items = againJson.data || [];
        }
        setSources(items);
      }
    }catch(e){ console.error(e); }
  };

  const fetchRows = async () => {
    if(!serviceSeekerId) return;
    setLoading(true);
    try{
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/funding`,{ headers:{ Authorization:`Bearer ${token}` }});
      if(res.ok){ const data = await res.json(); setRows(data || []); }
    }catch(e){ console.error(e); }
    finally{ setLoading(false); }
  };

  const openAdd = () => { setFormData({ fundingSourceId:'', percentageSplit:'', contractNumber:'', typeOfService:'', costNotes:'', paymentType:'BY_PERCENTAGE_SPENT' }); setEditingId(null); setShowModal(true); };

  const openEdit = (row) => {
    setFormData({
      fundingSourceId: row.fundingSourceId?.toString() || '',
      percentageSplit: row.percentageSplit?.toString() || '',
      contractNumber: row.contractNumber || '',
      typeOfService: row.typeOfService || '',
      costNotes: row.costNotes || '',
      paymentType: row.paymentType || 'BY_PERCENTAGE_SPENT',
    });
    setEditingId(row.id);
    setShowModal(true);
  };

  const saveRow = async () => {
    setSaving(true);
    try{
      const token = localStorage.getItem('token');
      const method = editingId ? 'PUT' : 'POST';
      const body = { ...formData, ...(editingId ? { id: editingId } : {}) };
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/funding`,{ method, headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(body) });
      if(res.ok){ await fetchRows(); setShowModal(false); if(onNotification) onNotification({ show:true, message: editingId ? 'Funding updated.' : 'Funding added.', type:'success' }); }
      else { const err = await res.json(); if(onNotification) onNotification({ show:true, message: err.error || 'Failed to save funding.', type:'error' }); }
    }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Failed to save funding.', type:'error' }); }
    finally{ setSaving(false); }
  };

  const deleteRow = async (id) => {
    setSaving(true);
    try{
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/funding?id=${id}`,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` }});
      if(res.ok){ await fetchRows(); if(onNotification) onNotification({ show:true, message:'Funding deleted.', type:'success' }); }
    }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Failed to delete funding.', type:'error' }); }
    finally{ setSaving(false); }
  };

  const addSource = async () => {
    try{
      const res = await fetch('/api/funding-sources',{ method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(newSource) });
      const data = await res.json();
      if(data.success){ setNewSource({ name:'', organisation:'', contact:'', email:'', address:'' }); await fetchSources(); }
    }catch(e){ console.error(e); }
  };

  const deleteSource = async (id) => {
    try{ await fetch(`/api/funding-sources?id=${id}`,{ method:'DELETE' }); await fetchSources(); }catch(e){ console.error(e); }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <h2 className="text-xl font-semibold">Funding</h2>
      </div>
      
      <div className="p-6">

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">No funding added</p>
          <p className="text-sm text-gray-400">Click the Add button to add funding.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Funding Source</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Percentage Split</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contract Number</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type Of Service</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Funder Cost Notes</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Funder Pays</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Modified</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,idx) => (
                <tr key={r.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.fundingSource?.name || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.percentageSplit ?? '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.contractNumber || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.typeOfService || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.costNotes || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{paymentTypes.find(p=>p.value===r.paymentType)?.label || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.createdAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.updatedAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <button type="button" onClick={()=>openEdit(r)} className="text-[#224fa6] hover:text-[#224fa6]/80 text-sm">Edit</button>
                      <button type="button" onClick={()=>deleteRow(r.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            <span>Select items to delete or edit</span>
          </div>
          <button type="button" onClick={openAdd} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-lg hover:from-[#1a3d85] hover:to-[#2859c7] transition-all shadow-md hover:shadow-lg font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            <span>Add</span>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{editingId ? 'Edit Funding' : 'Add Funding'}</h3>
              <button type="button" onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Funding Source</label>
                    <select value={formData.fundingSourceId} onChange={e=>setFormData(prev=>({...prev, fundingSourceId:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900">
                      <option value="">Please Select</option>
                      {sources.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                    </select>
                  </div>
                  <button type="button" onClick={()=>setShowManageSources(true)} className="h-10 px-3 border rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50">Manage</button>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Percentage Split</label>
                  <input type="number" value={formData.percentageSplit} onChange={e=>setFormData(prev=>({...prev, percentageSplit:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="e.g., 100" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Contract Number</label>
                  <input type="text" value={formData.contractNumber} onChange={e=>setFormData(prev=>({...prev, contractNumber:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Type Of Service</label>
                  <input type="text" value={formData.typeOfService} onChange={e=>setFormData(prev=>({...prev, typeOfService:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Funder Cost Notes</label>
                  <textarea value={formData.costNotes} onChange={e=>setFormData(prev=>({...prev, costNotes:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Funder Pays</label>
                  <select value={formData.paymentType} onChange={e=>setFormData(prev=>({...prev, paymentType:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900">
                    {paymentTypes.map(p => (<option key={p.value} value={p.value}>{p.label}</option>))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button type="button" onClick={()=>setShowModal(false)} disabled={saving} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium">Cancel</button>
              <button type="button" onClick={saveRow} disabled={saving || !formData.fundingSourceId} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {showManageSources && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Manage Funding Sources</h3>
                <button type="button" onClick={()=>setShowManageSources(false)} className="text-white/80 hover:text-white text-2xl leading-none transition-colors">×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {sources.map(s => (
                <div key={s.id} className="border rounded-lg px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.name}</p>
                    {(s.organisation || s.contact || s.email) && (
                      <p className="text-xs text-gray-500">{[s.organisation,s.contact,s.email].filter(Boolean).join(' • ')}</p>
                    )}
                  </div>
                  <button type="button" onClick={()=>deleteSource(s.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              ))}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Add new funding source</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Organisation</label>
                    <input type="text" value={newSource.name} onChange={e=>setNewSource(prev=>({...prev, name:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="e.g., Service User" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Contact</label>
                    <input type="text" value={newSource.contact} onChange={e=>setNewSource(prev=>({...prev, contact:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input type="email" value={newSource.email} onChange={e=>setNewSource(prev=>({...prev, email:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Address</label>
                    <textarea value={newSource.address} onChange={e=>setNewSource(prev=>({...prev, address:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={2} />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={addSource} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] transition-all shadow-md hover:shadow-lg">Add</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


