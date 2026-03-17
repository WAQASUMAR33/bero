'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

const TYPE_LABELS = { SUPERVISION: 'Supervision', APPRAISAL: 'Appraisal', PROBATION: 'Probation Review' };
const STATUS_LABELS = { SCHEDULED: 'Scheduled', COMPLETED: 'Completed', CANCELLED: 'Cancelled' };
const STATUS_COLORS = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600'
};

export default function SupervisionPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form, setForm] = useState({
    staffId: '', supervisorId: '', scheduledDate: '', conductedDate: '',
    type: 'SUPERVISION', status: 'SCHEDULED', notes: '', actionPoints: '', nextSupervision: ''
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) { setUser(JSON.parse(storedUser)); }
    else { router.push('/login'); }
  }, [router]);

  useEffect(() => {
    if (user) { fetchRecords(); fetchStaff(); }
  }, [user, filterType, filterStatus]);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/supervision?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) {
        let data = result.data;
        if (filterStatus) data = data.filter(r => r.status === filterStatus);
        setRecords(data);
      }
    } catch { showNotification('Error loading records', 'error'); }
    finally { setIsLoading(false); }
  };

  const fetchStaff = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/training/matrix', { headers: { Authorization: `Bearer ${token}` } });
    const result = await res.json();
    if (result.success) setAllStaff(result.data.staff.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })));
  };

  const handleSave = async () => {
    if (!form.staffId || !form.scheduledDate) { showNotification('Staff member and scheduled date are required', 'error'); return; }
    try {
      const token = localStorage.getItem('token');
      const url = editRecord ? `/api/supervision/${editRecord.id}` : '/api/supervision';
      const method = editRecord ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const result = await res.json();
      if (result.success) {
        showNotification(editRecord ? 'Record updated' : 'Record created');
        setShowModal(false);
        setEditRecord(null);
        fetchRecords();
      } else showNotification(result.error, 'error');
    } catch { showNotification('Error saving record', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/supervision/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const result = await res.json();
    if (result.success) { showNotification('Record deleted'); fetchRecords(); }
  };

  const openEdit = (record) => {
    setEditRecord(record);
    setForm({
      staffId: record.staffId,
      supervisorId: record.supervisorId,
      scheduledDate: record.scheduledDate?.split('T')[0] || '',
      conductedDate: record.conductedDate?.split('T')[0] || '',
      type: record.type,
      status: record.status,
      notes: record.notes || '',
      actionPoints: record.actionPoints || '',
      nextSupervision: record.nextSupervision?.split('T')[0] || ''
    });
    setShowModal(true);
  };

  const openNew = () => {
    setEditRecord(null);
    setForm({ staffId: '', supervisorId: user.id || '', scheduledDate: '', conductedDate: '', type: 'SUPERVISION', status: 'SCHEDULED', notes: '', actionPoints: '', nextSupervision: '' });
    setShowModal(true);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Supervision & Appraisals</h1>
              <p className="text-gray-600">1-to-1 meetings, appraisals, and probation reviews</p>
            </div>
            <button onClick={openNew}
              className="px-4 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium text-sm">
              + New Record
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4">
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white">
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white">
              <option value="">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {/* Records Table */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6]"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Staff Member', 'Supervisor', 'Type', 'Scheduled', 'Conducted', 'Status', 'Next Due', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No supervision records found.</td></tr>
                  ) : records.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{r.staff?.firstName} {r.staff?.lastName}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{r.supervisor?.firstName} {r.supervisor?.lastName}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{TYPE_LABELS[r.type]}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{fmt(r.scheduledDate)}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{fmt(r.conductedDate)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                          {STATUS_LABELS[r.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">{fmt(r.nextSupervision)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => openEdit(r)} className="text-[#224fa6] hover:text-[#3270e9] text-sm font-medium">Edit</button>
                          <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] px-6 py-4 rounded-t-2xl flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">{editRecord ? 'Edit' : 'New'} {TYPE_LABELS[form.type]}</h3>
                  <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Staff Member *</label>
                      <select value={form.staffId} onChange={e => setForm(p => ({ ...p, staffId: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900">
                        <option value="">Select...</option>
                        {allStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                      <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900">
                        {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Scheduled Date *</label>
                      <input type="date" value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Conducted Date</label>
                      <input type="date" value={form.conductedDate} onChange={e => setForm(p => ({ ...p, conductedDate: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                      <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900">
                        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Next Due Date</label>
                      <input type="date" value={form.nextSupervision} onChange={e => setForm(p => ({ ...p, nextSupervision: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes / Discussion Points</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Action Points</label>
                    <textarea value={form.actionPoints} onChange={e => setForm(p => ({ ...p, actionPoints: e.target.value }))}
                      rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-none" />
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
                    <button onClick={handleSave} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl font-medium hover:shadow-lg">Save</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Notification show={notification.show} message={notification.message} type={notification.type}
            onClose={() => setNotification({ show: false, message: '', type: 'success' })} />
        </main>
      </div>
    </div>
  );
}
