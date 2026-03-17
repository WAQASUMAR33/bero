'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

const STATUS_CONFIG = {
  VALID:        { label: 'Valid',        bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500' },
  EXPIRING_30:  { label: 'Exp ≤30d',    bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500' },
  EXPIRING_60:  { label: 'Exp ≤60d',    bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  EXPIRING_90:  { label: 'Exp ≤90d',    bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  EXPIRED:      { label: 'Expired',     bg: 'bg-red-200',    text: 'text-red-900',    dot: 'bg-red-700' },
  MISSING:      { label: 'Missing',     bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400' },
};

export default function TrainingMatrixPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [trainingTypes, setTrainingTypes] = useState([]);
  const [summary, setSummary] = useState({});
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [allStaff, setAllStaff] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null); // { staffId, trainingTypeId, record }
  const [newRecord, setNewRecord] = useState({ userId: '', trainingTypeId: '', completedDate: '', expiryDate: '', provider: '', notes: '' });
  const [newType, setNewType] = useState({ name: '', description: '', expiryMonths: '', isMandatory: true });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) { setUser(JSON.parse(storedUser)); }
    else { router.push('/login'); }
  }, [router]);

  useEffect(() => {
    if (user) { fetchMatrix(); fetchAllStaff(); }
  }, [user]);

  const fetchMatrix = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/training/matrix', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) {
        setStaff(result.data.staff);
        setTrainingTypes(result.data.trainingTypes);
        setSummary(result.data.summary);
      } else showNotification(result.error, 'error');
    } catch { showNotification('Error loading training matrix', 'error'); }
    finally { setIsLoading(false); }
  };

  const fetchAllStaff = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/training/matrix', { headers: { Authorization: `Bearer ${token}` } });
    const result = await res.json();
    if (result.success) setAllStaff(result.data.staff.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })));
  };

  const handleAddRecord = async () => {
    if (!newRecord.userId || !newRecord.trainingTypeId || !newRecord.completedDate) {
      showNotification('Staff, training type and completed date are required', 'error'); return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/training/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newRecord)
      });
      const result = await res.json();
      if (result.success) {
        showNotification('Training record added');
        setShowAddRecord(false);
        setNewRecord({ userId: '', trainingTypeId: '', completedDate: '', expiryDate: '', provider: '', notes: '' });
        fetchMatrix();
      } else showNotification(result.error, 'error');
    } catch { showNotification('Error adding record', 'error'); }
  };

  const handleAddType = async () => {
    if (!newType.name) { showNotification('Name is required', 'error'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/training/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newType)
      });
      const result = await res.json();
      if (result.success) {
        showNotification('Training type added');
        setShowAddType(false);
        setNewType({ name: '', description: '', expiryMonths: '', isMandatory: true });
        fetchMatrix();
      } else showNotification(result.error, 'error');
    } catch { showNotification('Error adding training type', 'error'); }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

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
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Training Matrix</h1>
              <p className="text-gray-600">Staff training compliance dashboard</p>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => setShowAddType(true)}
                className="px-4 py-2 border border-[#224fa6] text-[#224fa6] rounded-xl hover:bg-blue-50 transition-all duration-200 font-medium text-sm">
                + Training Type
              </button>
              <button onClick={() => setShowAddRecord(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium text-sm">
                + Add Record
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Expired', value: summary.expired, color: 'border-red-500 bg-red-50', text: 'text-red-700' },
              { label: 'Expiring ≤30 days', value: summary.expiring30, color: 'border-orange-500 bg-orange-50', text: 'text-orange-700' },
              { label: 'Expiring ≤60 days', value: summary.expiring60, color: 'border-yellow-500 bg-yellow-50', text: 'text-yellow-700' },
              { label: 'Missing Records', value: summary.missing, color: 'border-gray-400 bg-gray-50', text: 'text-gray-700' },
            ].map(card => (
              <div key={card.label} className={`bg-white rounded-xl p-4 border-l-4 shadow-sm ${card.color}`}>
                <div className={`text-2xl font-bold ${card.text}`}>{card.value ?? 0}</div>
                <div className="text-sm text-gray-600 mt-1">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Matrix Table */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading training matrix...</p>
              </div>
            </div>
          ) : trainingTypes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No training types yet</h3>
              <p className="text-gray-500 mb-4">Add training types to start building your compliance matrix.</p>
              <button onClick={() => setShowAddType(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl font-medium">
                Add First Training Type
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Compliance Grid — {staff.length} staff × {trainingTypes.length} training types
                </h3>
                <div className="flex items-center space-x-3 text-xs">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <span key={key} className="flex items-center space-x-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`}></span>
                      <span className="text-gray-600">{cfg.label}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10 border-r border-gray-200 min-w-[180px]">
                        Staff Member
                      </th>
                      {trainingTypes.map(tt => (
                        <th key={tt.id} className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase min-w-[120px]">
                          <div className="truncate max-w-[110px] mx-auto" title={tt.name}>{tt.name}</div>
                          {tt.expiryMonths && <div className="text-gray-400 font-normal normal-case">{tt.expiryMonths}m expiry</div>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {staff.map(member => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-100">
                          <div className="text-sm font-medium text-gray-900">{member.firstName} {member.lastName}</div>
                          {member.employeeNumber && <div className="text-xs text-gray-500">#{member.employeeNumber}</div>}
                        </td>
                        {trainingTypes.map(tt => {
                          const status = member.trainingStatus?.[tt.id];
                          const cfg = STATUS_CONFIG[status?.status] || STATUS_CONFIG.MISSING;
                          return (
                            <td key={tt.id} className="px-3 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => setSelectedCell({ member, tt, status })}
                                className={`inline-flex flex-col items-center px-2 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 w-full ${cfg.bg} ${cfg.text}`}
                              >
                                <span className={`w-2 h-2 rounded-full ${cfg.dot} mb-1`}></span>
                                {status?.record?.expiryDate
                                  ? formatDate(status.record.expiryDate)
                                  : cfg.label}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cell Detail Modal */}
          {selectedCell && (
            <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] px-6 py-4 rounded-t-2xl flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedCell.tt.name}</h3>
                    <p className="text-sm text-white/80">{selectedCell.member.firstName} {selectedCell.member.lastName}</p>
                  </div>
                  <button onClick={() => setSelectedCell(null)} className="text-white hover:text-gray-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  {selectedCell.status?.record ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${STATUS_CONFIG[selectedCell.status.status]?.bg} ${STATUS_CONFIG[selectedCell.status.status]?.text}`}>
                          {STATUS_CONFIG[selectedCell.status.status]?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed</span>
                        <span className="text-sm font-medium text-gray-900">{formatDate(selectedCell.status.record.completedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Expires</span>
                        <span className="text-sm font-medium text-gray-900">{formatDate(selectedCell.status.record.expiryDate)}</span>
                      </div>
                      {selectedCell.status.record.provider && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Provider</span>
                          <span className="text-sm font-medium text-gray-900">{selectedCell.status.record.provider}</span>
                        </div>
                      )}
                      {selectedCell.status.record.certificateUrl && (
                        <a href={selectedCell.status.record.certificateUrl} target="_blank" rel="noopener noreferrer"
                          className="block text-center mt-3 px-4 py-2 border border-[#224fa6] text-[#224fa6] rounded-xl text-sm hover:bg-blue-50">
                          View Certificate
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-4">No training record found for this staff member.</p>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCell(null);
                      setNewRecord({ userId: selectedCell.member.id, trainingTypeId: selectedCell.tt.id, completedDate: '', expiryDate: '', provider: '', notes: '' });
                      setShowAddRecord(true);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
                    {selectedCell.status?.record ? 'Update Record' : 'Add Record'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Record Modal */}
          {showAddRecord && (
            <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] px-6 py-4 rounded-t-2xl flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Add Training Record</h3>
                  <button onClick={() => setShowAddRecord(false)} className="text-white hover:text-gray-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Staff Member *</label>
                    <select value={newRecord.userId} onChange={e => setNewRecord(p => ({ ...p, userId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900">
                      <option value="">Select staff...</option>
                      {allStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Training Type *</label>
                    <select value={newRecord.trainingTypeId} onChange={e => setNewRecord(p => ({ ...p, trainingTypeId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900">
                      <option value="">Select training type...</option>
                      {trainingTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Completed Date *</label>
                      <input type="date" value={newRecord.completedDate} onChange={e => setNewRecord(p => ({ ...p, completedDate: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                      <input type="date" value={newRecord.expiryDate} onChange={e => setNewRecord(p => ({ ...p, expiryDate: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Training Provider</label>
                    <input type="text" value={newRecord.provider} onChange={e => setNewRecord(p => ({ ...p, provider: e.target.value }))}
                      placeholder="e.g. Skills for Care, In-house"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea value={newRecord.notes} onChange={e => setNewRecord(p => ({ ...p, notes: e.target.value }))}
                      rows={2} placeholder="Optional notes..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-none" />
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <button onClick={() => setShowAddRecord(false)}
                      className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                      Cancel
                    </button>
                    <button onClick={handleAddRecord}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl font-medium hover:shadow-lg">
                      Add Record
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Training Type Modal */}
          {showAddType && (
            <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] px-6 py-4 rounded-t-2xl flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Add Training Type</h3>
                  <button onClick={() => setShowAddType(false)} className="text-white hover:text-gray-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                    <input type="text" value={newType.name} onChange={e => setNewType(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Moving & Handling, Safeguarding"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea value={newType.description} onChange={e => setNewType(p => ({ ...p, description: e.target.value }))}
                      rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry (months) — leave blank if never expires</label>
                    <input type="number" value={newType.expiryMonths} onChange={e => setNewType(p => ({ ...p, expiryMonths: e.target.value }))}
                      placeholder="e.g. 12"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                  </div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={newType.isMandatory} onChange={e => setNewType(p => ({ ...p, isMandatory: e.target.checked }))}
                      className="w-4 h-4 text-[#224fa6] rounded" />
                    <span className="text-sm font-medium text-gray-700">Mandatory training</span>
                  </label>
                  <div className="flex space-x-3 pt-2">
                    <button onClick={() => setShowAddType(false)}
                      className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                      Cancel
                    </button>
                    <button onClick={handleAddType}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl font-medium hover:shadow-lg">
                      Add Type
                    </button>
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
