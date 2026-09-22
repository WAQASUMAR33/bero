'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Check, 
  X,
  ExternalLink
} from 'lucide-react';

export default function KpiActionPlanTable({ onNotification }) {
  const [actions, setActions] = useState([]);
  const [counts, setCounts] = useState({ total: 0, open: 0, inProgress: 0, completed: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    title: '',
    area: 'Occupancy',
    sourceMonth: 'General',
    description: '',
    actionRequired: '',
    assignedTo: 'Registered Manager',
    priority: 'MEDIUM',
    targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'OPEN',
    progressNotes: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/kpi/actions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActions(data.actions || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error('Error fetching KPI actions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [statusFilter, priorityFilter, searchTerm]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setSelectedAction(null);
    setShowModal(true);
  };

  const handleOpenEdit = (action) => {
    setSelectedAction(action);
    setFormData({
      id: action.id,
      title: action.title || '',
      area: action.area || 'Occupancy',
      sourceMonth: action.sourceMonth || '',
      description: action.description || '',
      actionRequired: action.actionRequired || '',
      assignedTo: action.assignedTo || 'Registered Manager',
      priority: action.priority || 'MEDIUM',
      targetDate: action.targetDate ? action.targetDate.split('T')[0] : '',
      status: action.status || 'OPEN',
      progressNotes: action.progressNotes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = formData.id ? 'PUT' : 'POST';
      const res = await fetch('/api/kpi/actions', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        onNotification?.(formData.id ? 'Action item updated successfully.' : 'Action item added to plan.', 'success');
        setShowModal(false);
        fetchActions();
      } else {
        onNotification?.(data.error || 'Failed to save action item', 'error');
      }
    } catch {
      onNotification?.('Network error saving action item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (action) => {
    const nextStatus = action.status === 'COMPLETED' ? 'OPEN' : 'COMPLETED';
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/kpi/actions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: action.id,
          status: nextStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        onNotification?.(`Action marked as ${nextStatus.toLowerCase()}.`, 'success');
        fetchActions();
      }
    } catch {
      onNotification?.('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/kpi/actions?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        onNotification?.('Action plan item deleted.', 'success');
        setDeleteConfirmId(null);
        fetchActions();
      }
    } catch {
      onNotification?.('Failed to delete action', 'error');
    }
  };

  const isOverdue = (date, status) => {
    if (!date || status === 'COMPLETED') return false;
    return new Date(date) < new Date();
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-red-100 text-red-700 border border-red-200 rounded-full">Critical</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200 rounded-full">High</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200 rounded-full">Medium</span>;
      case 'LOW':
      default:
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200 rounded-full">Low</span>;
    }
  };

  const getStatusBadge = (status, date) => {
    if (status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Completed
        </span>
      );
    }
    if (isOverdue(date, status)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full animate-pulse">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          Overdue
        </span>
      );
    }
    if (status === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        Open
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#224fa6]" />
            KPI Action Plan Register
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Targeted interventions and management actions escalated directly from monthly KPI evaluations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#224fa6] hover:bg-[#1b3f85] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Action Plan Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search actions by title, area, required intervention, or lead person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224fa6]/30 focus:border-[#224fa6]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs">
            <span className="px-2 font-semibold text-gray-500">Status:</span>
            {['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED'].map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-[#224fa6] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {status === 'ALL' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Action Plan Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-[#224fa6] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-500 font-medium">Loading action plan items...</p>
          </div>
        ) : actions.length === 0 ? (
          <div className="py-16 text-center px-4">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No Action Plan Items Found</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mt-1 mb-4">
              Items flagged as &quot;Added to Action Plan&quot; in your monthly KPI evaluations automatically populate here.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#224fa6] text-white rounded-xl text-xs font-bold hover:bg-[#1b3f85] transition-all cursor-pointer"
            >
              Add First Action Item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">Done</th>
                  <th className="py-3.5 px-4">Action Item & Area</th>
                  <th className="py-3.5 px-4">Source Month</th>
                  <th className="py-3.5 px-4">Intervention Required</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Target Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {actions.map(action => (
                  <tr 
                    key={action.id} 
                    className={`hover:bg-blue-50/30 transition-colors ${
                      action.status === 'COMPLETED' ? 'bg-gray-50/40 text-gray-500' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(action)}
                        title={action.status === 'COMPLETED' ? 'Mark Incomplete' : 'Mark Complete'}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                          action.status === 'COMPLETED'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'border-gray-300 hover:border-[#224fa6] bg-white'
                        }`}
                      >
                        {action.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 line-clamp-1">{action.title}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#224fa6]/10 text-[#224fa6] uppercase tracking-wider">
                          {action.area}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-gray-600 font-medium whitespace-nowrap">
                      {action.sourceMonth || 'General'}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-gray-700 line-clamp-2 text-xs font-medium max-w-sm">
                        {action.actionRequired}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-gray-800 font-semibold text-xs">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{action.assignedTo || 'Registered Manager'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getPriorityBadge(action.priority)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{action.targetDate ? new Date(action.targetDate).toLocaleDateString('en-GB') : 'No Date'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(action.status, action.targetDate)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(action)}
                          className="p-1.5 text-gray-500 hover:text-[#224fa6] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Action"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {deleteConfirmId === action.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(action.id)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[11px] font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(action.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Action"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Action Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-[#224fa6] to-indigo-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                {formData.id ? 'Edit Action Plan Item' : 'New KPI Action Plan Item'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Action Title / Objective *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Occupancy: Follow up brokerage team referrals"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    KPI Area *
                  </label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                  >
                    <option value="Occupancy">Occupancy</option>
                    <option value="Live Enquiries">Live Enquiries</option>
                    <option value="Safeguardings">Safeguardings</option>
                    <option value="CQC Notifications">CQC Notifications</option>
                    <option value="RIDDOR Reports">RIDDOR Reports</option>
                    <option value="Accidents">Accidents</option>
                    <option value="Incidents">Incidents</option>
                    <option value="Near Misses">Near Misses</option>
                    <option value="Complaints">Complaints</option>
                    <option value="Compliments">Compliments</option>
                    <option value="P&L">P&L (Profit & Loss)</option>
                    <option value="Sickness">Sickness (Staff)</option>
                    <option value="Other">Other Operational Area</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Source Evaluation Month
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. July 2026 or General"
                    value={formData.sourceMonth}
                    onChange={(e) => setFormData({ ...formData, sourceMonth: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Actions Required / Specific Intervention *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the exact steps, protocols, or actions required to resolve this item..."
                  value={formData.actionRequired}
                  onChange={(e) => setFormData({ ...formData, actionRequired: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Assigned Lead
                  </label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Progress Notes / Review Evidence
                </label>
                <textarea
                  rows={2}
                  placeholder="Record ongoing updates or sign-off evidence..."
                  value={formData.progressNotes}
                  onChange={(e) => setFormData({ ...formData, progressNotes: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs sm:text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#224fa6] hover:bg-[#1b3f85] text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : formData.id ? 'Save Changes' : 'Create Action Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
