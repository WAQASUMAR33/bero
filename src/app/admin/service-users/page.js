'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

export default function ServiceUsersPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [seekers, setSeekers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [seekerToDelete, setSeekerToDelete] = useState(null);
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
      setNotification({ show: true, message: 'Failed to load service users.', type: 'error' });
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
      const payload = {
        ...formData,
        latitude: formData.latitude === '' ? null : Number(formData.latitude),
        longitude: formData.longitude === '' ? null : Number(formData.longitude),
      };
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setShowModal(false);
        await fetchSeekers();
        setNotification({ show: true, message: editing ? 'Service user updated successfully.' : 'Service user created successfully.', type: 'success' });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save service user.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (s) => {
    setSeekerToDelete(s);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!seekerToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${seekerToDelete.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        await fetchSeekers();
        setNotification({ show: true, message: 'Service user deleted successfully.', type: 'success' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to delete service user.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while deleting.', type: 'error' });
    } finally {
      setShowDeleteConfirm(false);
      setSeekerToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setSeekerToDelete(null);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6]"></div>
      </div>
    );
  }

  const filteredSeekers = seekers
    .filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        s.firstName?.toLowerCase().includes(q) ||
        s.lastName?.toLowerCase().includes(q) ||
        s.postalCode?.toLowerCase().includes(q)
      );
    });

  const countBy = (key, value) => seekers.filter((s) => s[key] === value).length;

  const totalPages = Math.max(1, Math.ceil(filteredSeekers.length / pageSize));
  const pageSafe = Math.min(currentPage, totalPages);
  const startIdx = (pageSafe - 1) * pageSize;
  const pagedSeekers = filteredSeekers.slice(startIdx, startIdx + pageSize);

  const calculateAge = (dob) => {
    if (!dob) return '-';
    try {
      const d = new Date(dob);
      const diff = Date.now() - d.getTime();
      const age = new Date(diff).getUTCFullYear() - 1970;
      return age < 0 || Number.isNaN(age) ? '-' : age;
    } catch { return '-'; }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Users</h1>
                <p className="text-gray-600">Create and manage all service users</p>
              </div>
              <button onClick={openAdd} className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200">
                Add Service User
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{seekers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Live</p>
                  <p className="text-2xl font-bold text-gray-900">{countBy('status','LIVE')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pre-admission</p>
                  <p className="text-2xl font-bold text-gray-900">{countBy('status','PRE_ADMISSION')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Archived</p>
                  <p className="text-2xl font-bold text-gray-900">{countBy('status','ARCHIVED')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Search by name or postal code" className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white text-gray-900" />
                </div>
              </div>
              <div>
                <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white text-gray-900">
                  <option value="ALL">All Statuses</option>
                  <option value="LIVE">LIVE</option>
                  <option value="PRE_ADMISSION">PRE_ADMISSION</option>
                  <option value="ON_HOLD_HOSPITAL">ON_HOLD_HOSPITAL</option>
                  <option value="ARCHIVED_PRE_ADMISSION">ARCHIVED_PRE_ADMISSION</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-[1]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Age</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedSeekers.map((s, idx) => (
                    <tr key={s.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                      <td className="px-6 py-4 text-gray-900">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#224fa6] to-[#3270e9] flex items-center justify-center text-white font-semibold mr-3">
                            {(s.firstName?.[0]||'S')}{(s.lastName?.[0]||'U')}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{s.firstName} {s.lastName}</div>
                            <div className="text-xs text-gray-500">{s.preferredName || s.title || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{calculateAge(s.dateOfBirth)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          s.status === 'LIVE' ? 'bg-green-50 text-green-700' :
                          s.status === 'PRE_ADMISSION' ? 'bg-yellow-50 text-yellow-700' :
                          s.status === 'ON_HOLD_HOSPITAL' ? 'bg-blue-50 text-blue-700' :
                          s.status === 'ARCHIVED_PRE_ADMISSION' ? 'bg-purple-50 text-purple-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <div className="text-sm text-gray-900 truncate max-w-[260px]">{s.address || '-'}</div>
                        <div className="text-xs text-gray-500">{s.postalCode || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button title="Edit" onClick={() => openEdit(s)} className="p-2 rounded-lg text-[#224fa6] hover:bg-blue-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button title="Delete" onClick={() => handleDeleteClick(s)} className="p-2 rounded-lg text-red-600 hover:bg-red-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSeekers.length === 0 && (
                    <tr>
                      <td className="px-6 py-10 text-gray-500 text-center" colSpan={4}>
                        No service users match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium text-gray-900">{Math.min(filteredSeekers.length, startIdx + 1)}</span>-
                <span className="font-medium text-gray-900">{Math.min(filteredSeekers.length, startIdx + pagedSeekers.length)}</span> of
                <span className="font-medium text-gray-900"> {filteredSeekers.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <select value={pageSize} onChange={(e)=>{ setPageSize(parseInt(e.target.value)||10); setCurrentPage(1); }} className="px-2 py-1 border rounded">
                  {[10,20,50].map(n => (<option key={n} value={n}>{n} / page</option>))}
                </select>
                <button onClick={()=> setCurrentPage(p => Math.max(1, p-1))} disabled={pageSafe===1} className={`px-3 py-1 rounded border ${pageSafe===1? 'text-gray-400 bg-gray-50' : 'text-gray-700 bg-white hover:bg-gray-50'}`}>Prev</button>
                <span className="text-sm text-gray-700">Page {pageSafe} / {totalPages}</span>
                <button onClick={()=> setCurrentPage(p => Math.min(totalPages, p+1))} disabled={pageSafe===totalPages} className={`px-3 py-1 rounded border ${pageSafe===totalPages? 'text-gray-400 bg-gray-50' : 'text-gray-700 bg-white hover:bg-gray-50'}`}>Next</button>
              </div>
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
                    <button type="button" className="px-4 py-2 rounded border text-gray-700 bg-gray-100 hover:bg-gray-200" onClick={()=>{
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
          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Service User</h3>
                  <p className="text-sm text-gray-600 text-center mb-6">Are you sure you want to delete <span className="font-medium text-gray-900">{seekerToDelete?.firstName} {seekerToDelete?.lastName}</span>? This action cannot be undone.</p>
                  <div className="flex space-x-3">
                    <button onClick={handleDeleteCancel} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                    <button onClick={handleDeleteConfirm} className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Notification */}
          <Notification
            show={notification.show}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ ...notification, show: false })}
          />
        </main>
      </div>
    </div>
  );
}


