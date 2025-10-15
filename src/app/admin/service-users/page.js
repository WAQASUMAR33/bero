'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function ServiceUsersPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [seekers, setSeekers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Details
    firstName: '',
    lastName: '',
    preferredName: '',
    title: '',
    dateOfBirth: '',
    // Step 2: Address & Location
    address: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    photoUrl: '',
    // Step 3: Identity & Status
    gender: '',
    genderAtBirth: '',
    pronouns: '',
    sexuality: '',
    dnar: false,
    status: 'LIVE',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsLoading(false);
  }, []);

  const fetchSeekers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/service-seekers', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSeekers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { if (user) fetchSeekers(); }, [user]);

  const openAdd = () => {
    setEditing(null);
    setFormData({
      firstName: '', lastName: '', preferredName: '', title: '', dateOfBirth: '',
      address: '', postalCode: '', latitude: '', longitude: '', photoUrl: '',
      gender: '', genderAtBirth: '', pronouns: '', sexuality: '', dnar: false, status: 'LIVE',
    });
    setCurrentStep(1);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setFormData({
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      preferredName: s.preferredName || '',
      title: s.title || '',
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.substring(0, 10) : '',
      address: s.address || '',
      postalCode: s.postalCode || '',
      latitude: s.latitude?.toString() || '',
      longitude: s.longitude?.toString() || '',
      photoUrl: s.photoUrl || '',
      gender: s.gender || '',
      genderAtBirth: s.genderAtBirth || '',
      pronouns: s.pronouns || '',
      sexuality: s.sexuality || '',
      dnar: !!s.dnar,
      status: s.status || 'LIVE',
    });
    setCurrentStep(1);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/service-seekers/${editing.id}` : '/api/service-seekers';
      const token = localStorage.getItem('token');
      // Prepare payload: coerce latitude/longitude to numbers, empty strings to null
      const payload = {
        ...formData,
        latitude: formData.latitude === '' ? null : Number(formData.latitude),
        longitude: formData.longitude === '' ? null : Number(formData.longitude),
      };
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      setShowModal(false);
      await fetchSeekers();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (s) => {
    if (!confirm('Delete this service user?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/service-seekers/${s.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      await fetchSeekers();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Service Users</h1>
              <p className="text-gray-600">Manage service users</p>
            </div>
            <button onClick={openAdd} className="bg-[#224fa6] text-white px-4 py-2 rounded-lg disabled:opacity-70">
              Add Service User
            </button>
          </div>

          <div className="bg-white rounded-xl shadow border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Postal Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {seekers.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">{s.firstName} {s.lastName}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700">{s.status}</span></td>
                      <td className="px-6 py-4 text-gray-700">{s.postalCode || '-'}</td>
                      <td className="px-6 py-4 space-x-2">
                        <button onClick={() => openEdit(s)} className="text-[#224fa6] hover:underline">Edit</button>
                        <button onClick={() => handleDelete(s)} className="text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {seekers.length === 0 && (
                    <tr>
                      <td className="px-6 py-8 text-gray-500" colSpan={4}>No service users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showModal && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{editing ? 'Edit' : 'Add'} Service User</h2>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    {[1,2,3].map(step => (
                      <div key={step} className="flex items-center flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep>=step ? 'bg-[#224fa6] text-white' : 'bg-gray-200 text-gray-500'}`}>{step}</div>
                        {step<3 && <div className={`h-0.5 flex-1 mx-2 ${currentStep>step ? 'bg-[#224fa6]' : 'bg-gray-200'}`}></div>}
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={(e)=>{
                  e.preventDefault();
                  if(currentStep<3){ setCurrentStep(currentStep+1); return; }
                  handleSubmit(e);
                }} className="space-y-4">
                  {currentStep===1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">First Name *</label>
                        <input required value={formData.firstName} onChange={e=>setFormData({...formData, firstName:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Last Name *</label>
                        <input required value={formData.lastName} onChange={e=>setFormData({...formData, lastName:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Preferred Name</label>
                        <input value={formData.preferredName} onChange={e=>setFormData({...formData, preferredName:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Title</label>
                        <input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
                        <input type="date" value={formData.dateOfBirth} onChange={e=>setFormData({...formData, dateOfBirth:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                      </div>
                    </div>
                  )}

                  {currentStep===2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Address</label>
                        <input value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Postal Code</label>
                        <input value={formData.postalCode} onChange={e=>setFormData({...formData, postalCode:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Latitude</label>
                        <input type="number" step="any" value={formData.latitude} onChange={e=>setFormData({...formData, latitude:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Longitude</label>
                        <input type="number" step="any" value={formData.longitude} onChange={e=>setFormData({...formData, longitude:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Photo URL</label>
                        <input value={formData.photoUrl} onChange={e=>setFormData({...formData, photoUrl:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                      </div>
                    </div>
                  )}

                  {currentStep===3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Gender</label>
                        <input value={formData.gender} onChange={e=>setFormData({...formData, gender:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Gender at Birth</label>
                        <input value={formData.genderAtBirth} onChange={e=>setFormData({...formData, genderAtBirth:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Pronouns</label>
                        <input value={formData.pronouns} onChange={e=>setFormData({...formData, pronouns:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Sexuality</label>
                        <input value={formData.sexuality} onChange={e=>setFormData({...formData, sexuality:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                      </div>
                      <div className="flex items-center space-x-2 md:col-span-2">
                        <input id="dnar" type="checkbox" checked={formData.dnar} onChange={e=>setFormData({...formData, dnar:e.target.checked})} className="rounded border-gray-300 text-[#224fa6] focus:ring-[#224fa6]" />
                        <label htmlFor="dnar" className="text-sm text-gray-700">DNAR (Do Not Attempt Resuscitation)</label>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Status</label>
                        <select value={formData.status} onChange={e=>setFormData({...formData, status:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900">
                          <option value="LIVE">LIVE</option>
                          <option value="PRE_ADMISSION">PRE_ADMISSION</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                          <option value="ARCHIVED_PRE_ADMISSION">ARCHIVED_PRE_ADMISSION</option>
                          <option value="ON_HOLD_HOSPITAL">ON_HOLD_HOSPITAL</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <button type="button" className="px-4 py-2 rounded border" onClick={()=>{
                      if(currentStep>1){ setCurrentStep(currentStep-1); } else { setShowModal(false); }
                    }}>Back</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-70">
                      {currentStep<3 ? 'Next' : (isSubmitting? 'Saving...' : (editing? 'Update' : 'Create'))}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


