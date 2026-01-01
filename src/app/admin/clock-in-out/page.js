'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';
import LocationMap from '../service-users/components/LocationMap';

export default function ClockInOutPage() {
  const [user, setUser] = useState(null);
  const [clockInOuts, setClockInOuts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterWorkType, setFilterWorkType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, late, early, on-time
  const [filterUserId, setFilterUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const router = useRouter();

  const notificationTimeoutRef = useRef(null);

  const showNotification = (message, type = 'success') => {
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ show: true, message, type });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
      notificationTimeoutRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchUsers();
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const abortController = new AbortController();
    fetchClockInOuts(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [filterDate, filterWorkType, filterStatus, filterUserId, user]);

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
      if (error.name !== 'AbortError') {
        console.error('Error fetching users:', error);
      }
    }
  };

  const fetchClockInOuts = async (signal) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      let url = '/api/clock-in-out?view=all';
      
      if (filterDate) {
        url += `&date=${filterDate}`;
      }
      if (filterWorkType !== 'all') {
        url += `&workType=${filterWorkType}`;
      }
      if (filterStatus === 'late') {
        url += `&isLate=true`;
      } else if (filterStatus === 'early') {
        url += `&isEarly=true`;
      }
      if (filterUserId) {
        url += `&userId=${filterUserId}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      });
      const result = await response.json();
      
      if (!signal?.aborted) {
        if (result.success) {
          setClockInOuts(result.data);
        } else {
          console.error('Error fetching clock in/out records:', result.error);
          setClockInOuts([]);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError' && !signal?.aborted) {
        console.error('Error fetching clock in/out records:', error);
        setClockInOuts([]);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  const filteredRecords = clockInOuts.filter(record => {
    const matchesSearch = 
      record.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.serviceSeeker?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.serviceSeeker?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.serviceSeeker?.preferredName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getDayName = (date) => {
    return new Date(date).toLocaleDateString('en-GB', { weekday: 'short' });
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return '-';
    return new Date(dateTime).toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getServiceUserDisplay = (record) => {
    if (record.serviceSeeker) {
      return record.serviceSeeker.preferredName || 
             `${record.serviceSeeker.firstName} ${record.serviceSeeker.lastName}`;
    }
    if (record.shiftAssignment?.shift?.serviceSeeker) {
      const ss = record.shiftAssignment.shift.serviceSeeker;
      return ss.preferredName || `${ss.firstName} ${ss.lastName}`;
    }
    return '-';
  };

  const calculateDuration = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '-';
    const diff = new Date(clockOut) - new Date(clockIn);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const parseLocation = (locationString) => {
    if (!locationString) return null;
    const parts = locationString.split(',');
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  };

  const handleLocationClick = (record) => {
    // Try clock-in location first, then clock-out location
    const location = parseLocation(record.clockInLocation) || parseLocation(record.clockOutLocation);
    if (location) {
      setSelectedLocation(location);
      setShowMapModal(true);
    }
  };

  const formatLocationDisplay = (record) => {
    const location = parseLocation(record.clockInLocation) || parseLocation(record.clockOutLocation);
    if (location) {
      return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    }
    return '-';
  };

  // Calculate stats
  const stats = {
    total: clockInOuts.length,
    late: clockInOuts.filter(r => r.isLate).length,
    early: clockInOuts.filter(r => r.isEarly).length,
    standby: clockInOuts.filter(r => r.workType === 'STANDBY').length,
    today: clockInOuts.filter(r => {
      const today = new Date().toISOString().split('T')[0];
      const recordDate = new Date(r.date).toISOString().split('T')[0];
      return recordDate === today;
    }).length
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
                <p className="text-gray-600">Loading clock in/out records...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Clock In/Out Management</h1>
                    <p className="text-gray-600">View and monitor care worker attendance</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Records</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Late Clock Ins</p>
                      <p className="text-2xl font-bold text-red-600">{stats.late}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Early Clock Outs</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.early}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Standby Work</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.standby}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Today</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                    />
                  </div>
                  <div>
                    <select
                      value={filterWorkType}
                      onChange={(e) => setFilterWorkType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                    >
                      <option value="all">All Work Types</option>
                      <option value="REGULAR">Regular</option>
                      <option value="STANDBY">Standby</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                    >
                      <option value="all">All Status</option>
                      <option value="late">Late Clock Ins</option>
                      <option value="early">Early Clock Outs</option>
                      <option value="on-time">On Time</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <select
                    value={filterUserId}
                    onChange={(e) => setFilterUserId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
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

              {/* Clock In/Out Table */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Day</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">In</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Out</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service User</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Work Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                            No clock in/out records found
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">
                                {getDayName(record.date)}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                    <span className="text-white font-semibold text-xs">
                                      {record.user?.firstName?.[0]}{record.user?.lastName?.[0]}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {record.user?.firstName} {record.user?.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">{record.user?.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`text-sm font-medium ${record.isLate ? 'text-red-600' : 'text-gray-900'}`}>
                                  {formatTime(record.clockInTime)}
                                </div>
                                {record.isLate && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    Late
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`text-sm font-medium ${record.isEarly ? 'text-orange-600' : 'text-gray-900'}`}>
                                  {formatTime(record.clockOutTime)}
                                </div>
                                {record.isEarly && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                    Early
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {calculateDuration(record.clockInTime, record.clockOutTime)}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {getServiceUserDisplay(record)}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(record.date)}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                record.workType === 'STANDBY' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {record.workType}
                              </span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              {formatLocationDisplay(record) !== '-' ? (
                                <button
                                  onClick={() => handleLocationClick(record)}
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {formatLocationDisplay(record)}
                                </button>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                {record.isLate && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    Late In
                                  </span>
                                )}
                                {record.isEarly && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                    Early Out
                                  </span>
                                )}
                                {!record.isLate && !record.isEarly && record.clockInTime && record.clockOutTime && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    On Time
                                  </span>
                                )}
                                {!record.clockOutTime && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Active
                                  </span>
                                )}
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

          {/* Notification */}
          {notification.show && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification({ show: false, message: '', type: 'success' })}
            />
          )}

          {/* Map Modal */}
          {showMapModal && selectedLocation && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Location on Map</h2>
                  <button
                    onClick={() => {
                      setShowMapModal(false);
                      setSelectedLocation(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 p-6 overflow-auto">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Coordinates:</span> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </p>
                  </div>
                  <LocationMap
                    latitude={selectedLocation.lat}
                    longitude={selectedLocation.lng}
                    readOnly={true}
                    className="w-full h-96 rounded-lg border-2 border-gray-200"
                  />
                  <div className="mt-4 flex justify-end">
                    <a
                      href={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

