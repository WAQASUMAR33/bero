'use client';

import { useEffect, useMemo, useState } from 'react';

export default function ContactsForm({ serviceSeekerId, onNotification }){
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const defaultProfessionalRoles = [
    '111 Visit',
    'Adult Transitions Team for Young People with Disabilities (18-25 year olds)',
    'Chiropodist',
    'Clinical Navigation',
    'Clinical Psychologist',
    'District Nurse',
    'Dols',
    'Enrich Team',
    'FCPA',
    'GP',
    'Manager',
    'Paramedic',
    'Pharmacist',
    'Probation Practitioner',
    'Salt',
    'Social Worker',
    'Team Manager',
  ];

  const [roleOptions, setRoleOptions] = useState(() => {
    if (typeof window === 'undefined') return defaultProfessionalRoles;
    try {
      // prefer new key; fall back to legacy if present
      const raw = localStorage.getItem('professionalRoleOptions') || localStorage.getItem('contactRoleOptions');
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultProfessionalRoles;
    } catch {
      return defaultProfessionalRoles;
    }
  });
  const [showManageRoles, setShowManageRoles] = useState(false);

  const [formData, setFormData] = useState({
    contactType: 'FAMILY',
    name: '',
    role: '',
    otherRole: '',
    mobile: '',
    work: '',
    home: '',
    email: '',
    address: '',
    practiceCode: '',
    emergencyContact: false,
    pictureUrl: '',
  });

  const isProfessional = formData.contactType === 'PROFESSIONAL';
  const showOtherRole = formData.role === 'Other';

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});
    } catch {
      return dateStr || '-';
    }
  };

  useEffect(() => { fetchContacts(); }, [serviceSeekerId]);

  const persistRoleOptions = (opts) => {
    setRoleOptions(opts);
    try { localStorage.setItem('professionalRoleOptions', JSON.stringify(opts)); } catch {}
  };

  const fetchContacts = async () => {
    if(!serviceSeekerId) return;
    setLoading(true);
    try{
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/contacts`,{ headers: { Authorization: `Bearer ${token}` }});
      if(res.ok){
        const data = await res.json();
        setContacts(data || []);
      }
    }catch(e){ console.error(e); }
    finally{ setLoading(false); }
  };

  const resetForm = () => {
    setFormData({
      contactType: 'FAMILY', name:'', role:'', otherRole:'', mobile:'', work:'', home:'', email:'', address:'', practiceCode:'', emergencyContact:false, pictureUrl:''
    });
    setEditingId(null);
  };

  const handleAdd = () => { resetForm(); setShowModal(true); };

  const handleEdit = (item) => {
    setFormData({
      contactType: item.contactType || 'FAMILY',
      name: item.name || '',
      role: item.role || '',
      otherRole: item.otherRole || '',
      mobile: item.mobile || '',
      work: item.work || '',
      home: item.home || '',
      email: item.email || '',
      address: item.address || '',
      practiceCode: item.practiceCode || '',
      emergencyContact: !!item.emergencyContact,
      pictureUrl: item.pictureUrl || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try{
      const token = localStorage.getItem('token');
      const url = `/api/service-seekers/${serviceSeekerId}/contacts`;
      const method = editingId ? 'PUT' : 'POST';
      const payload = { ...formData, ...(editingId ? { id: editingId } : {}) };
      const res = await fetch(url,{ method, headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      if(res.ok){
        await fetchContacts();
        setShowModal(false);
        if(onNotification){ onNotification({ show:true, message: editingId ? 'Contact updated.' : 'Contact added.', type:'success' }); }
      } else {
        const err = await res.json();
        if(onNotification){ onNotification({ show:true, message: err.error || 'Failed to save contact.', type:'error' }); }
      }
    }catch(e){
      console.error(e);
      if(onNotification){ onNotification({ show:true, message: 'Failed to save contact.', type:'error' }); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if(!contactToDelete) return;
    setSaving(true);
    try{
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/contacts?id=${contactToDelete}`,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` }});
      if(res.ok){
        await fetchContacts();
        setShowDeleteConfirm(false);
        setContactToDelete(null);
        if(onNotification){ onNotification({ show:true, message:'Contact deleted.', type:'success' }); }
      }else{
        const err = await res.json();
        if(onNotification){ onNotification({ show:true, message: err.error || 'Failed to delete contact.', type:'error' }); }
      }
    }catch(e){ console.error(e); if(onNotification){ onNotification({ show:true, message:'Failed to delete contact.', type:'error' }); } }
    finally{ setSaving(false); }
  };

  const formatTypeIcon = (type) => {
    return type === 'PROFESSIONAL' ? '👨‍⚕️' : '👨‍👩‍👧‍👦';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <h2 className="text-xl font-semibold">Family, Doctor, Contacts</h2>
      </div>
      
      <div className="p-6">

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">No contacts found</p>
          <p className="text-sm text-gray-400">Click the Add button to add a contact.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Mobile</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Work</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Home</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Modified</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c,idx) => (
                <tr key={c.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                  <td className="py-3 px-4 text-sm text-gray-900">{formatTypeIcon(c.contactType)}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{c.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{c.role || c.otherRole || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{c.mobile || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{c.work || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{c.home || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{c.email || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(c.createdAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(c.updatedAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <button type="button" onClick={() => handleEdit(c)} className="text-[#224fa6] hover:text-[#224fa6]/80 text-sm">Edit</button>
                      <button type="button" onClick={() => { setContactToDelete(c.id); setShowDeleteConfirm(true); }} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <span>Select items to delete or edit</span>
          </div>
          <button type="button" onClick={handleAdd} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-lg hover:from-[#1a3d85] hover:to-[#2859c7] transition-all shadow-md hover:shadow-lg font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>Add</span>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{editingId ? 'Edit Contact' : 'Add Contact'}</h3>
                <button type="button" onClick={() => { setShowModal(false); }} className="text-white/80 hover:text-white text-2xl leading-none transition-colors">×</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input type="radio" checked={formData.contactType==='FAMILY'} onChange={() => setFormData(prev => ({...prev, contactType:'FAMILY'}))} />
                    <span>Family</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input type="radio" checked={formData.contactType==='PROFESSIONAL'} onChange={() => setFormData(prev => ({...prev, contactType:'PROFESSIONAL'}))} />
                    <span>Professional</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Name</label>
                    <input type="text" value={formData.name} onChange={e=>setFormData(prev=>({...prev,name:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder={isProfessional ? 'Eg. Dr. John Smith' : 'Eg. John Smith'} />
                  </div>
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Role</label>
                      <select value={formData.role} onChange={e=>setFormData(prev=>({...prev, role:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900">
                        <option value="">Please Select</option>
                        {roleOptions.concat(['Other']).map(r => (<option key={r} value={r}>{r}</option>))}
                      </select>
                    </div>
                    {isProfessional && (
                      <button type="button" onClick={()=>setShowManageRoles(true)} className="h-10 px-3 border rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50">Manage</button>
                    )}
                  </div>
                  {showOtherRole && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Other Role</label>
                      <input type="text" value={formData.otherRole} onChange={e=>setFormData(prev=>({...prev, otherRole:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Mobile</label>
                    <input type="text" value={formData.mobile} onChange={e=>setFormData(prev=>({...prev, mobile:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Work</label>
                    <input type="text" value={formData.work} onChange={e=>setFormData(prev=>({...prev, work:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Home</label>
                    <input type="text" value={formData.home} onChange={e=>setFormData(prev=>({...prev, home:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={e=>setFormData(prev=>({...prev, email:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Address</label>
                    <textarea value={formData.address} onChange={e=>setFormData(prev=>({...prev, address:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={2} />
                  </div>
                  {isProfessional && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Practice Code</label>
                      <input type="text" value={formData.practiceCode} onChange={e=>setFormData(prev=>({...prev, practiceCode:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Emergency Contact?</label>
                    <select value={formData.emergencyContact ? 'Yes' : 'No'} onChange={e=>setFormData(prev=>({...prev, emergencyContact: e.target.value==='Yes'}))} className="w-full border rounded-lg px-3 py-2 text-gray-900">
                      <option>No</option>
                      <option>Yes</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Picture</label>
                    <button type="button" className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-8 text-center hover:border-gray-400 transition-colors" onClick={() => alert('Picture upload will be implemented later')}>
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <span className="text-sm text-gray-600">Click to upload picture</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button type="button" onClick={()=>setShowModal(false)} disabled={saving} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="px-6 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {showManageRoles && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Manage Roles</h3>
              <button type="button" onClick={()=>setShowManageRoles(false)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-3">
              {roleOptions.map((r,idx) => (
                <div key={idx} className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-800">{r}</span>
                  <button type="button" onClick={()=>{ const next = roleOptions.filter(x=>x!==r); persistRoleOptions(next); }} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input type="text" id="newRoleInput" placeholder="Add new role" className="flex-1 border rounded-lg px-3 py-2 text-gray-900" />
                <button type="button" onClick={()=>{ const el = document.getElementById('newRoleInput'); const val = (el?.value||'').trim(); if(!val) return; if(roleOptions.includes(val)) return; const next = [...roleOptions, val]; persistRoleOptions(next); el.value=''; }} className="px-3 py-2 bg-[#224fa6] text-white rounded-lg">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">Are you sure you want to delete this contact? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={()=>{ setShowDeleteConfirm(false); setContactToDelete(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                <button type="button" onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70">{saving ? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


