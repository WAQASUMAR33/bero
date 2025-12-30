'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

export default function HolidaysPage() {
  const [user, setUser] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [users, setUsers] = useState([]);
  const [holidayTypes, setHolidayTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedHolidayForRejection, setSelectedHolidayForRejection] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [allHolidays, setAllHolidays] = useState([]);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    userId: '',
    holidayTypeId: '',
    startDate: '',
    endDate: '',
    startTime: '00',
    startMinute: '00',
    endTime: '23',
    endMinute: '59',
    includeWeekends: 'No',
    description: '',
    holidayHours: '24'
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchUsers();
      fetchHolidayTypes();
      fetchHolidays();
    } else {
      router.push('/login');
    }
  }, [router, currentMonth, filterUserId, filterStatus]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data.filter(u => u.status === 'CURRENT'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchHolidayTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/holiday-types', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setHolidayTypes(result.data);
      }
    } catch (error) {
      console.error('Error fetching holiday types:', error);
    }
  };

  const fetchHolidays = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Get start and end of current month
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      let url = `/api/holidays?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`;
      
      if (filterUserId) {
        url += `&userId=${filterUserId}`;
      }
      if (filterStatus !== 'all') {
        url += `&status=${filterStatus}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setHolidays(result.data);
      } else {
        console.error('Error fetching holidays:', result.error);
        setHolidays([]);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
      setHolidays([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: parseInt(formData.userId),
          holidayTypeId: parseInt(formData.holidayTypeId),
          startDate: formData.startDate,
          endDate: formData.endDate,
          startTime: `${formData.startTime}:${formData.startMinute}`,
          endTime: `${formData.endTime}:${formData.endMinute}`,
          includeWeekends: formData.includeWeekends === 'Yes',
          description: formData.description,
          holidayHours: parseFloat(formData.holidayHours)
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setHolidays(prev => [...prev, result.data]);
        setShowAddModal(false);
        resetForm();
        showNotification('Holiday booked successfully!', 'success');
        fetchHolidays();
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
      showNotification('Error adding holiday. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (holidayId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/holidays/${holidayId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // Remove approved holiday from the list
        setHolidays(prev => prev.filter(h => h.id !== holidayId));
        showNotification('Holiday approved successfully!', 'success');
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error approving holiday:', error);
      showNotification('Error approving holiday. Please try again.', 'error');
    }
  };

  const handleReject = async (holidayId, reason) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/holidays/${holidayId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rejectionReason: reason })
      });

      const result = await response.json();
      
      if (result.success) {
        // Remove rejected holiday from the list
        setHolidays(prev => prev.filter(h => h.id !== holidayId));
        showNotification('Holiday rejected successfully!', 'success');
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error rejecting holiday:', error);
      showNotification('Error rejecting holiday. Please try again.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      holidayTypeId: '',
      startDate: '',
      endDate: '',
      startTime: '00',
      startMinute: '00',
      endTime: '23',
      endMinute: '59',
      includeWeekends: 'No',
      description: '',
      holidayHours: '24'
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getHolidaysForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.filter(holiday => {
      const start = new Date(holiday.startDate).toISOString().split('T')[0];
      const end = new Date(holiday.endDate).toISOString().split('T')[0];
      return dateStr >= start && dateStr <= end;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-300';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

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
                <p className="text-gray-600">Loading holidays...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Holidays</h1>
                    <p className="text-gray-600">Manage staff holidays and approvals</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={async () => {
                        setShowReportModal(true);
                        setIsLoadingReport(true);
                        try {
                          const token = localStorage.getItem('token');
                          const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                          const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                          
                          const response = await fetch(`/api/holidays?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          const result = await response.json();
                          
                          if (result.success) {
                            setAllHolidays(result.data);
                          }
                        } catch (error) {
                          console.error('Error fetching holiday report:', error);
                        } finally {
                          setIsLoadingReport(false);
                        }
                      }}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Holiday Report</span>
                    </button>
                    <button
                      onClick={() => {
                        resetForm();
                        setFormData(prev => ({ ...prev, userId: user.id.toString() }));
                        setShowRequestModal(true);
                      }}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Request Holiday</span>
                    </button>
                    <button
                      onClick={openAddModal}
                      className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Book a Holiday</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Staff</label>
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                    >
                      <option value="all">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Calendar Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigateMonth(-1)}
                      className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
                    <button
                      onClick={() => navigateMonth(1)}
                      className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="p-6">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-24 border border-gray-200 rounded-lg"></div>
                    ))}

                    {/* Days of the month */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const dayHolidays = getHolidaysForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();

                      return (
                        <div
                          key={day}
                          className={`h-24 border rounded-lg p-2 overflow-y-auto ${
                            isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                          }`}
                        >
                          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                            {day}
                          </div>
                          <div className="space-y-1">
                            {dayHolidays.slice(0, 2).map(holiday => (
                              <div
                                key={holiday.id}
                                onClick={() => setSelectedHoliday(holiday)}
                                className={`text-xs p-1 rounded cursor-pointer border ${getStatusColor(holiday.status)}`}
                                style={{ backgroundColor: holiday.holidayType?.color ? `${holiday.holidayType.color}20` : undefined }}
                              >
                                <div className="font-medium truncate">
                                  {holiday.user?.firstName || ''} {holiday.user?.lastName || ''}
                                </div>
                                <div className="text-xs opacity-75 truncate">
                                  {holiday.holidayType?.name || '-'}
                                </div>
                              </div>
                            ))}
                            {dayHolidays.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{dayHolidays.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Holidays List - Only Pending Requests */}
              <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Holiday Requests (Pending)</h3>
                  <p className="text-sm text-gray-600 mt-1">Approved and rejected requests are moved to the Holiday Report</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">End Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hours</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {holidays.filter(h => h.status === 'PENDING').length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                            No pending holiday requests
                          </td>
                        </tr>
                      ) : (
                        holidays.filter(h => h.status === 'PENDING').map((holiday) => (
                          <tr key={holiday.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                    <span className="text-white font-semibold text-xs">
                                      {holiday.user?.firstName?.[0] || ''}{holiday.user?.lastName?.[0] || ''}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {holiday.user?.firstName || ''} {holiday.user?.lastName || ''}
                                  </div>
                                  <div className="text-sm text-gray-500">{holiday.user?.email || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{holiday.holidayType?.name || '-'}</div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(holiday.startDate).toLocaleDateString('en-GB')}
                                {holiday.startTime && (
                                  <div className="text-xs text-gray-500">{holiday.startTime}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(holiday.endDate).toLocaleDateString('en-GB')}
                                {holiday.endTime && (
                                  <div className="text-xs text-gray-500">{holiday.endTime}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{holiday.holidayHours || '-'}h</div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(holiday.status)}`}>
                                {holiday.status}
                              </span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                              {holiday.status === 'PENDING' && (
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleApprove(holiday.id)}
                                    className="px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedHolidayForRejection(holiday);
                                      setShowRejectModal(true);
                                    }}
                                    className="px-3 py-1 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {holiday.status === 'REJECTED' && holiday.rejectionReason && (
                                <div className="text-xs text-red-600 italic">
                                  {holiday.rejectionReason}
                                </div>
                              )}
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

          {/* Reject Holiday Modal */}
          {showRejectModal && selectedHolidayForRejection && (
            <RejectHolidayModal
              holiday={selectedHolidayForRejection}
              onClose={() => {
                setShowRejectModal(false);
                setSelectedHolidayForRejection(null);
              }}
              onReject={async (reason) => {
                await handleReject(selectedHolidayForRejection.id, reason);
                setShowRejectModal(false);
                setSelectedHolidayForRejection(null);
              }}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Holiday Report Modal */}
          {showReportModal && (
            <HolidayReportModal
              holidays={allHolidays}
              isLoading={isLoadingReport}
              monthName={currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              onClose={() => setShowReportModal(false)}
            />
          )}

          {/* Request Holiday Modal */}
          {showRequestModal && (
            <RequestHolidayModal
              user={user}
              holidayTypes={holidayTypes}
              onClose={() => {
                setShowRequestModal(false);
                resetForm();
              }}
              onSave={async (formData) => {
                try {
                  setIsSubmitting(true);
                  const token = localStorage.getItem('token');
                  const response = await fetch('/api/holidays', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      userId: user.id,
                      holidayTypeId: parseInt(formData.holidayTypeId),
                      startDate: formData.startDate,
                      endDate: formData.endDate,
                      startTime: `${formData.startTime}:${formData.startMinute}`,
                      endTime: `${formData.endTime}:${formData.endMinute}`,
                      includeWeekends: formData.includeWeekends === 'Yes',
                      description: formData.description,
                      holidayHours: parseFloat(formData.holidayHours)
                    }),
                  });

                  const result = await response.json();
                  
                  if (result.success) {
                    setHolidays(prev => [...prev, result.data]);
                    setShowRequestModal(false);
                    resetForm();
                    showNotification('Holiday request submitted successfully!', 'success');
                    fetchHolidays();
                  } else {
                    showNotification(`Error: ${result.error}`, 'error');
                  }
                } catch (error) {
                  console.error('Error requesting holiday:', error);
                  showNotification('Error submitting holiday request. Please try again.', 'error');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Add Holiday Modal */}
          {showAddModal && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 max-w-5xl w-full max-h-[95vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Add Holiday</h3>
                      <p className="text-sm text-gray-600 mt-1">Book a holiday for staff member</p>
                    </div>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleAddHoliday} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Staff *</label>
                        <select
                          required
                          value={formData.userId}
                          onChange={(e) => setFormData({...formData, userId: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                        >
                          <option value="">Please Select</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.firstName} {u.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Type *</label>
                        <select
                          required
                          value={formData.holidayTypeId}
                          onChange={(e) => setFormData({...formData, holidayTypeId: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                        >
                          <option value="">Please Select</option>
                          {holidayTypes.map(type => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                        <input
                          type="date"
                          required
                          value={formData.startDate}
                          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
                        <input
                          type="date"
                          required
                          value={formData.endDate}
                          onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                        <div className="flex gap-2">
                          <select
                            value={formData.startTime}
                            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          <select
                            value={formData.startMinute}
                            onChange={(e) => setFormData({...formData, startMinute: e.target.value})}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                          >
                            {['00', '15', '30', '45'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                        <div className="flex gap-2">
                          <select
                            value={formData.endTime}
                            onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          <select
                            value={formData.endMinute}
                            onChange={(e) => setFormData({...formData, endMinute: e.target.value})}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                          >
                            {['00', '15', '30', '45'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Include Weekends?</label>
                        <select
                          value={formData.includeWeekends}
                          onChange={(e) => setFormData({...formData, includeWeekends: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Holiday hours</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.holidayHours}
                          onChange={(e) => setFormData({...formData, holidayHours: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                        placeholder="Additional notes about the holiday..."
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Settings Modal */}
          {showSettingsModal && (
            <HolidaySettingsModal
              onClose={() => setShowSettingsModal(false)}
              onUpdate={fetchHolidayTypes}
              onAddType={() => {
                // This will be handled by the settings modal itself
              }}
            />
          )}

          {/* Notification */}
          {notification.show && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification({ show: false, message: '', type: 'success' })}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// Reject Holiday Modal Component
function RejectHolidayModal({ holiday, onClose, onReject, isSubmitting }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setError('');
    onReject(rejectionReason);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Reject Holiday Request</h2>
              <p className="text-sm text-white/90 mt-1">
                {holiday?.user?.firstName} {holiday?.user?.lastName} - {holiday?.holidayType?.name}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Holiday Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Start Date:</span>
                <span className="ml-2 text-gray-900">
                  {holiday?.startDate ? new Date(holiday.startDate).toLocaleDateString('en-GB') : '-'}
                  {holiday?.startTime && (
                    <span className="text-gray-600"> at {holiday.startTime}</span>
                  )}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">End Date:</span>
                <span className="ml-2 text-gray-900">
                  {holiday?.endDate ? new Date(holiday.endDate).toLocaleDateString('en-GB') : '-'}
                  {holiday?.endTime && (
                    <span className="text-gray-600"> at {holiday.endTime}</span>
                  )}
                </span>
              </div>
            </div>
            {holiday?.description && (
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Description:</span>
                <p className="text-gray-900 mt-1">{holiday.description}</p>
              </div>
            )}
          </div>

          {/* Rejection Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setError('');
              }}
              rows={5}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 resize-y ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Please provide a reason for rejecting this holiday request..."
            />
            {error && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Rejecting...' : 'Reject Holiday'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Request Holiday Modal Component
function RequestHolidayModal({ user, holidayTypes, onClose, onSave, isSubmitting }) {
  const [formData, setFormData] = useState({
    holidayTypeId: '',
    startDate: '',
    endDate: '',
    startTime: '00',
    startMinute: '00',
    endTime: '23',
    endMinute: '59',
    includeWeekends: 'No',
    description: '',
    holidayHours: '24'
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.holidayTypeId) {
      newErrors.holidayTypeId = 'Holiday type is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Request Holiday</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Staff (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Staff</label>
            <input
              type="text"
              value={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Holiday Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Holiday Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.holidayTypeId}
              onChange={(e) => setFormData({ ...formData, holidayTypeId: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200 ${
                errors.holidayTypeId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Please Select</option>
              {holidayTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.holidayTypeId && (
              <p className="mt-1 text-sm text-red-500">{errors.holidayTypeId}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
              <div className="flex gap-2">
                <select
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, '0')}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.startMinute}
                  onChange={(e) => setFormData({ ...formData, startMinute: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                >
                  {['00', '15', '30', '45'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
              <div className="flex gap-2">
                <select
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, '0')}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.endMinute}
                  onChange={(e) => setFormData({ ...formData, endMinute: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                >
                  {['00', '15', '30', '45'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Include Weekends & Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Include Weekends?</label>
              <select
                value={formData.includeWeekends}
                onChange={(e) => setFormData({ ...formData, includeWeekends: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Holiday Hours</label>
              <input
                type="number"
                step="0.1"
                value={formData.holidayHours}
                onChange={(e) => setFormData({ ...formData, holidayHours: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 resize-y"
              placeholder="Additional notes about your holiday request..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Holiday Report Modal Component
function HolidayReportModal({ holidays, isLoading, monthName, onClose }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-300';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Holiday Report</h2>
              <p className="text-sm text-white/90 mt-1">{monthName}</p>
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
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading holiday report...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action By</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {holidays.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        No holidays found for this period
                      </td>
                    </tr>
                  ) : (
                    holidays.map((holiday) => (
                      <tr key={holiday.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                <span className="text-white font-semibold text-xs">
                                  {holiday.user?.firstName?.[0] || ''}{holiday.user?.lastName?.[0] || ''}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {holiday.user?.firstName || ''} {holiday.user?.lastName || ''}
                              </div>
                              <div className="text-sm text-gray-500">{holiday.user?.email || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{holiday.holidayType?.name || '-'}</div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(holiday.startDate)}
                            {holiday.startTime && (
                              <div className="text-xs text-gray-500">{holiday.startTime}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(holiday.endDate)}
                            {holiday.endTime && (
                              <div className="text-xs text-gray-500">{holiday.endTime}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(holiday.status)}`}>
                            {holiday.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {holiday.approvedBy ? (
                              <div>
                                <div className="font-medium">
                                  {holiday.approvedBy.firstName} {holiday.approvedBy.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {holiday.approvedAt ? formatDate(holiday.approvedAt) : '-'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {holiday.rejectionReason ? (
                              <div className="text-red-600 italic">{holiday.rejectionReason}</div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total: {holidays.length} | 
              Approved: {holidays.filter(h => h.status === 'APPROVED').length} | 
              Rejected: {holidays.filter(h => h.status === 'REJECTED').length} | 
              Pending: {holidays.filter(h => h.status === 'PENDING').length}
            </div>
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

// Holiday Settings Modal Component
function HolidaySettingsModal({ onClose, onUpdate }) {
  const [holidayTypes, setHolidayTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPaid: true,
    color: '#3B82F6'
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchHolidayTypes();
  }, []);

  const fetchHolidayTypes = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/holiday-types', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setHolidayTypes(result.data);
      }
    } catch (error) {
      console.error('Error fetching holiday types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingType 
        ? `/api/holiday-types/${editingType.id}`
        : '/api/holiday-types';
      const method = editingType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification(editingType ? 'Holiday type updated!' : 'Holiday type created!', 'success');
        setShowAddModal(false);
        setEditingType(null);
        resetForm();
        fetchHolidayTypes();
        onUpdate();
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error saving holiday type:', error);
      showNotification('Error saving holiday type', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this holiday type?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/holiday-types/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification('Holiday type deleted!', 'success');
        fetchHolidayTypes();
        onUpdate();
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting holiday type:', error);
      showNotification('Error deleting holiday type', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isPaid: true,
      color: '#3B82F6'
    });
  };

  const openEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      isPaid: type.isPaid,
      color: type.color || '#3B82F6'
    });
    setShowAddModal(true);
  };

  return (
    <>
      {/* Settings Modal */}
      <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
        <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[95vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Holiday Settings</h3>
                <p className="text-sm text-gray-600 mt-1">Manage holiday types and configurations</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    resetForm();
                    setEditingType(null);
                    setShowAddModal(true);
                  }}
                  className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
                >
                  Add Type
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading holiday types...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {holidayTypes.map(type => (
                  <div key={type.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: type.color || '#3B82F6' }}
                      ></div>
                      <div>
                        <div className="font-semibold text-gray-900">{type.name}</div>
                        {type.description && (
                          <div className="text-sm text-gray-600">{type.description}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {type.isPaid ? 'Paid' : 'Unpaid'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(type)}
                        className="px-3 py-1 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="px-3 py-1 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {holidayTypes.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No holiday types found. Click &quot;Add Type&quot; to create one.
                  </div>
                )}
              </div>
            )}

            {notification.show && (
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification({ show: false, message: '', type: 'success' })}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal - Separate full modal outside settings modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
          <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[95vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {editingType ? 'Edit Holiday Type' : 'Add Holiday Type'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {editingType ? 'Update holiday type details' : 'Create a new holiday type'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingType(null);
                    resetForm();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter holiday type name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter description (optional)"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Is Paid</label>
                    <select
                      value={formData.isPaid}
                      onChange={(e) => setFormData({...formData, isPaid: e.target.value === 'true'})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        className="w-16 h-12 border border-gray-200 rounded-xl cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingType(null);
                      resetForm();
                    }}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    {editingType ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


