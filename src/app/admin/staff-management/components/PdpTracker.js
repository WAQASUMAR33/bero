'use client';

import { useState, useEffect } from 'react';
import { isManager } from '@/lib/permissions';

export default function PdpTracker({ currentUser, onViewStaff }) {
  const [pdps, setPdps] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgress, setFilterProgress] = useState('ALL'); // ALL | NOT_STARTED | IN_PROGRESS | COMPLETED | OVERDUE
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [formData, setFormData] = useState({
    dateIdentified: new Date().toISOString().split('T')[0],
    routeIdentified: 'Supervision',
    area: '',
    personResponsible: '',
    targetDate: '',
    progress: 'NOT_STARTED',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isUserManager = isManager(currentUser);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [pdpRes, staffRes] = await Promise.all([
        fetch('/api/staff/pdps', { headers }),
        fetch('/api/users?status=all', { headers })
      ]);

      if (pdpRes.ok) {
        const data = await pdpRes.json();
        setPdps(data);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setAllStaff(staffData);
        if (staffData.length > 0) setSelectedStaffId(staffData[0].id.toString());
      }
    } catch (err) {
      console.error('Error loading PDPs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSavePdp = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/staff/pdps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, userId: selectedStaffId })
      });
      if (res.ok) {
        setShowLogModal(false);
        setFormData({
          dateIdentified: new Date().toISOString().split('T')[0],
          routeIdentified: 'Supervision',
          area: '',
          personResponsible: '',
          targetDate: '',
          progress: 'NOT_STARTED',
          notes: ''
        });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save PDP');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving PDP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (pdpId, currentProgress) => {
    const nextProgress = currentProgress === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/staff/pdps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: pdpId, progress: nextProgress })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // KPI Calculations
  const overdueCount = pdps.filter(p => p.computedProgress === 'OVERDUE').length;
  const inProgressCount = pdps.filter(p => p.progress === 'IN_PROGRESS').length;
  const completedCount = pdps.filter(p => p.progress === 'COMPLETED').length;

  const filteredPdps = pdps.filter(p => {
    const name = `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.toLowerCase();
    const area = (p.area || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || area.includes(searchTerm.toLowerCase());
    const matchesFilter = filterProgress === 'ALL' || p.computedProgress === filterProgress || p.progress === filterProgress;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Personal Development Plans (PDP) Tracker</h2>
          <p className="text-xs text-gray-500 mt-1">Collation of identified staff development areas, routes, target dates, and completion progress</p>
        </div>
        <button
          onClick={() => setShowLogModal(true)}
          className="px-4 py-2.5 bg-[#224fa6] hover:bg-[#1a3a75] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Development Goal</span>
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterProgress('ALL')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterProgress === 'ALL' ? 'bg-blue-50 border-[#224fa6] ring-1 ring-[#224fa6]' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Total Goals</span>
          <span className="text-2xl font-black text-gray-900">{pdps.length}</span>
          <span className="text-[11px] text-gray-500 block mt-1">Development objectives</span>
        </div>

        <div
          onClick={() => setFilterProgress('OVERDUE')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterProgress === 'OVERDUE' ? 'bg-red-50 border-red-500 ring-1 ring-red-500' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider block mb-1">Target Overdue</span>
          <span className="text-2xl font-black text-red-600">{overdueCount}</span>
          <span className="text-[11px] text-red-500 block mt-1">Past target completion date</span>
        </div>

        <div
          onClick={() => setFilterProgress('IN_PROGRESS')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterProgress === 'IN_PROGRESS' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">In Progress</span>
          <span className="text-2xl font-black text-blue-600">{inProgressCount}</span>
          <span className="text-[11px] text-blue-500 block mt-1">Active goals being worked on</span>
        </div>

        <div
          onClick={() => setFilterProgress('COMPLETED')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterProgress === 'COMPLETED' ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-1">Completed</span>
          <span className="text-2xl font-black text-emerald-600">{completedCount}</span>
          <span className="text-[11px] text-emerald-600 block mt-1">Successfully achieved</span>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by staff member or development area..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Progress Filter:</span>
          <select
            value={filterProgress}
            onChange={e => setFilterProgress(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-[#224fa6]"
          >
            <option value="ALL">All Goals</option>
            <option value="OVERDUE">Overdue Only</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-gray-400 text-xs">
            <div className="w-8 h-8 border-4 border-[#224fa6] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading development objectives...
          </div>
        ) : filteredPdps.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            No personal development records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Date Identified</th>
                  <th className="py-3.5 px-4">Route Identified</th>
                  <th className="py-3.5 px-4">Area / Objective</th>
                  <th className="py-3.5 px-4">Person Responsible</th>
                  <th className="py-3.5 px-4">Target Date</th>
                  <th className="py-3.5 px-4">Progress Status</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPdps.map(p => {
                  const isOverdue = p.computedProgress === 'OVERDUE';
                  const isCompleted = p.progress === 'COMPLETED';
                  return (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {p.user?.firstName} {p.user?.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {p.dateIdentified ? new Date(p.dateIdentified).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-medium">
                        {p.routeIdentified || 'Supervision'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {p.area}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {p.personResponsible || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.targetDate ? (
                          <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {new Date(p.targetDate).toLocaleDateString()}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : (isOverdue
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : (p.progress === 'IN_PROGRESS'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'))
                        }`}>
                          {isOverdue ? 'OVERDUE' : p.progress.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                        {p.notes || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleToggleStatus(p.id, p.progress)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                            isCompleted ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                          title="Toggle Status"
                        >
                          {isCompleted ? 'Reopen' : 'Mark Done'}
                        </button>
                        <button
                          onClick={() => onViewStaff(p.userId)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-[#224fa6] hover:text-white rounded text-[11px] font-semibold text-gray-700 transition-all"
                        >
                          View File
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD PDP OBJECTIVE MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Add Personal Development Objective</h3>
            <form onSubmit={handleSavePdp} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Select Staff Member *</label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                >
                  {allStaff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} ({member.role?.displayName || member.role?.name || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Date Identified</label>
                  <input
                    type="date"
                    value={formData.dateIdentified}
                    onChange={e => setFormData({ ...formData, dateIdentified: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Route Identified</label>
                  <input
                    type="text"
                    value={formData.routeIdentified}
                    onChange={e => setFormData({ ...formData, routeIdentified: e.target.value })}
                    placeholder="e.g. Supervision, Appraisal..."
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Development Area / Objective *</label>
                <input
                  type="text"
                  required
                  value={formData.area}
                  onChange={e => setFormData({ ...formData, area: e.target.value })}
                  placeholder="e.g. Medication Management, Manual Handling..."
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Person Responsible / Mentor</label>
                  <input
                    type="text"
                    value={formData.personResponsible}
                    onChange={e => setFormData({ ...formData, personResponsible: e.target.value })}
                    placeholder="Name of manager or mentor..."
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Target Date to Complete</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Progress Status</label>
                <select
                  value={formData.progress}
                  onChange={e => setFormData({ ...formData, progress: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Notes & Progress Details</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Action steps or milestones..."
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#224fa6] hover:bg-[#1a3a75] text-white font-semibold rounded-lg"
                >
                  {isSubmitting ? 'Saving...' : 'Save Objective'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
