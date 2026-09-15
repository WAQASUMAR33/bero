'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CareWorkerActionPlanPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState(null);
  const [actions, setActions] = useState([]);
  const [activeTab, setActiveTab] = useState('shift'); // 'shift', 'all'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED'
  const [search, setSearch] = useState('');

  // Complete / Update Modal
  const [selectedAction, setSelectedAction] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/care-worker-login');
      return;
    }
    setUser(JSON.parse(storedUser));
    initData();
  }, []);

  const initData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // 1. Check for Active Shift
      let currentActive = null;
      try {
        const today = new Date().toISOString().split('T')[0];
        const shiftRes = await fetch(`/api/clock-in-out/my-shifts?date=${today}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (shiftRes.ok) {
          const shiftData = await shiftRes.json();
          if (shiftData.success && Array.isArray(shiftData.data)) {
            currentActive = shiftData.data.find(s => s.clockedIn && !s.clockOutTime);
            setActiveShift(currentActive || null);
          }
        }
      } catch (e) {
        console.error('Error fetching active shift:', e);
      }

      // 2. Fetch Care Worker Action Plans
      await fetchActions(token, currentActive);
    } catch (err) {
      console.error('Error initializing action plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActions = async (token, currentShift = activeShift) => {
    try {
      const activeSeekerId = currentShift?.serviceSeeker?.id || currentShift?.serviceSeekerId;
      
      // Fetch all assigned actions for this staff member
      const res = await fetch('/api/quality-assurance/actions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      let allActions = data?.data?.actions || [];

      // If on shift with a resident, also fetch any resident-specific actions that might be assigned to team
      if (activeSeekerId) {
        try {
          const seekerRes = await fetch(`/api/quality-assurance/actions?serviceSeekerId=${activeSeekerId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const seekerData = await seekerRes.json();
          const seekerActions = seekerData?.data?.actions || [];
          
          // Merge unique by ID
          const existingIds = new Set(allActions.map(a => a.id));
          seekerActions.forEach(a => {
            if (!existingIds.has(a.id)) {
              allActions.push(a);
              existingIds.add(a.id);
            }
          });
        } catch (e) {
          console.error('Error fetching resident actions:', e);
        }
      }

      setActions(allActions);
    } catch (err) {
      console.error('Error loading actions:', err);
      showToast('Could not load action plans', 'error');
    }
  };

  const handleUpdateStatus = async (action, newStatus, customNotes = null) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/quality-assurance/actions/${action.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          comments: customNotes !== null ? customNotes : action.comments || action.notes
        })
      });

      const result = await res.json();
      if (result.success) {
        showToast(
          newStatus === 'COMPLETED'
            ? 'Action completed successfully! Management notified.'
            : `Action status updated to ${newStatus.replace('_', ' ')}`
        );
        setSelectedAction(null);
        setCompletionNotes('');
        await fetchActions(token);
      } else {
        showToast(result.error || 'Failed to update action', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error updating action', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openCompleteModal = (action) => {
    setSelectedAction(action);
    setCompletionNotes(action.comments || action.notes || '');
  };

  const activeSeekerId = activeShift?.serviceSeeker?.id || activeShift?.serviceSeekerId;
  const activeSeekerName = activeShift?.serviceSeeker
    ? `${activeShift.serviceSeeker.firstName} ${activeShift.serviceSeeker.lastName}`
    : 'Active Resident';

  // Filter actions for tabs
  const shiftActions = actions.filter(a => activeSeekerId && a.serviceSeekerId === activeSeekerId);
  const displayedActions = (activeTab === 'shift' && activeSeekerId ? shiftActions : actions)
    .filter(a => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const item = (a.item || a.title || '').toLowerCase();
        const req = (a.actionRequired || a.description || '').toLowerCase();
        const resident = a.serviceSeeker ? `${a.serviceSeeker.firstName} ${a.serviceSeeker.lastName}`.toLowerCase() : '';
        return item.includes(q) || req.includes(q) || resident.includes(q);
      }
      return true;
    });

  const pendingShiftCount = shiftActions.filter(a => a.status !== 'COMPLETED').length;
  const totalPendingCount = actions.filter(a => a.status !== 'COMPLETED').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Toast Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium text-white flex items-center gap-2 animate-in fade-in slide-in-from-top-3 ${
          notification.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>
          <span>{notification.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="p-2 bg-gradient-to-br from-[#224fa6] to-[#17387a] text-white rounded-xl shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            My Action Plans
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Audit checkpoints and care quality actions assigned to you.
          </p>
        </div>
        <Link
          href="/care-worker"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#224fa6] hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* ACTIVE SHIFT BANNER */}
      {activeShift ? (
        <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-[#224fa6] rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white text-emerald-700 rounded-xl flex items-center justify-center font-bold text-xl shadow-inner">
                {activeShift.serviceSeeker?.firstName?.[0] || 'C'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white tracking-wide uppercase">
                    Currently On Shift
                  </span>
                  <span className="text-xs text-emerald-100">
                    Started {activeShift.clockInTime ? new Date(activeShift.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  {activeSeekerName}
                </h2>
                <p className="text-xs text-emerald-100">
                  {activeShift.serviceSeeker?.address || 'Shift location active'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl text-center border border-white/20">
                <p className="text-2xl font-black">{pendingShiftCount}</p>
                <p className="text-[10px] font-medium text-emerald-100 uppercase tracking-wider">Pending for Resident</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('shift')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                  activeTab === 'shift'
                    ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                    : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                }`}
              >
                View Shift Actions
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="text-sm font-bold text-blue-900">Not Currently Clocked In</p>
              <p className="text-xs text-blue-700">Clock in to your scheduled shift to view actions specifically filtered for that resident.</p>
            </div>
          </div>
          <Link
            href="/care-worker"
            className="px-3.5 py-1.5 bg-[#224fa6] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all flex-shrink-0"
          >
            Go to Clock In
          </Link>
        </div>
      )}

      {/* TABS & FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          {activeSeekerId && (
            <button
              type="button"
              onClick={() => setActiveTab('shift')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'shift'
                  ? 'bg-white text-[#224fa6] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Current Shift ({activeShift?.serviceSeeker?.firstName || 'Resident'})</span>
              {pendingShiftCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-white font-black">
                  {pendingShiftCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'all' || !activeSeekerId
                ? 'bg-white text-[#224fa6] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>All My Actions</span>
            {totalPendingCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-blue-600 text-white font-black">
                {totalPendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Search & Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#224fa6] w-36 sm:w-44"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-gray-300 rounded-xl bg-white font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Pending (Open)</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* ACTIONS LIST */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#224fa6]" />
          <p className="text-xs font-semibold mt-3">Loading action plans...</p>
        </div>
      ) : displayedActions.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-3xl mb-3">
            🎉
          </div>
          <h3 className="text-base font-bold text-gray-900">No Action Plans Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'shift' && activeSeekerId
              ? `There are no actions logged for ${activeSeekerName} matching your current filters.`
              : 'You have no action plan items assigned at this time. All audits are in good standing!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedActions.map((action) => {
            const isCompleted = action.status === 'COMPLETED';
            const isInProgress = action.status === 'IN_PROGRESS';
            const isOverdue = !isCompleted && action.dueDate && new Date(action.dueDate) < new Date();
            const priorityColor =
              action.priority === 'HIGH'
                ? 'bg-red-100 text-red-700 border-red-200'
                : action.priority === 'LOW'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-amber-100 text-amber-700 border-amber-200';

            return (
              <div
                key={action.id}
                className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md flex flex-col justify-between ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isOverdue
                    ? 'border-red-300 shadow-sm'
                    : 'border-gray-200'
                }`}
              >
                <div>
                  {/* Top Bar: Resident tag + Status */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {action.serviceSeeker ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <span>👤</span>
                          <span>{action.serviceSeeker.firstName} {action.serviceSeeker.lastName}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600">
                          General Care Staff
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${priorityColor}`}>
                        {action.priority} PRIORITY
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInProgress
                          ? 'bg-blue-100 text-blue-800'
                          : isOverdue
                          ? 'bg-red-100 text-red-800 animate-pulse'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isCompleted ? '✓ Completed' : isInProgress ? 'In Progress' : isOverdue ? 'Overdue' : 'Pending'}
                    </span>
                  </div>

                  {/* Title & Action Required */}
                  <h3 className="font-bold text-gray-900 text-base leading-snug">
                    {action.item || action.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <strong className="text-gray-800 block mb-0.5">Action Required:</strong>
                    {action.actionRequired || action.description || 'No detailed instructions provided.'}
                  </p>

                  {/* Progress notes / comments if already recorded */}
                  {(action.comments || action.notes) && (
                    <div className="mt-2.5 p-2 bg-blue-50/60 rounded-xl text-xs text-blue-900 border border-blue-100">
                      <span className="font-bold block text-[10px] text-blue-700 uppercase tracking-wider">Progress Notes:</span>
                      {action.comments || action.notes}
                    </div>
                  )}

                  {/* Metadata Row: Due date, Assigned by */}
                  <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-2 pt-2 border-t border-gray-100">
                    <div>
                      {action.dueDate ? (
                        <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                          📅 Due: {new Date(action.dueDate).toLocaleDateString('en-GB')}
                        </span>
                      ) : (
                        <span>📅 Due: As scheduled</span>
                      )}
                    </div>
                    <div>
                      {action.createdBy && (
                        <span>Assigned by: <strong>{action.createdBy.firstName} {action.createdBy.lastName}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  {isCompleted ? (
                    <div className="w-full text-center text-xs font-semibold text-emerald-700 bg-emerald-100/60 py-2 rounded-xl flex items-center justify-center gap-1">
                      <span>✓ Completed {action.completedAt ? new Date(action.completedAt).toLocaleDateString('en-GB') : ''}</span>
                    </div>
                  ) : (
                    <>
                      {action.status === 'OPEN' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(action, 'IN_PROGRESS')}
                          disabled={submitting}
                          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                          Mark In Progress
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openCompleteModal(action)}
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Complete Action</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COMPLETE ACTION MODAL */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Action Plan Completion</span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  {selectedAction.item || selectedAction.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {selectedAction.serviceSeeker && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                <strong>Resident:</strong> {selectedAction.serviceSeeker.firstName} {selectedAction.serviceSeeker.lastName} ({selectedAction.serviceSeeker.address || 'Resident Location'})
              </div>
            )}

            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-700 border border-gray-200">
              <strong className="block text-gray-900 mb-1">Required Action:</strong>
              {selectedAction.actionRequired || selectedAction.description}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Completion Notes / Comments <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Detail what was completed (e.g. Conducted MAR chart check, stock count verified with senior, records fully updated)..."
                className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                These notes will be logged into the staff action plan and reviewed by management.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedAction, 'COMPLETED', completionNotes)}
                disabled={submitting || !completionNotes.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : '✓ Confirm & Complete Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
