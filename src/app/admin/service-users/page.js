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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    status: 'LIVE',
    postalCode: '',
    address: '',
    preferredName: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsLoading(false);
  }, []);

  const fetchSeekers = async () => {
    try {
      const res = await fetch('/api/service-seekers');
      const data = await res.json();
      setSeekers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { if (user) fetchSeekers(); }, [user]);

  const openAdd = () => {
    setEditing(null);
    setFormData({ firstName: '', lastName: '', status: 'LIVE', postalCode: '', address: '', preferredName: '', dateOfBirth: '' });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setFormData({
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      status: s.status || 'LIVE',
      postalCode: s.postalCode || '',
      address: s.address || '',
      preferredName: s.preferredName || '',
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.substring(0, 10) : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/service-seekers/${editing.id}` : '/api/service-seekers';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
      await fetch(`/api/service-seekers/${s.id}`, { method: 'DELETE' });
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
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{editing ? 'Edit' : 'Add'} Service User</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">First Name</label>
                    <input value={formData.firstName} onChange={e=>setFormData({...formData, firstName:e.target.value})} className="w-full border rounded-lg px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                    <input value={formData.lastName} onChange={e=>setFormData({...formData, lastName:e.target.value})} className="w-full border rounded-lg px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Preferred Name</label>
                    <input value={formData.preferredName} onChange={e=>setFormData({...formData, preferredName:e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
                    <input type="date" value={formData.dateOfBirth} onChange={e=>setFormData({...formData, dateOfBirth:e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Postal Code</label>
                    <input value={formData.postalCode} onChange={e=>setFormData({...formData, postalCode:e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Address</label>
                    <input value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Status</label>
                    <select value={formData.status} onChange={e=>setFormData({...formData, status:e.target.value})} className="w-full border rounded-lg px-3 py-2">
                      <option value="LIVE">LIVE</option>
                      <option value="PRE_ADMISSION">PRE_ADMISSION</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                      <option value="ARCHIVED_PRE_ADMISSION">ARCHIVED_PRE_ADMISSION</option>
                      <option value="ON_HOLD_HOSPITAL">ON_HOLD_HOSPITAL</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex justify-end space-x-3 mt-2">
                    <button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-[#224fa6] text-white disabled:opacity-70">
                      {isSubmitting ? 'Saving...' : 'Save'}
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


