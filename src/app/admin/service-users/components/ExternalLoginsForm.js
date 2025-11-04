'use client';

import { useEffect, useState } from 'react';

export default function ExternalLoginsForm({ serviceSeekerId, onNotification }){
  const [rows, setRows] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [formData, setFormData] = useState({ profileId:'', showRota:'true', showAllowance:'true', showCarePlan:'true', showDailyNotes:'false', showMarChart:'false' });
  const [profileData, setProfileData] = useState({ firstName:'', lastName:'', type:'family', email:'', password:'', picture:null });
  const [showPassword, setShowPassword] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [loginTypes, setLoginTypes] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('externalLoginTypes');
      return saved ? JSON.parse(saved) : ['family', 'professional'];
    }
    return ['family', 'professional'];
  });

  useEffect(() => { fetchAll(); }, [serviceSeekerId]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('externalLoginTypes', JSON.stringify(loginTypes));
    }
  }, [loginTypes]);

  const fetchAll = async () => {
    if(!serviceSeekerId) return;
    setLoading(true);
    try{
      const token = localStorage.getItem('token');
      const [rRes, pRes, uRes, accRes] = await Promise.all([
        fetch(`/api/service-seekers/${serviceSeekerId}/external-logins`,{ headers:{ Authorization:`Bearer ${token}` }}),
        fetch('/api/external-login-profiles'),
        fetch('/api/users'),
        fetch(`/api/service-seekers/${serviceSeekerId}/external-inbox-access`,{ headers:{ Authorization:`Bearer ${token}` }}),
      ]);
      if(rRes.ok) setRows(await rRes.json());
      if(pRes.ok) setProfiles(await pRes.json());
      if(uRes.ok) setUsers(await uRes.json());
      if(accRes.ok){ const arr = await accRes.json(); setSelectedUserIds(arr.map(a=>a.userId)); }
    }catch(e){ console.error(e); }
    finally{ setLoading(false); }
  };

  const formatDate = (s) => { if(!s) return '-'; try{ const d = new Date(s); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});}catch{return s||'-'} };

  const openAdd = () => { setFormData({ profileId:'', showRota:'true', showAllowance:'true', showCarePlan:'true', showDailyNotes:'false', showMarChart:'false' }); setShowModal(true); };
  
  const openProfileModal = () => { 
    setProfileData({ firstName:'', lastName:'', type:loginTypes[0] || 'family', email:'', password:'', picture:null }); 
    setShowProfileModal(true); 
  };

  const createProfile = async () => {
    if(!profileData.firstName || !profileData.lastName || !profileData.email || !profileData.password) {
      if(onNotification) onNotification({ show:true, message:'Please fill all required fields.', type:'error' });
      return;
    }
    setSaving(true);
    try{
      const res = await fetch('/api/external-login-profiles',{ method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(profileData) });
      if(res.ok){ 
        await fetchAll(); 
        setShowProfileModal(false); 
        setProfileData({ firstName:'', lastName:'', type:loginTypes[0] || 'family', email:'', password:'', picture:null });
        if(onNotification) onNotification({ show:true, message:'Login created.', type:'success' }); 
      } else {
        const error = await res.json();
        if(onNotification) onNotification({ show:true, message: error.error || 'Failed to create login.', type:'error' });
      }
    }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Failed to create login.', type:'error' }); }
    finally{ setSaving(false); }
  };

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if(file) {
      // For now, just store the filename - backend integration will be added later
      setProfileData(prev => ({ ...prev, picture: file.name }));
      if(onNotification) onNotification({ show:true, message:'Picture upload will be integrated with backend.', type:'info' });
    }
  };

  const saveLogin = async () => {
    setSaving(true);
    try{
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/external-logins`,{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(formData) });
      if(res.ok){ await fetchAll(); setShowModal(false); if(onNotification) onNotification({ show:true, message:'External login saved.', type:'success' }); }
    }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Failed to save.', type:'error' }); }
    finally{ setSaving(false); }
  };

  const deleteRow = async (id) => { setSaving(true); try{ const token = localStorage.getItem('token'); await fetch(`/api/service-seekers/${serviceSeekerId}/external-logins?id=${id}`,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` }}); await fetchAll(); if(onNotification) onNotification({ show:true, message:'Deleted.', type:'success' }); }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Failed to delete.', type:'error' }); } finally{ setSaving(false); } };

  const toggleUser = (userId) => {
    setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id=>id!==userId) : [...prev, userId]);
  };

  const saveAccess = async () => { setSaving(true); try{ const token = localStorage.getItem('token'); await fetch(`/api/service-seekers/${serviceSeekerId}/external-inbox-access`,{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ userIds: selectedUserIds }) }); if(onNotification) onNotification({ show:true, message:'Access saved.', type:'success' }); }catch(e){ console.error(e); if(onNotification) onNotification({ show:true, message:'Failed to save access.', type:'error' }); } finally{ setSaving(false); } };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">External Logins</h2>
        <button type="button" onClick={openAdd} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add</button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email Address</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Show Rota?</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Show Allowance?</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Show Care Plan?</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Show Daily Notes?</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Show MAR Chart?</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Modified</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,idx) => (
                <tr key={r.id} className={`border-b border-gray-100 ${idx%2===0?'bg-blue-50':'bg-white'}`}>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.profile?.firstName} {r.profile?.lastName}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.profile?.type}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.profile?.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.showRota ? 'Yes':'No'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.showAllowance ? 'Yes':'No'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.showCarePlan ? 'Yes':'No'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.showDailyNotes ? 'Yes':'No'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.showMarChart ? 'Yes':'No'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.createdAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.updatedAt)}</td>
                  <td className="py-3 px-4"><button type="button" onClick={()=>deleteRow(r.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-2 text-sm text-gray-600">Please note only the &apos;family&apos; external login type has access to an inbox</div>

      <div className="border rounded-lg">
        <div className="bg-teal-600 text-white px-4 py-3 rounded-t-lg font-semibold">Allow External Logins to inbox ({users.length})</div>
        <div className="p-4 max-h-64 overflow-y-auto">
          {users.map(u => (
            <label key={u.id} className="flex items-center space-x-2 text-sm text-gray-800">
              <input type="checkbox" checked={selectedUserIds.includes(u.id)} onChange={()=>toggleUser(u.id)} />
              <span>{u.firstName} {u.lastName}</span>
            </label>
          ))}
        </div>
        <div className="p-4 border-t flex justify-end">
          <button type="button" onClick={saveAccess} className="px-4 py-2 bg-[#224fa6] text-white rounded-lg">Save</button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Add External Login</h3>
              <button type="button" onClick={openProfileModal} title="Create Login" className="text-gray-600 hover:text-gray-800">⚙️</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Login</label>
                  <select value={formData.profileId} onChange={e=>setFormData(prev=>({...prev, profileId:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900">
                    <option value="">Please Select</option>
                    {profiles.map(p => (<option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.email})</option>))}
                  </select>
                </div>
                {['showRota','showAllowance','showCarePlan','showDailyNotes','showMarChart'].map(key => (
                  <div key={key}><label className="block text-sm text-gray-600 mb-1">{key==='showRota'?'Show Rota?': key==='showAllowance'?'Show Allowance?': key==='showCarePlan'?'Show Care Plan?': key==='showDailyNotes'?'Show Daily Notes?':'Show MAR Chart?'}</label><select value={formData[key]} onChange={e=>setFormData(prev=>({...prev, [key]:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="true">Yes</option><option value="false">No</option></select></div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button type="button" onClick={()=>setShowModal(false)} disabled={saving} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70">Cancel</button>
              <button type="button" onClick={saveLogin} disabled={saving || !formData.profileId} className="px-6 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-lg">
            <div className="bg-teal-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-white text-lg">ℹ️</span>
                <h3 className="text-xl font-semibold">Add Login</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white text-lg">📤</span>
                <button type="button" onClick={()=>setShowTypeModal(true)} title="Manage Login Types" className="text-white hover:text-gray-200">⚙️</button>
              </div>
            </div>
            <div className="p-6 bg-white space-y-4">
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Type:</label>
                <div className="flex-1 flex items-center space-x-2">
                  <select value={profileData.type} onChange={e=>setProfileData(prev=>({...prev, type:e.target.value}))} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900">
                    <option value="">Please Select</option>
                    {loginTypes.map(t => (<option key={t} value={t}>{t}</option>))}
                  </select>
                  <button type="button" onClick={()=>setShowTypeModal(true)} title="Manage Types" className="text-gray-600 hover:text-gray-800">⚙️</button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">First Name:</label>
                <input type="text" value={profileData.firstName} onChange={e=>setProfileData(prev=>({...prev, firstName:e.target.value}))} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900" placeholder="Enter first name" />
              </div>
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Last Name:</label>
                <input type="text" value={profileData.lastName} onChange={e=>setProfileData(prev=>({...prev, lastName:e.target.value}))} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900" placeholder="Enter last name" />
              </div>
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Email Address:</label>
                <input type="email" value={profileData.email} onChange={e=>setProfileData(prev=>({...prev, email:e.target.value}))} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900" placeholder="Enter email" />
              </div>
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Password:</label>
                <div className="flex-1 relative">
                  <input type={showPassword ? 'text' : 'password'} value={profileData.password} onChange={e=>setProfileData(prev=>({...prev, password:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900" placeholder="Enter password" />
                  <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800">👁️</button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Picture:</label>
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handlePictureChange} className="hidden" id="picture-upload" />
                  <label htmlFor="picture-upload" className="inline-block px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-gray-700">
                    Choose file
                  </label>
                  <span className="ml-2 text-sm text-gray-600">{profileData.picture || 'No file chosen'}</span>
                </div>
              </div>
            </div>
            <div className="p-6 bg-white border-t border-gray-200 flex justify-end space-x-3 rounded-b-xl">
              <button type="button" onClick={()=>{setShowProfileModal(false); setProfileData({ firstName:'', lastName:'', type:loginTypes[0] || 'family', email:'', password:'', picture:null });}} disabled={saving} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70">Cancel</button>
              <button type="button" onClick={createProfile} disabled={saving} className="px-6 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {showTypeModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Manage Login Types</h3>
            </div>
            <div className="p-6 space-y-2 max-h-64 overflow-y-auto">
              {loginTypes.map((type, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                  <span className="text-gray-900">{type}</span>
                  <button type="button" onClick={()=>setLoginTypes(prev=>prev.filter((_,i)=>i!==idx))} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t">
                <input type="text" id="new-type-input" placeholder="Enter new type" className="w-full border rounded-lg px-3 py-2 text-gray-900 mb-2" onKeyPress={(e)=>{if(e.key==='Enter'){const val = e.target.value.trim(); if(val && !loginTypes.includes(val)){setLoginTypes(prev=>[...prev, val]); e.target.value='';}}}} />
                <button type="button" onClick={()=>{const input = document.getElementById('new-type-input'); const val = input.value.trim(); if(val && !loginTypes.includes(val)){setLoginTypes(prev=>[...prev, val]); input.value='';}}} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add</button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button type="button" onClick={()=>setShowTypeModal(false)} className="px-4 py-2 border rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


