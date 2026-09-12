'use client';

import { useState, useEffect } from 'react';

export default function ActionPlansManager({ user, onNotification }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedActionForView, setSelectedActionForView] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // New Action Form State
  const [newAction, setNewAction] = useState({
    staffId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    source: 'Audit Finding',
    notes: '',
  });

  useEffect(() => {
    fetchActionPlans();
  }, [selectedStaffId, statusFilter]);

  const fetchActionPlans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedStaffId && selectedStaffId !== 'all') params.append('staffId', selectedStaffId);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/quality-assurance/actions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        if (onNotification) onNotification({ show: true, message: result.error || 'Failed to load action plans', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification) onNotification({ show: true, message: 'Network error loading action plans', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAction = async () => {
    if (!newAction.title.trim()) {
      if (onNotification) onNotification({ show: true, message: 'Action title is required', type: 'error' });
      return;
    }
    if (!newAction.staffId) {
      if (onNotification) onNotification({ show: true, message: 'Please assign to a staff member', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/quality-assurance/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newAction)
      });
      const json = await res.json();
      if (json.success) {
        if (onNotification) onNotification({ show: true, message: 'Action added and assigned successfully!', type: 'success' });
        setShowAddModal(false);
        setNewAction({
          staffId: '',
          title: '',
          description: '',
          priority: 'MEDIUM',
          dueDate: '',
          source: 'Audit Finding',
          notes: '',
        });
        await fetchActionPlans();
      } else {
        if (onNotification) onNotification({ show: true, message: json.error || 'Failed to create action', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification) onNotification({ show: true, message: 'Error adding action', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (actionId, newStatus) => {
    setUpdatingStatusId(actionId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/quality-assurance/actions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: actionId, status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        if (onNotification) onNotification({ show: true, message: `Action status updated to ${newStatus}`, type: 'success' });
        await fetchActionPlans();
      } else {
        if (onNotification) onNotification({ show: true, message: json.error || 'Failed to update status', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification) onNotification({ show: true, message: 'Error updating action', type: 'error' });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteAction = async (actionId) => {
    if (!confirm('Are you sure you want to delete this action item?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/quality-assurance/actions?id=${actionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        if (onNotification) onNotification({ show: true, message: 'Action deleted', type: 'success' });
        if (selectedActionForView?.id === actionId) setSelectedActionForView(null);
        await fetchActionPlans();
      } else {
        if (onNotification) onNotification({ show: true, message: json.error || 'Failed to delete action', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification) onNotification({ show: true, message: 'Error deleting action', type: 'error' });
    }
  };

  const formatDate = (s) => {
    if (!s) return 'No due date';
    try {
      const d = new Date(s);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return s;
    }
  };

  const isManagement = data?.isManagement ?? false;
  const staffList = data?.staffList || [];
  const staffStatsMap = data?.staffStatsMap || {};
  const overallStats = data?.overallStats || { total: 0, open: 0, inProgress: 0, completed: 0, overdue: 0 };

  const actions = (data?.actions || []).filter(act => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      act.title.toLowerCase().includes(term) ||
      (act.description && act.description.toLowerCase().includes(term)) ||
      (act.staff && `${act.staff.firstName} ${act.staff.lastName}`.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & "Add Action" Bar */}
      <div className="bg-gradient-to-r from-[#224fa6] via-indigo-700 to-purple-800 rounded-2xl text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-white/20 border border-white/30 tracking-wide uppercase">
              {isManagement ? 'Management Overview' : 'Staff Portal'}
            </span>
            <span className="text-xs text-blue-100">
              {isManagement ? 'Viewing all staff action plans' : 'Viewing your assigned actions'}
            </span>
          </div>
          <h2 className="text-2xl font-bold mt-1.5">Staff Action Plans & Tasks</h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            Each staff member maintains an individual action plan for audit remediation, professional development, and quality improvement tasks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-white hover:bg-blue-50 text-[#224fa6] rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="text-base">➕</span>
            <span>Add Action</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Actions</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{overallStats.total}</p>
          <span className="text-[11px] text-gray-400">Assigned across team</span>
        </div>

        <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Open</span>
          <p className="text-2xl font-black text-blue-700 mt-1">{overallStats.open}</p>
          <span className="text-[11px] text-blue-400">Awaiting commencement</span>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">In Progress</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{overallStats.inProgress}</p>
          <span className="text-[11px] text-amber-500">Underway</span>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Completed</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{overallStats.completed}</p>
          <span className="text-[11px] text-emerald-500">Resolved & verified</span>
        </div>

        <div className="bg-white border border-red-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-red-600">Overdue</span>
          <p className="text-2xl font-black text-red-700 mt-1">{overallStats.overdue}</p>
          <span className="text-[11px] text-red-400">Target date elapsed</span>
        </div>
      </div>

      {/* Staff Action Plans Directory (For Management: One for every staff member) */}
      {isManagement && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>👥</span>
                <span>Staff Member Action Plans Directory</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Select any staff member to view their individual action plan or filter actions
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedStaffId('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedStaffId === 'all'
                  ? 'bg-[#224fa6] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Staff Actions ({staffList.length} Staff)
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {staffList.map(s => {
              const stats = staffStatsMap[s.id] || { total: 0, open: 0, inProgress: 0, completed: 0, overdue: 0, completionRate: 100 };
              const isSelected = selectedStaffId === String(s.id);
              const initials = `${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`.toUpperCase() || 'ST';

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStaffId(isSelected ? 'all' : String(s.id))}
                  className={`shrink-0 w-52 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#224fa6] bg-blue-50/60 ring-2 ring-blue-200 shadow-xs'
                      : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#224fa6] to-indigo-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {s.role?.name || 'Staff Member'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-gray-200/60">
                    <span className="text-gray-500">Actions: <strong>{stats.total}</strong></span>
                    {stats.overdue > 0 ? (
                      <span className="text-red-600 font-bold bg-red-100 px-1.5 py-0.2 rounded text-[10px]">
                        {stats.overdue} overdue
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold text-[10px]">
                        {stats.completionRate}% done
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Items List Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        {/* Filters and search bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              placeholder="Search actions by title, description, or staff..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#224fa6] focus:bg-white transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'OPEN', 'IN_PROGRESS', 'COMPLETED'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer uppercase ${
                  statusFilter === st
                    ? 'bg-[#224fa6] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st === 'all' ? 'All Statuses' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Actions Table */}
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading action items...</div>
        ) : actions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-sm font-semibold text-gray-700">No action items found.</p>
            <p className="text-xs text-gray-400 mt-1">
              {isManagement
                ? 'Click "Add Action" above to assign a remedial action or task to a staff member.'
                : 'You currently have no outstanding action plan items assigned to you.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Action & Details</th>
                  {isManagement && <th className="py-3 px-4">Assigned Staff</th>}
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {actions.map(act => {
                  let priorityBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (act.priority === 'HIGH') priorityBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                  else if (act.priority === 'URGENT') priorityBadge = 'bg-red-50 text-red-700 border-red-200 font-bold';

                  let statusBadge = 'bg-blue-100 text-blue-800';
                  if (act.status === 'IN_PROGRESS') statusBadge = 'bg-amber-100 text-amber-800';
                  else if (act.status === 'COMPLETED') statusBadge = 'bg-emerald-100 text-emerald-800';

                  return (
                    <tr key={act.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-3 px-4 max-w-sm">
                        <p className="font-bold text-gray-900 text-sm">{act.title}</p>
                        {act.description && (
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{act.description}</p>
                        )}
                        {act.notes && (
                          <p className="text-[11px] text-gray-400 italic line-clamp-1 mt-0.5">Note: {act.notes}</p>
                        )}
                      </td>

                      {isManagement && (
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-800">
                            {act.staff ? `${act.staff.firstName} ${act.staff.lastName}` : 'Unassigned'}
                          </span>
                        </td>
                      )}

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold border ${priorityBadge}`}>
                          {act.priority}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={act.isOverdue ? 'text-red-600 font-bold' : 'text-gray-700 font-medium'}>
                            {formatDate(act.dueDate)}
                          </span>
                          {act.isOverdue && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-100 text-red-700 border border-red-200 uppercase">
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-gray-500 text-[11px]">
                        {act.source}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={act.status}
                          disabled={updatingStatusId === act.id}
                          onChange={e => handleUpdateStatus(act.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border cursor-pointer ${statusBadge}`}
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedActionForView(act)}
                          className="text-[#224fa6] hover:underline font-semibold text-xs cursor-pointer"
                        >
                          View
                        </button>
                        {isManagement && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAction(act.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-xs cursor-pointer ml-2"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generic "Add Action" Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#224fa6] to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Add Action Item</h3>
                <p className="text-xs text-blue-100 mt-0.5">Assign an action plan item or remedial task to a staff member</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white text-2xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Action Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Complete topical MAR chart refresher training"
                  value={newAction.title}
                  onChange={e => setNewAction(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assign to Staff Member *</label>
                <select
                  value={newAction.staffId}
                  onChange={e => setNewAction(prev => ({ ...prev, staffId: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6]"
                >
                  <option value="">Select Staff Member...</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.role?.name || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                  <select
                    value={newAction.priority}
                    onChange={e => setNewAction(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={newAction.dueDate}
                    onChange={e => setNewAction(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Source / Origin</label>
                <select
                  value={newAction.source}
                  onChange={e => setNewAction(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                >
                  <option value="Audit Finding">Audit Finding</option>
                  <option value="Supervision & Appraisal">Supervision & Appraisal</option>
                  <option value="Spot Check Observation">Spot Check Observation</option>
                  <option value="Incident Remediation">Incident Remediation</option>
                  <option value="Compliance Review">Compliance Review</option>
                  <option value="Management Directive">Management Directive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Action Description & Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Outline the specific steps required to complete this action..."
                  value={newAction.description}
                  onChange={e => setNewAction(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Progress Notes</label>
                <textarea
                  rows={2}
                  placeholder="Initial notes or guidance for the staff member..."
                  value={newAction.notes}
                  onChange={e => setNewAction(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAction}
                disabled={submitting}
                className="px-5 py-2 bg-gradient-to-r from-[#224fa6] to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Adding Action...' : 'Save & Assign Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Action Details Modal */}
      {selectedActionForView && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#224fa6] to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Action Details</h3>
                <p className="text-xs text-blue-100 mt-0.5">Assigned to {selectedActionForView.staff ? `${selectedActionForView.staff.firstName} ${selectedActionForView.staff.lastName}` : 'Unassigned'}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActionForView(null)}
                className="text-white/80 hover:text-white text-2xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Action Title</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedActionForView.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-500">Status</span>
                  <p className="text-xs font-semibold text-gray-800 mt-0.5">{selectedActionForView.status}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-500">Priority</span>
                  <p className="text-xs font-semibold text-gray-800 mt-0.5">{selectedActionForView.priority}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-500">Target Due Date</span>
                  <p className="text-xs font-semibold text-gray-800 mt-0.5">{formatDate(selectedActionForView.dueDate)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-500">Source</span>
                  <p className="text-xs font-semibold text-gray-800 mt-0.5">{selectedActionForView.source}</p>
                </div>
              </div>

              {selectedActionForView.description && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Description & Required Steps</span>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap mt-1 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {selectedActionForView.description}
                  </p>
                </div>
              )}

              {selectedActionForView.notes && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Progress Notes</span>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap mt-1 leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    {selectedActionForView.notes}
                  </p>
                </div>
              )}

              <div className="text-[11px] text-gray-400 border-t pt-3">
                Created on {formatDate(selectedActionForView.createdAt)} by {selectedActionForView.createdBy ? `${selectedActionForView.createdBy.firstName} ${selectedActionForView.createdBy.lastName}` : 'Management'}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Update Status:</span>
                <select
                  value={selectedActionForView.status}
                  onChange={async e => {
                    await handleUpdateStatus(selectedActionForView.id, e.target.value);
                    setSelectedActionForView(prev => ({ ...prev, status: e.target.value }));
                  }}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg border bg-white cursor-pointer"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActionForView(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
