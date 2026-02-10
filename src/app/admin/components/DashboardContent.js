'use client';

import { useState, useEffect, useRef } from 'react';

export default function DashboardContent({ user }) {
  const [stats, setStats] = useState({
    unassignedShifts: 0,
    lateClockInsToday: 0,
    overdueTasks: 0,
    birthdays: 0,
    reviews: 0,
    rotaHours: 0,
    staff: 0,
    serviceUsers: 0
  });
  const [holidays, setHolidays] = useState([]);
  const [patients, setPatients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refs for optimization
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const intervalRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  const fetchDashboardData = async (isBackgroundRefresh = false) => {
    // Prevent duplicate requests
    if (isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;

      // Only show loading on initial load, not background refreshes
      if (isInitialLoadRef.current) {
        setIsLoading(true);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setIsLoading(false);
        isFetchingRef.current = false;
        return;
      }

      // Create abort controller for request cancellation
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Fetch all dashboard data in parallel with abort signal
      let statsRes, holidaysRes, serviceUsersRes, visitsRes;

      try {
        [statsRes, holidaysRes, serviceUsersRes, visitsRes] = await Promise.all([
          fetch('/api/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${token}` },
            signal
          }),
          fetch('/api/dashboard/holidays', {
            headers: { 'Authorization': `Bearer ${token}` },
            signal
          }),
          fetch('/api/dashboard/service-users', {
            headers: { 'Authorization': `Bearer ${token}` },
            signal
          }),
          fetch('/api/dashboard/visits', {
            headers: { 'Authorization': `Bearer ${token}` },
            signal
          })
        ]);
      } catch (error) {
        // Ignore abort errors (component unmounted)
        if (error.name === 'AbortError') {
          return;
        }
        console.error('Error fetching dashboard data:', error);
        if (isInitialLoadRef.current) {
          setIsLoading(false);
        }
        isFetchingRef.current = false;
        return;
      }

      // Parse JSON responses
      const [statsData, holidaysData, serviceUsersData, visitsData] = await Promise.all([
        statsRes.ok ? statsRes.json().catch(e => {
          console.error('Error parsing stats JSON:', e);
          return { success: false, error: 'Failed to parse response' };
        }) : { success: false, error: `HTTP ${statsRes.status}: ${statsRes.statusText}` },
        holidaysRes.ok ? holidaysRes.json().catch(e => {
          console.error('Error parsing holidays JSON:', e);
          return { success: false, error: 'Failed to parse response' };
        }) : { success: false, error: `HTTP ${holidaysRes.status}: ${holidaysRes.statusText}` },
        serviceUsersRes.ok ? serviceUsersRes.json().catch(e => {
          console.error('Error parsing service users JSON:', e);
          return { success: false, error: 'Failed to parse response' };
        }) : { success: false, error: `HTTP ${serviceUsersRes.status}: ${serviceUsersRes.statusText}` },
        visitsRes.ok ? visitsRes.json().catch(e => {
          console.error('Error parsing visits JSON:', e);
          return { success: false, error: 'Failed to parse response' };
        }) : { success: false, error: `HTTP ${visitsRes.status}: ${visitsRes.statusText}` }
      ]);

      // Only update state if component is still mounted and request wasn't aborted
      if (!signal.aborted) {
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }

        if (holidaysData.success && holidaysData.data) {
          setHolidays(holidaysData.data);
        }

        if (serviceUsersData.success && serviceUsersData.data) {
          setPatients(serviceUsersData.data);
        }

        if (visitsData.success && visitsData.data) {
          setVisits(visitsData.data);
        }

        isInitialLoadRef.current = false;
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching dashboard data:', error);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchDashboardData();

    // Handle page visibility - only refresh when tab is visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isFetchingRef.current) {
        // Refresh immediately when tab becomes visible
        fetchDashboardData(true);
      }
    };

    // Refresh data every 120 seconds (reduced frequency to save DB connections)
    // Only refresh if page is visible
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible' && !isFetchingRef.current) {
        fetchDashboardData(true);
      }
    }, 120000);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup: cancel in-flight requests and clear intervals
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const metrics = [
    {
      id: 1,
      title: 'Unassigned shifts',
      value: stats.unassignedShifts,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      ),
      color: 'text-blue-600'
    },
    {
      id: 2,
      title: 'No. of late clock ins today',
      value: stats.lateClockInsToday,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      color: 'text-orange-600'
    },
    {
      id: 3,
      title: 'Task overdue today',
      value: stats.overdueTasks,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ),
      color: 'text-red-600'
    },
    {
      id: 4,
      title: 'Birthdays',
      value: stats.birthdays,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-1.18-.681-2.538-.555-3.497z" clipRule="evenodd" />
        </svg>
      ),
      color: 'text-pink-600'
    },
    {
      id: 5,
      title: 'Reviews',
      value: stats.reviews,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
      color: 'text-yellow-600'
    },
    {
      id: 6,
      title: 'Rota\'d Hours this week',
      value: stats.rotaHours,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      color: 'text-green-600'
    },
    {
      id: 7,
      title: 'Staff',
      value: stats.staff,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      ),
      color: 'text-purple-600'
    },
    {
      id: 8,
      title: 'Service User',
      value: stats.serviceUsers,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      ),
      color: 'text-indigo-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm text-gray-600 mt-1">{metric.title}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gray-50 ${metric.color}`}>
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visits */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Visits</h3>
          <div className="space-y-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6] mx-auto"></div>
              </div>
            ) : visits.length > 0 ? (
              visits.map((visit) => (
                <div key={visit.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-[#224fa6]">{visit.date}</p>
                      <p className="text-xs text-gray-600">{visit.time}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${visit.type === 'Family Visit'
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-purple-100 text-purple-700'
                        }`}>
                        {visit.type}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{visit.visitorName}</p>
                    <p className="text-xs text-gray-600">{visit.serviceUserName}</p>
                    {visit.additionalInfo && (
                      <p className="text-xs text-gray-500 mt-1">{visit.additionalInfo}</p>
                    )}
                    {visit.purpose && (
                      <p className="text-xs text-gray-600 mt-1">{visit.purpose}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No visits found</p>
            )}
          </div>
        </div>

        {/* Holidays */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Holidays</h3>
          <div className="space-y-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6] mx-auto"></div>
              </div>
            ) : holidays.length > 0 ? (
              holidays.map((holiday) => (
                <div key={holiday.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-[#224fa6]">{holiday.date}</p>
                      {holiday.time && (
                        <p className="text-xs text-gray-600">{holiday.time}</p>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${holiday.statusColor}`}>
                        {holiday.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{holiday.userName}</p>
                    <p className="text-xs text-gray-600">{holiday.holidayType}</p>
                    {holiday.description && (
                      <p className="text-xs text-gray-600 mt-1">{holiday.description}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No holiday requests found</p>
            )}
          </div>
        </div>
      </div>

      {/* Data Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Data */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Service Users</h3>
          <div className="overflow-x-auto overflow-y-auto flex-1" style={{ maxHeight: '400px' }}>
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-medium text-gray-900">Service User</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-900">Date In</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6] mx-auto"></div>
                    </td>
                  </tr>
                ) : patients.length > 0 ? (
                  patients.map((patient, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{patient.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-600">{patient.dateIn}</td>
                      <td className="py-4">
                        <span className={`text-sm font-medium ${patient.statusColor}`}>
                          {patient.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-sm text-gray-500">
                      No service users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Patient Satisfaction */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Patient Satisfaction</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Donut Chart Representation */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeDasharray={`${60 * 2 * Math.PI} ${100 * 2 * Math.PI}`}
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  strokeDasharray={`${25 * 2 * Math.PI} ${100 * 2 * Math.PI}`}
                  strokeDashoffset={`-${60 * 2 * Math.PI}`}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={`${15 * 2 * Math.PI} ${100 * 2 * Math.PI}`}
                  strokeDashoffset={`-${85 * 2 * Math.PI}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-500">Total</span>
                <span className="text-2xl font-bold text-[#224fa6]">45,251</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Excellent</span>
              </div>
              <span className="text-sm font-medium text-gray-900">60%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Good</span>
              </div>
              <span className="text-sm font-medium text-gray-900">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Poor</span>
              </div>
              <span className="text-sm font-medium text-gray-900">15%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
