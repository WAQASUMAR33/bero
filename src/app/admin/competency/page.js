'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

const TYPE_LABELS = { OBSERVATION: 'Observation', SHADOWING: 'Shadowing', PRACTICAL_TEST: 'Practical Test' };
const OUTCOME_COLORS = {
  PASS: 'bg-green-100 text-green-800',
  FAIL: 'bg-red-100 text-red-800',
  NEEDS_REVIEW: 'bg-yellow-100 text-yellow-800'
};

export default function CompetencyPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [filterStaff, setFilterStaff] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form, setForm] = useState({ staffId: '', assessorId: '', competencyName: '', type: 'OBSERVATION', date: '', outcome: 'PASS', notes: '' });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) { setUser(JSON.parse(storedUser)); }
    else { router.push('/login'); }
  }, [router]);

  useEffect(() => {
    if (user) { fetchRecords(); fetchStaff(); }
  }, [user, filterStaff]);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const params = filterStaff ? `?staffId=${filterStaff}` : '';
      const res = await fetch(`/api/competency${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setRecords(result.data);
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
    if (!form.staffId || !form.competencyName || !form.date) { showNotification('Staff, competency name and date are required', 'error'); return; }
    try {
      const token = localStorage.getItem('token');
      const url = editRecord ? `/api/competency/${editRecord.id}` : '/api/competency';
      const method = editRecord ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const result = await res.json();
      if (result.success) {
        showNotification(editRecord ? 'Record updated' : 'Sign-off recorded');
        setShowModal(false);
        setEditRecord(null);
        fetchRecords();
      } else showNotification(result.error, 'error');
    } catch { showNotification('Error saving record', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this competency record?')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/competency/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    showNotification('Record deleted');
    fetchRecords();
  };

  const openNew = () => {
    setEditRecord(null);
    setForm({ staffId: '', assessorId: user.id || '', competencyName: '', type: 'OBSERVATION', date: new Date().toISOString().split('T')[0], outcome: 'PASS', notes: '' });
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Competency Sign-offs</h1>
              <p className="text-gray-600">Shadowing, observations and practical assessments</p>
            </div>
            <button onClick={openNew}
              className="px-4 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm">
              + New Sign-off
            </button>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white">
              <option value="">All Staff</option>
              {allStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6]"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Staff Member', 'Competency', 'Type', 'Date', 'Assessor', 'Outcome', 'Notes', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No competency records found.</td></tr>
                  ) : records.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{r.staff?.firstName} {r.staff?.lastName}</td>
                      <td className="px-4 py-4 text-sm text-gray-800">{r.competencyName}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{TYPE_LABELS[r.type]}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{fmt(r.date)}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{r.assessor?.firstName} {r.assessor?.lastName}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${OUTCOME_COLORS[r.outcome]}`}>
                          {r.outcome.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px] truncate">{r.notes || '—'}</td>
                      <td className="px-4 py-4">
                        <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
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
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] px-6 py-4 rounded-t-2xl flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Record Competency Sign-off</h3>
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Competency Name *</label>
                    <input type="text" value={form.competencyName} onChange={e => setForm(p => ({ ...p, competencyName: e.target.value }))}
                      placeholder="e.g. Hoist Transfer, Medication Administration"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                      <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Outcome</label>
                      <select value={form.outcome} onChange={e => setForm(p => ({ ...p, outcome: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900">
                        <option value="PASS">Pass</option>
                        <option value="FAIL">Fail</option>
                        <option value="NEEDS_REVIEW">Needs Review</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-none" />
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
                    <button onClick={handleSave} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl font-medium hover:shadow-lg">Save Sign-off</button>
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
