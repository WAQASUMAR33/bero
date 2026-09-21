'use client';

import { useState, useEffect } from 'react';
import { isManager } from '@/lib/permissions';

export default function AppraisalsTracker({ currentUser, onViewStaff }) {
  const [appraisals, setAppraisals] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | OVERDUE | DUE_SOON | UP_TO_DATE
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [formData, setFormData] = useState({
    lastAppraisalDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'PENDING',
    rating: 'Meets Expectations',
    feedback: '',
    goals: '',
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

      const [appraisalsRes, staffRes] = await Promise.all([
        fetch('/api/staff/appraisals', { headers }),
        fetch('/api/users?status=CURRENT', { headers })
      ]);

      if (appraisalsRes.ok) {
        const data = await appraisalsRes.json();
        setAppraisals(data);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        const activeStaffOnly = (Array.isArray(staffData) ? staffData : []).filter(
          member => (member.status || 'CURRENT').toUpperCase() === 'CURRENT'
        );
        setAllStaff(activeStaffOnly);
        if (activeStaffOnly.length > 0) setSelectedStaffId(activeStaffOnly[0].id.toString());
      }
    } catch (err) {
      console.error('Error loading appraisals data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveAppraisal = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/staff/appraisals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, userId: selectedStaffId })
      });
      if (res.ok) {
        setShowLogModal(false);
        setFormData({
          lastAppraisalDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          status: 'PENDING',
          rating: 'Meets Expectations',
          feedback: '',
          goals: '',
          notes: ''
        });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save appraisal');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving appraisal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI Calculations
  const overdueCount = appraisals.filter(a => a.computedStatus === 'OVERDUE').length;
  const dueSoonCount = appraisals.filter(a => a.computedStatus === 'DUE_SOON').length;
  const upToDateCount = appraisals.filter(a => a.computedStatus === 'UP_TO_DATE').length;

  const filteredAppraisals = appraisals.filter(a => {
    const name = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || (a.user?.employeeNumber && a.user.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || a.computedStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Staff Appraisals Tracker</h2>
          <p className="text-xs text-gray-500 mt-1">Collation of annual appraisals, performance reviews, and upcoming due milestones</p>
        </div>
        {isUserManager && (
          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2.5 bg-[#224fa6] hover:bg-[#1a3a75] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Log Appraisal</span>
          </button>
        )}
      </div>

      {/* OVERDUE ALERT BANNER */}
      {overdueCount > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-xs">
          <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <span className="font-bold">Attention Required: </span>
            {overdueCount} staff appraisal{overdueCount > 1 ? 's are' : ' is'} past due date. Please arrange review meetings promptly.
          </div>
          <button
            onClick={() => setFilterStatus('OVERDUE')}
            className="underline font-bold hover:text-red-900"
          >
            Filter Overdue
          </button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterStatus('ALL')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterStatus === 'ALL' ? 'bg-blue-50 border-[#224fa6] ring-1 ring-[#224fa6]' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Total Appraisals</span>
          <span className="text-2xl font-black text-gray-900">{appraisals.length}</span>
          <span className="text-[11px] text-gray-500 block mt-1">Recorded appraisals</span>
        </div>

        <div
          onClick={() => setFilterStatus('OVERDUE')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterStatus === 'OVERDUE' ? 'bg-red-50 border-red-500 ring-1 ring-red-500' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider block mb-1">Overdue</span>
          <span className="text-2xl font-black text-red-600">{overdueCount}</span>
          <span className="text-[11px] text-red-500 block mt-1">Past due date</span>
        </div>

        <div
          onClick={() => setFilterStatus('DUE_SOON')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterStatus === 'DUE_SOON' ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-1">Due in &lt;60 Days</span>
          <span className="text-2xl font-black text-amber-600">{dueSoonCount}</span>
          <span className="text-[11px] text-amber-500 block mt-1">Needs scheduling</span>
        </div>

        <div
          onClick={() => setFilterStatus('UP_TO_DATE')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterStatus === 'UP_TO_DATE' ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-1">Up to Date</span>
          <span className="text-2xl font-black text-emerald-600">{upToDateCount}</span>
          <span className="text-[11px] text-emerald-600 block mt-1">In compliance</span>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by staff member or ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Status Filter:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-[#224fa6]"
          >
            <option value="ALL">All Appraisals</option>
            <option value="OVERDUE">Overdue Only</option>
            <option value="DUE_SOON">Due in &lt;60 Days</option>
            <option value="UP_TO_DATE">Up to Date</option>
          </select>
        </div>
      </div>

      {/* APPRAISALS TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-gray-400 text-xs">
            <div className="w-8 h-8 border-4 border-[#224fa6] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading appraisals data...
          </div>
        ) : filteredAppraisals.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            No appraisals found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Start Date</th>
                  <th className="py-3.5 px-4">Date of Last Appraisal</th>
                  <th className="py-3.5 px-4">Date Due</th>
                  <th className="py-3.5 px-4">Status Flag</th>
                  <th className="py-3.5 px-4">Appraiser</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppraisals.map(a => {
                  const isOverdue = a.computedStatus === 'OVERDUE';
                  const isDueSoon = a.computedStatus === 'DUE_SOON';
                  return (
                    <tr key={a.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {a.user?.firstName} {a.user?.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {a.user?.role?.displayName || a.user?.role?.name || 'Staff'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {a.user?.startDate ? new Date(a.user.startDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-900 font-medium">
                        {a.lastAppraisalDate ? new Date(a.lastAppraisalDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold ${isOverdue ? 'text-red-600' : (isDueSoon ? 'text-amber-600' : 'text-gray-900')}`}>
                          {new Date(a.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
                          isOverdue
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : (isDueSoon
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200')
                        }`}>
                          {a.computedStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {a.appraiser ? `${a.appraiser.firstName} ${a.appraiser.lastName}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {a.rating || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onViewStaff(a.userId)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-[#224fa6] hover:text-white rounded-lg text-xs font-semibold text-gray-700 transition-all"
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

      {/* RECORD APPRAISAL MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Record Staff Appraisal</h3>
            <form onSubmit={handleSaveAppraisal} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Select Staff Member *</label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none bg-white text-gray-900"
                >
                  {allStaff.length === 0 ? (
                    <option value="" disabled>No active staff members found</option>
                  ) : (
                    allStaff.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName} ({member.role?.displayName || member.role?.name || 'Staff'})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Date of Last Appraisal</label>
                  <input
                    type="date"
                    value={formData.lastAppraisalDate}
                    onChange={e => setFormData({ ...formData, lastAppraisalDate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Date Next Due *</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Overall Rating</label>
                  <select
                    value={formData.rating}
                    onChange={e => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="Outstanding">Outstanding</option>
                    <option value="Exceeds Expectations">Exceeds Expectations</option>
                    <option value="Meets Expectations">Meets Expectations</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Feedback Remarks</label>
                <textarea
                  rows={2}
                  value={formData.feedback}
                  onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                  placeholder="Appraisal observations..."
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Agreed Goals</label>
                <input
                  type="text"
                  value={formData.goals}
                  onChange={e => setFormData({ ...formData, goals: e.target.value })}
                  placeholder="Goals for the next period..."
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
                  {isSubmitting ? 'Saving...' : 'Save Appraisal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
