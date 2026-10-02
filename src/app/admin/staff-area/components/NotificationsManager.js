'use client';

import { useState, useEffect } from 'react';

export default function NotificationsManager({ showNotification }) {
  const [notifications, setNotifications] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    priority: 'NORMAL',
    targetType: 'ALL', // 'ALL' | 'ROLE' | 'INDIVIDUAL' | 'CUSTOM'
    sentByRoles: [],
    sentToUserIds: [],
    acknowledgeByDate: '',
  });

  useEffect(() => {
    fetchNotifications();
    fetchRolesAndUsers();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/staff-area/notifications?scope=admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      } else {
        showNotification(data.error || 'Failed to load notifications', 'error');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      showNotification('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRolesAndUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch roles
      const rolesRes = await fetch('/api/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      }

      // Fetch users
      const usersRes = await fetch('/api/users?status=CURRENT', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
      }
    } catch (err) {
      console.error('Error loading roles or users:', err);
    }
  };

  const handleRoleToggle = (roleIdentifier) => {
    setFormData((prev) => {
      const exists = prev.sentByRoles.includes(roleIdentifier);
      const updated = exists
        ? prev.sentByRoles.filter((r) => r !== roleIdentifier)
        : [...prev.sentByRoles, roleIdentifier];
      return { ...prev, sentByRoles: updated };
    });
  };

  const handleUserToggle = (userId) => {
    setFormData((prev) => {
      const exists = prev.sentToUserIds.includes(userId);
      const updated = exists
        ? prev.sentToUserIds.filter((id) => id !== userId)
        : [...prev.sentToUserIds, userId];
      return { ...prev, sentToUserIds: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotification('Please enter a notification title', 'error');
      return;
    }
    if (!formData.body.trim()) {
      showNotification('Please enter notification details / memo content', 'error');
      return;
    }

    if (formData.targetType === 'ROLE' && formData.sentByRoles.length === 0) {
      showNotification('Please select at least one role to receive this notification', 'error');
      return;
    }

    if (formData.targetType === 'INDIVIDUAL' && formData.sentToUserIds.length === 0) {
      showNotification('Please select at least one staff member', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/staff-area/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        showNotification('Formal notification sent to staff successfully!', 'success');
        setShowAddModal(false);
        setFormData({
          title: '',
          body: '',
          priority: 'NORMAL',
          targetType: 'ALL',
          sentByRoles: [],
          sentToUserIds: [],
          acknowledgeByDate: '',
        });
        fetchNotifications();
      } else {
        showNotification(data.error || 'Failed to send notification', 'error');
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      showNotification('Failed to send notification', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete notification "${title}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/staff-area/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Notification deleted successfully', 'success');
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (selectedNotif?.id === id) {
          setSelectedNotif(null);
          setDetailsModalOpen(false);
        }
      } else {
        showNotification(data.error || 'Failed to delete notification', 'error');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      showNotification('Failed to delete notification', 'error');
    }
  };

  const handleOpenDetails = async (notif) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/staff-area/notifications/${notif.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedNotif(data.data);
      } else {
        setSelectedNotif(notif);
      }
    } catch (err) {
      setSelectedNotif(notif);
    }
    setDetailsModalOpen(true);
  };

  const filteredNotifs = notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const totalSent = notifications.length;
  const totalAcks = notifications.reduce((acc, curr) => acc + (curr.acknowledgedCount || 0), 0);
  const totalTargetRecipients = notifications.reduce((acc, curr) => acc + (curr.totalTargetCount || 0), 0);
  const pendingAcks = Math.max(0, totalTargetRecipients - totalAcks);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#224fa6] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Formal Memos Sent</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalSent}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff Acknowledgements</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalAcks}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Acknowledgements</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{pendingAcks}</h3>
          </div>
        </div>
      </div>

      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 w-full sm:max-w-md relative">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all outline-none"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Send Formal Notification
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6]"></div>
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-[#224fa6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Notifications Sent Yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Broadcast mandatory memos, safety warnings, and policy notices that require formal staff acknowledgement.
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#224fa6] text-white text-sm font-medium rounded-xl hover:bg-blue-800 transition"
            >
              Compose First Memo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifs.map((notif) => {
            const total = notif.totalTargetCount || 0;
            const acks = notif.acknowledgedCount || 0;
            const pct = total > 0 ? Math.round((acks / total) * 100) : 0;
            const isOverdue =
              notif.acknowledgeByDate &&
              new Date(notif.acknowledgeByDate) < new Date() &&
              acks < total;

            const priorityBadge =
              notif.priority === 'URGENT' ? (
                <span className="bg-red-100 text-red-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Urgent
                </span>
              ) : notif.priority === 'HIGH' ? (
                <span className="bg-orange-100 text-orange-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  High Priority
                </span>
              ) : (
                <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Normal
                </span>
              );

            return (
              <div
                key={notif.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 sm:p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {priorityBadge}

                      <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {notif.targetType === 'ALL'
                          ? 'All Staff'
                          : notif.targetType === 'ROLE'
                          ? `Roles: ${notif.sentByRoles?.join(', ') || 'Selected'}`
                          : notif.targetType === 'INDIVIDUAL'
                          ? 'Specific Staff'
                          : 'Custom Audience'}
                      </span>

                      {notif.acknowledgeByDate && (
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            isOverdue
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Deadline:{' '}
                          {new Date(notif.acknowledgeByDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-gray-900">{notif.title}</h4>

                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {notif.body}
                    </p>

                    <div className="text-xs text-gray-400 flex items-center gap-3 pt-1">
                      <span>
                        Sent by:{' '}
                        <strong className="text-gray-600 font-semibold">
                          {notif.createdBy
                            ? `${notif.createdBy.firstName} ${notif.createdBy.lastName}`
                            : 'Management'}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(notif.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Progress & Actions */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 flex-shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-700">
                          {acks} of {total} acknowledged
                        </span>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {pct}%
                        </span>
                      </div>
                      <div className="w-36 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDetails(notif)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#224fa6] text-xs font-semibold rounded-xl transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Track Status
                      </button>

                      <button
                        onClick={() => handleDelete(notif.id, notif.title)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="Delete notification"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compose Notification Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 transition-all max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-5 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Send Formal Staff Notification</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Send a formal memo requiring mandatory staff acknowledgement
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 sleek-scrollbar">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Notification Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical Safety Memo: Medication Administration Protocols"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none transition"
                  >
                    <option value="NORMAL">Normal Notice</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Action Required</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Acknowledgement Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.acknowledgeByDate}
                    onChange={(e) => setFormData({ ...formData, acknowledgeByDate: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              {/* Target Audience selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Target Audience <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[
                    { id: 'ALL', label: 'All Staff' },
                    { id: 'ROLE', label: 'By Role' },
                    { id: 'INDIVIDUAL', label: 'Specific Staff' },
                    { id: 'CUSTOM', label: 'Roles & Staff' },
                  ].map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, targetType: target.id })}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        formData.targetType === target.id
                          ? 'bg-[#224fa6] text-white border-[#224fa6] shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>

                {/* Role selector */}
                {(formData.targetType === 'ROLE' || formData.targetType === 'CUSTOM') && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl mb-3">
                    <p className="text-xs font-bold text-gray-700 mb-2">Select Target Roles:</p>
                    <div className="flex flex-wrap gap-2">
                      {roles.map((r) => {
                        const isSelected = formData.sentByRoles.includes(r.displayName || r.name);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => handleRoleToggle(r.displayName || r.name)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {r.displayName || r.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* User selector */}
                {(formData.targetType === 'INDIVIDUAL' || formData.targetType === 'CUSTOM') && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl max-h-48 overflow-y-auto sleek-scrollbar">
                    <p className="text-xs font-bold text-gray-700 mb-2">Select Specific Staff Members:</p>
                    <div className="space-y-1">
                      {users.map((u) => {
                        const isSelected = formData.sentToUserIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition ${
                              isSelected ? 'bg-blue-50 text-[#224fa6] font-semibold' : 'hover:bg-white'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleUserToggle(u.id)}
                                className="rounded text-[#224fa6] focus:ring-[#224fa6]"
                              />
                              {u.firstName} {u.lastName}
                            </span>
                            <span className="text-gray-400 font-normal">
                              {u.role?.displayName || u.role?.name || 'Staff'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Notification Body / Memo Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Detail the mandatory procedure, compliance requirement, or policy notice that staff must read and acknowledge..."
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none transition leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#224fa6] to-[#3270e9] hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Notification'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details & Acknowledgements Modal */}
      {detailsModalOpen && selectedNotif && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 transition-all max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100 mb-5 flex-shrink-0">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  Status & Acknowledgement Log
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{selectedNotif.title}</h3>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 sleek-scrollbar space-y-6">
              {/* Message preview */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/60">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Notification Message</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedNotif.body}</p>
              </div>

              {/* Status summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-center">
                  <p className="text-[11px] font-semibold text-blue-700">Target Recipients</p>
                  <p className="text-xl font-bold text-blue-900 mt-0.5">{selectedNotif.totalTargetCount || 0}</p>
                </div>
                <div className="p-3 bg-green-50/60 border border-green-100 rounded-xl text-center">
                  <p className="text-[11px] font-semibold text-green-700">Acknowledged</p>
                  <p className="text-xl font-bold text-green-900 mt-0.5">{selectedNotif.acknowledgements?.length || 0}</p>
                </div>
                <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-center col-span-2 sm:col-span-1">
                  <p className="text-[11px] font-semibold text-amber-700">Pending</p>
                  <p className="text-xl font-bold text-amber-900 mt-0.5">
                    {selectedNotif.unacknowledgedUsers?.length ||
                      Math.max(0, (selectedNotif.totalTargetCount || 0) - (selectedNotif.acknowledgements?.length || 0))}
                  </p>
                </div>
              </div>

              {/* Acknowledged Staff List */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Acknowledged Staff ({selectedNotif.acknowledgements?.length || 0})
                </h4>
                {selectedNotif.acknowledgements && selectedNotif.acknowledgements.length > 0 ? (
                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 overflow-hidden">
                    {selectedNotif.acknowledgements.map((ack) => (
                      <div key={ack.userId} className="p-3 flex items-center justify-between text-xs hover:bg-gray-50/50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center text-[11px]">
                            {ack.user?.firstName?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {ack.user ? `${ack.user.firstName} ${ack.user.lastName}` : `User #${ack.userId}`}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {ack.user?.role?.displayName || 'Care Staff'}
                            </p>
                          </div>
                        </div>
                        <span className="text-gray-500 font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-md">
                          Read {new Date(ack.readAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic p-3 bg-gray-50 rounded-xl text-center">
                    No staff members have acknowledged this notification yet.
                  </p>
                )}
              </div>

              {/* Unacknowledged Staff List */}
              {selectedNotif.unacknowledgedUsers && selectedNotif.unacknowledgedUsers.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Pending Acknowledgement ({selectedNotif.unacknowledgedUsers.length})
                  </h4>
                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 overflow-hidden max-h-48 overflow-y-auto sleek-scrollbar">
                    {selectedNotif.unacknowledgedUsers.map((u) => (
                      <div key={u.id} className="p-3 flex items-center justify-between text-xs hover:bg-amber-50/30">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-[11px]">
                            {u.firstName?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{u.firstName} {u.lastName}</p>
                            <p className="text-[11px] text-gray-400">{u.roleName || 'Staff'}</p>
                          </div>
                        </div>
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                          Awaiting Read
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 mt-6 flex justify-end flex-shrink-0">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
