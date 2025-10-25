'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';
import LocationMap from './components/LocationMap';

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
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
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
      
      // Ensure we always set an array
      if (Array.isArray(data)) {
        setSeekers(data);
      } else {
        console.error('API returned non-array data:', data);
        setSeekers([]);
        setNotification({ show: true, message: data?.error || 'Failed to load service users.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setSeekers([]);
      setNotification({ show: true, message: 'Failed to load service users.', type: 'error' });
    }
  };

  useEffect(() => { if (user) fetchSeekers(); }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setFormData({
      ...formData,
      latitude: lat.toString(),
      longitude: lng.toString()
    });
  };

  const openAdd = () => {
    setEditing(null);
    setSelectedImage(null);
    setImagePreview(null);
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
    setSelectedImage(null);
    setImagePreview(s.photoUrl || null);
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

  const filteredSeekers = (Array.isArray(seekers) ? seekers : [])
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

  const countBy = (key, value) => (Array.isArray(seekers) ? seekers : []).filter((s) => s[key] === value).length;

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

  const openView = async (s) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${s.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setViewData(data);
      setShowViewModal(true);
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Failed to load details.', type: 'error' });
    }
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
                          <button title="View" onClick={() => openView(s)} className="p-2 rounded-lg text-gray-700 hover:bg-gray-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                          </button>
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
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Address</label>
                          <input value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Postal Code</label>
                          <input 
                            value={formData.postalCode} 
                            onChange={e=>setFormData({...formData, postalCode:e.target.value.toUpperCase()})} 
                            className="w-full border rounded-lg px-3 py-2 text-gray-900" 
                            placeholder="e.g. SW1A 1AA"
                            maxLength={8}
                          />
                          <p className="text-xs text-gray-500 mt-1">Enter complete UK postal code to auto-locate on map</p>
                        </div>
                      </div>

                      {/* Map Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">Location</label>
                          {formData.latitude && formData.longitude && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              📍 Location set: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                            </span>
                          )}
                        </div>
                        
                        <LocationMap
                          postalCode={formData.postalCode}
                          latitude={formData.latitude ? parseFloat(formData.latitude) : null}
                          longitude={formData.longitude ? parseFloat(formData.longitude) : null}
                          onLocationSelect={handleLocationSelect}
                          className="w-full h-80 rounded-lg border-2 border-gray-200"
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Latitude</label>
                            <input 
                              type="number" 
                              step="any" 
                              value={formData.latitude} 
                              onChange={e=>setFormData({...formData, latitude:e.target.value})} 
                              className="w-full border rounded-lg px-3 py-2 text-gray-900 bg-gray-50" 
                              placeholder="Auto-filled from map"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Longitude</label>
                            <input 
                              type="number" 
                              step="any" 
                              value={formData.longitude} 
                              onChange={e=>setFormData({...formData, longitude:e.target.value})} 
                              className="w-full border rounded-lg px-3 py-2 text-gray-900 bg-gray-50" 
                              placeholder="Auto-filled from map"
                              readOnly
                            />
                          </div>
                        </div>
                      </div>

                      {/* Profile Photo Section */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Profile Photo</label>
                        <div className="flex items-center space-x-4">
                          {imagePreview && (
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="w-full border rounded-lg px-3 py-2 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#224fa6] file:text-white hover:file:bg-[#1a3d85] cursor-pointer"
                            />
                            <p className="text-xs text-gray-500 mt-1">Upload a profile photo (cloud storage integration pending)</p>
                          </div>
                        </div>
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
          {/* View Details Modal */}
          {showViewModal && viewData && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 my-8">
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-[#224fa6] to-[#3270e9] p-6 rounded-t-2xl">
                  <button onClick={()=>setShowViewModal(false)} className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                  <div className="flex items-center space-x-4">
                    {viewData.photoUrl ? (
                      <img src={viewData.photoUrl} alt={`${viewData.firstName} ${viewData.lastName}`} className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                        <span className="text-3xl font-bold text-[#224fa6]">{(viewData.firstName?.[0]||'S')}{(viewData.lastName?.[0]||'U')}</span>
                      </div>
                    )}
                    <div className="text-white">
                      <h3 className="text-2xl font-bold mb-1">{viewData.firstName} {viewData.lastName}</h3>
                      {viewData.preferredName && <p className="text-blue-100 text-sm mb-2">Preferred: {viewData.preferredName}</p>}
                      <span className={`inline-block px-3 py-1 text-xs rounded-full font-semibold ${
                        viewData.status === 'LIVE' ? 'bg-green-500 text-white' :
                        viewData.status === 'PRE_ADMISSION' ? 'bg-yellow-500 text-white' :
                        viewData.status === 'ON_HOLD_HOSPITAL' ? 'bg-blue-400 text-white' :
                        viewData.status === 'ARCHIVED_PRE_ADMISSION' ? 'bg-purple-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>{viewData.status}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {/* Personal Information */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-[#224fa6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Personal Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Title</p>
                        <p className="text-gray-900 font-medium">{viewData.title || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date of Birth</p>
                        <p className="text-gray-900 font-medium">{viewData.dateOfBirth ? new Date(viewData.dateOfBirth).toLocaleDateString() : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Age</p>
                        <p className="text-gray-900 font-medium">{calculateAge(viewData.dateOfBirth)} years</p>
                      </div>
                    </div>
                  </div>

                  {/* Address & Location */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Address & Location</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                        <div className="md:col-span-2">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Address</p>
                          <p className="text-gray-900 font-medium">{viewData.address || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Postal Code</p>
                          <p className="text-gray-900 font-medium">{viewData.postalCode || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Coordinates</p>
                          <p className="text-gray-900 font-medium">{viewData.latitude && viewData.longitude ? `${parseFloat(viewData.latitude).toFixed(4)}, ${parseFloat(viewData.longitude).toFixed(4)}` : '-'}</p>
                        </div>
                      </div>
                      
                      {/* Location Map */}
                      {viewData.latitude && viewData.longitude && (
                        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                          <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-2 border-b border-gray-200">
                            <p className="text-sm font-medium text-gray-700 flex items-center">
                              <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                              Service User Location
                            </p>
                          </div>
                          <LocationMap
                            latitude={parseFloat(viewData.latitude)}
                            longitude={parseFloat(viewData.longitude)}
                            readOnly={true}
                            className="w-full h-64"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Identity & Preferences */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/></svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Identity & Preferences</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Gender</p>
                        <p className="text-gray-900 font-medium">{viewData.gender || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Gender at Birth</p>
                        <p className="text-gray-900 font-medium">{viewData.genderAtBirth || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pronouns</p>
                        <p className="text-gray-900 font-medium">{viewData.pronouns || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Sexuality</p>
                        <p className="text-gray-900 font-medium">{viewData.sexuality || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Medical Information</h4>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${viewData.dnar ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <p className="text-sm font-medium text-gray-700">
                          DNAR (Do Not Attempt Resuscitation): <span className={`font-bold ${viewData.dnar ? 'text-red-600' : 'text-green-600'}`}>{viewData.dnar ? 'YES' : 'NO'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Audit Trail */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Audit Trail</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500 mr-3"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Created</p>
                          <p className="text-sm text-gray-600">
                            {viewData.createdAt ? new Date(viewData.createdAt).toLocaleString() : '-'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            by <span className="font-medium text-gray-700">{viewData.createdBy ? `${viewData.createdBy.firstName} ${viewData.createdBy.lastName}` : 'System'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500 mr-3"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Last Updated</p>
                          <p className="text-sm text-gray-600">
                            {viewData.updatedAt ? new Date(viewData.updatedAt).toLocaleString() : '-'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            by <span className="font-medium text-gray-700">{viewData.updatedBy ? `${viewData.updatedBy.firstName} ${viewData.updatedBy.lastName}` : 'System'}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer with action button */}
                <div className="border-t border-gray-200 p-4 rounded-b-2xl bg-gray-50">
                  <button onClick={()=>setShowViewModal(false)} className="w-full bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200">
                    Close
                  </button>
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


