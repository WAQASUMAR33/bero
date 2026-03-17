'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import Notification from '../../../components/Notification';

const STATUS_CONFIG = {
  VALID:       { label: 'Valid',       bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  EXPIRING_30: { label: 'Exp ≤30d',   bg: 'bg-red-100',   text: 'text-red-800',   dot: 'bg-red-500' },
  EXPIRING_60: { label: 'Exp ≤60d',   bg: 'bg-orange-100',text: 'text-orange-800',dot: 'bg-orange-500' },
  EXPIRING_90: { label: 'Exp ≤90d',   bg: 'bg-yellow-100',text: 'text-yellow-800',dot: 'bg-yellow-500' },
  EXPIRED:     { label: 'Expired',    bg: 'bg-red-200',   text: 'text-red-900',   dot: 'bg-red-700' },
  MISSING:     { label: 'Missing',    bg: 'bg-gray-100',  text: 'text-gray-500',  dot: 'bg-gray-400' },
};

function getStatus(record) {
  if (!record) return 'MISSING';
  if (!record.expiryDate) return 'VALID';
  const today = new Date();
  const expiry = new Date(record.expiryDate);
  const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'EXPIRED';
  if (days <= 30) return 'EXPIRING_30';
  if (days <= 60) return 'EXPIRING_60';
  if (days <= 90) return 'EXPIRING_90';
  return 'VALID';
}

export default function StaffTrainingPage() {
  const [user, setUser] = useState(null);
  const [staffMember, setStaffMember] = useState(null);
  const [trainingTypes, setTrainingTypes] = useState([]);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ trainingTypeId: '', completedDate: '', expiryDate: '', provider: '', notes: '', certificateUrl: '' });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();
  const params = useParams();
  const staffId = params.id;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) { setUser(JSON.parse(storedUser)); }
    else { router.push('/login'); }
  }, [router]);

  useEffect(() => {
    if (user && staffId) { fetchAll(); }
  }, [user, staffId]);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const [staffRes, typesRes, recordsRes] = await Promise.all([
        fetch(`/api/users/${staffId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/training/types', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/training/records?userId=${staffId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [staffData, typesData, recordsData] = await Promise.all([staffRes.json(), typesRes.json(), recordsRes.json()]);
      if (staffData) setStaffMember(staffData);
      if (typesData.success) setTrainingTypes(typesData.data);
      if (recordsData.success) setRecords(recordsData.data);
    } catch { showNotification('Error loading data', 'error'); }
    finally { setIsLoading(false); }
  };

  const handleAddRecord = async () => {
    if (!form.trainingTypeId || !form.completedDate) { showNotification('Training type and completed date required', 'error'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/training/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, userId: parseInt(staffId) })
      });
      const result = await res.json();
      if (result.success) {
        showNotification('Training record added');
        setShowAddModal(false);
        setForm({ trainingTypeId: '', completedDate: '', expiryDate: '', provider: '', notes: '', certificateUrl: '' });
        fetchAll();
      } else showNotification(result.error, 'error');
    } catch { showNotification('Error adding record', 'error'); }
  };

  const handleDeleteRecord = async (id) => {
    if (!confirm('Delete this training record?')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/training/records/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    showNotification('Record deleted');
    fetchAll();
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // Get latest record per training type
  const latestByType = {};
  records.forEach(r => {
    if (!latestByType[r.trainingTypeId] || new Date(r.completedDate) > new Date(latestByType[r.trainingTypeId].completedDate)) {
      latestByType[r.trainingTypeId] = r;
    }
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/admin/staff-management')}
                className="p-2 text-gray-600 hover:text-[#224fa6] hover:bg-gray-100 rounded-lg transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Staff'} — Training Profile
                </h1>
                <p className="text-gray-600">{staffMember?.role?.displayName || ''} · #{staffMember?.employeeNumber || '—'}</p>
              </div>
            </div>
            <button onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm">
              + Upload Certificate
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6]"></div>
            </div>
          ) : (
            <>
              {/* Training Status Overview */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {trainingTypes.map(tt => {
                  const record = latestByType[tt.id];
                  const status = getStatus(record);
                  const cfg = STATUS_CONFIG[status];
                  return (
                    <div key={tt.id} className={`bg-white rounded-xl p-4 border shadow-sm ${status === 'EXPIRED' ? 'border-red-300' : status === 'MISSING' ? 'border-gray-200' : 'border-gray-100'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} flex-shrink-0`}></span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-1 leading-tight">{tt.name}</h4>
                      {record ? (
                        <div className="text-xs text-gray-500 space-y-0.5">
                          <div>Done: {fmt(record.completedDate)}</div>
                          {record.expiryDate && <div className={status === 'EXPIRED' ? 'text-red-600 font-medium' : ''}>Exp: {fmt(record.expiryDate)}</div>}
                          {record.provider && <div>{record.provider}</div>}
                          {record.certificateUrl && (
                            <a href={record.certificateUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[#224fa6] hover:underline block mt-1">View cert</a>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No record found</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Full Training History */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Full Training History ({records.length})</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Training', 'Completed', 'Expires', 'Provider', 'Status', 'Certificate', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No training records yet. Click "Upload Certificate" to add one.</td></tr>
                    ) : records.map(r => {
                      const status = getStatus(r);
                      const cfg = STATUS_CONFIG[status];
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">{r.trainingType?.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-700">{fmt(r.completedDate)}</td>
                          <td className="px-4 py-4 text-sm text-gray-700">{fmt(r.expiryDate)}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{r.provider || '—'}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                          </td>
                          <td className="px-4 py-4">
                            {r.certificateUrl ? (
                              <a href={r.certificateUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[#224fa6] hover:underline text-sm">View</a>
                            ) : <span className="text-gray-400 text-sm">—</span>}
                          </td>
                          <td className="px-4 py-4">
                            <button onClick={() => handleDeleteRecord(r.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Add Record Modal */}
          {showAddModal && (
            <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] px-6 py-4 rounded-t-2xl flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Upload Training Certificate</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-white hover:text-gray-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Training Type *</label>
                    <select value={form.trainingTypeId} onChange={e => setForm(p => ({ ...p, trainingTypeId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900">
                      <option value="">Select training type...</option>
                      {trainingTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Completed Date *</label>
                      <input type="date" value={form.completedDate} onChange={e => setForm(p => ({ ...p, completedDate: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                      <input type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Training Provider</label>
                    <input type="text" value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}
                      placeholder="e.g. Skills for Care, In-house"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Certificate URL (optional)</label>
                    <input type="url" value={form.certificateUrl} onChange={e => setForm(p => ({ ...p, certificateUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-none" />
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
                    <button onClick={handleAddRecord} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl font-medium hover:shadow-lg">Save Record</button>
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
