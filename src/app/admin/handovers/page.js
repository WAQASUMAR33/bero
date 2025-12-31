'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

export default function HandoversPage() {
  const [user, setUser] = useState(null);
  const [handovers, setHandovers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [filterDate, setFilterDate] = useState('');
  const [filterServiceSeekerId, setFilterServiceSeekerId] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [serviceSeekers, setServiceSeekers] = useState([]);
  const [users, setUsers] = useState([]);
  const router = useRouter();

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchHandovers();
      fetchServiceSeekers();
      fetchUsers();
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchHandovers();
    }
  }, [filterDate, filterServiceSeekerId, filterUserId]);

  const fetchServiceSeekers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/service-seekers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setServiceSeekers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching service seekers:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchHandovers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      let url = '/api/handovers';
      
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      if (filterServiceSeekerId) params.append('serviceSeekerId', filterServiceSeekerId);
      if (filterUserId) params.append('userId', filterUserId);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setHandovers(result.data || []);
      } else {
        console.error('Error fetching handovers:', result.error);
        setHandovers([]);
        showNotification(result.error || 'Failed to fetch handovers', 'error');
      }
    } catch (error) {
      console.error('Error fetching handovers:', error);
      setHandovers([]);
      showNotification('Failed to fetch handovers. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (handoverId) => {
    if (!confirm('Are you sure you want to delete this handover record?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/handovers/${handoverId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setHandovers(prev => prev.filter(h => h.id !== handoverId));
        showNotification('Handover deleted successfully!', 'success');
      } else {
        showNotification(result.error || 'Failed to delete handover', 'error');
      }
    } catch (error) {
      console.error('Error deleting handover:', error);
      showNotification('Error deleting handover. Please try again.', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading handovers...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Handovers</h1>
                    <p className="text-gray-600">View and manage shift handover records</p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                    />
                  </div>

                  {/* Service Seeker Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Service User</label>
                    <select
                      value={filterServiceSeekerId}
                      onChange={(e) => setFilterServiceSeekerId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                    >
                      <option value="">All Service Users</option>
                      {serviceSeekers.map(ss => (
                        <option key={ss.id} value={ss.id}>
                          {ss.preferredName || `${ss.firstName} ${ss.lastName}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* User Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Staff Member</label>
                    <select
                      value={filterUserId}
                      onChange={(e) => setFilterUserId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                    >
                      <option value="">All Staff</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Handovers Table */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">From</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">To</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service User</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {handovers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                            No handover records found
                          </td>
                        </tr>
                      ) : (
                        handovers.map((handover) => (
                          <tr key={handover.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {handover.fromShiftAssignment?.user?.firstName} {handover.fromShiftAssignment?.user?.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {handover.fromShiftAssignment?.shift?.shiftType?.name || 'Shift'}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {handover.toShiftAssignment?.user?.firstName} {handover.toShiftAssignment?.user?.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {handover.toShiftAssignment?.shift?.shiftType?.name || 'Shift'}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {handover.serviceSeeker?.preferredName || `${handover.serviceSeeker?.firstName} ${handover.serviceSeeker?.lastName}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                {handover.serviceSeeker?.address || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDateTime(handover.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {handover.handoverNotes || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedHandover(handover);
                                    setShowDetailModal(true);
                                  }}
                                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleDelete(handover.id)}
                                  className="px-3 py-1 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Handover Detail Modal */}
      {showDetailModal && selectedHandover && (
        <HandoverDetailModal
          handover={selectedHandover}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedHandover(null);
          }}
        />
      )}

      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ show: false, message: '', type: 'success' })}
        />
      )}
    </div>
  );
}

// Handover Detail Modal Component
function HandoverDetailModal({ handover, onClose }) {
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString;
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Handover Details</h2>
              <p className="text-sm text-white/90 mt-1">
                {formatDateTime(handover.createdAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* From/To Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">Handed Over From</div>
              <div className="text-lg font-medium text-gray-900">
                {handover.fromShiftAssignment?.user?.firstName} {handover.fromShiftAssignment?.user?.lastName}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {handover.fromShiftAssignment?.shift?.shiftType?.name || 'Shift'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatTime(handover.fromShiftAssignment?.shift?.startTime)} - {formatTime(handover.fromShiftAssignment?.shift?.endTime)}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">Handed Over To</div>
              <div className="text-lg font-medium text-gray-900">
                {handover.toShiftAssignment?.user?.firstName} {handover.toShiftAssignment?.user?.lastName}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {handover.toShiftAssignment?.shift?.shiftType?.name || 'Shift'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatTime(handover.toShiftAssignment?.shift?.startTime)} - {formatTime(handover.toShiftAssignment?.shift?.endTime)}
              </div>
            </div>
          </div>

          {/* Service User */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Service User</div>
            <div className="text-lg font-medium text-gray-900">
              {handover.serviceSeeker?.preferredName || `${handover.serviceSeeker?.firstName} ${handover.serviceSeeker?.lastName}`}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {handover.serviceSeeker?.address || '-'}
            </div>
          </div>

          {/* Handover Notes */}
          {handover.handoverNotes && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Handover Notes</div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap">
                {handover.handoverNotes}
              </div>
            </div>
          )}

          {/* Remaining Tasks */}
          {handover.remainingTasks && Array.isArray(handover.remainingTasks) && handover.remainingTasks.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Remaining Tasks</div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {handover.remainingTasks.map((taskGroup, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {taskGroup.taskType?.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    {taskGroup.tasks && Array.isArray(taskGroup.tasks) && (
                      <div className="text-xs text-gray-600 mt-1 ml-4">
                        {taskGroup.tasks.length} task(s) remaining
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visits */}
          {handover.visits && Array.isArray(handover.visits) && handover.visits.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Scheduled Visits</div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {handover.visits.map((visit, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                    <div className="text-sm font-medium text-gray-900">
                      {visit.name || 'Visit'}
                    </div>
                    {visit.time && (
                      <div className="text-xs text-gray-600 mt-1">
                        Time: {visit.time}
                      </div>
                    )}
                    {visit.purpose && (
                      <div className="text-xs text-gray-600 mt-1">
                        Purpose: {visit.purpose}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues */}
          {handover.issues && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Service User Issues/Concerns</div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap">
                {handover.issues}
              </div>
            </div>
          )}

          {/* Created By */}
          <div className="text-xs text-gray-500 border-t border-gray-200 pt-4">
            Recorded by: {handover.createdBy?.firstName} {handover.createdBy?.lastName}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

