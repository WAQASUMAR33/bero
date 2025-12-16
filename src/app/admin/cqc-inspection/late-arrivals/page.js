'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Notification from '../../components/Notification';

export default function LateArrivalsPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [careWorkers, setCareWorkers] = useState([]);
  const [serviceUsers, setServiceUsers] = useState([]);
  const [serviceUserTotals, setServiceUserTotals] = useState({});
  const [grandTotal, setGrandTotal] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      // Set default date range to current year
      const currentYear = new Date().getFullYear();
      setStartDate(`${currentYear}-01-01`);
      setEndDate(`${currentYear}-12-31`);
      setYear(currentYear);
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (user && startDate && endDate) {
      fetchLateArrivals();
    }
  }, [user, startDate, endDate]);

  const fetchLateArrivals = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/cqc-inspection/late-arrivals?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const result = await response.json();
      
      if (result.success) {
        setCareWorkers(result.data.careWorkers);
        setServiceUsers(result.data.serviceUsers);
        setServiceUserTotals(result.data.serviceUserTotals);
        setGrandTotal(result.data.grandTotal);
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching late arrivals:', error);
      showNotification('Error fetching late arrivals. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = (newYear) => {
    setYear(newYear);
    setStartDate(`${newYear}-01-01`);
    setEndDate(`${newYear}-12-31`);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
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
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-4 mb-2">
                  <button
                    onClick={() => router.push('/admin/cqc-inspection')}
                    className="p-2 text-gray-600 hover:text-[#224fa6] hover:bg-gray-100 rounded-lg transition-all duration-200"
                    title="Back to CQC Inspection"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <h1 className="text-3xl font-bold text-gray-900">How do you monitor carers turning up late?</h1>
                </div>
                <p className="text-gray-600 ml-14">Track and monitor care workers who clock in late</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                <select
                  value={year}
                  onChange={(e) => handleYearChange(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                />
              </div>
              <div>
                <button
                  onClick={fetchLateArrivals}
                  className="w-full px-6 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading late arrivals data...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Performance Matrix ({careWorkers.length})
                  </h3>
                  <div className="text-sm text-gray-600">
                    Total Late Arrivals: <span className="font-semibold text-red-600">{grandTotal}</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                        Careworker
                      </th>
                      {serviceUsers.map(serviceUser => (
                        <th key={serviceUser.id} className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">
                          <div className="truncate max-w-[120px]" title={serviceUser.name}>
                            {serviceUser.name}
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {careWorkers.length === 0 ? (
                      <tr>
                        <td colSpan={serviceUsers.length + 2} className="px-6 py-12 text-center text-gray-500">
                          No late arrivals found for the selected date range.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {careWorkers.map((careWorker) => (
                          <tr key={careWorker.userId} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-5 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-100">
                              <div className="text-sm font-medium text-gray-900">
                                {careWorker.name}
                              </div>
                            </td>
                            {serviceUsers.map(serviceUser => {
                              const count = careWorker.serviceUsers[serviceUser.id] || 0;
                              
                              return (
                                <td key={serviceUser.id} className="px-4 py-5 whitespace-nowrap text-center">
                                  {count > 0 ? (
                                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity ${
                                      count >= 50 ? 'bg-blue-900' :
                                      count >= 30 ? 'bg-blue-800' :
                                      count >= 20 ? 'bg-blue-700' :
                                      count >= 10 ? 'bg-blue-600' :
                                      count >= 5 ? 'bg-blue-500' :
                                      'bg-blue-400'
                                    }`}>
                                      {count}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-6 py-5 whitespace-nowrap text-right bg-gray-50">
                              <span className="text-sm font-semibold text-gray-900">
                                {careWorker.total || 0}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        <tr className="bg-gradient-to-r from-gray-100 to-gray-50 font-semibold border-t-2 border-gray-300">
                          <td className="px-6 py-5 whitespace-nowrap sticky left-0 bg-gray-100 z-10 border-r border-gray-200">
                            <span className="text-sm text-gray-900">Totals</span>
                          </td>
                          {serviceUsers.map(serviceUser => (
                            <td key={serviceUser.id} className="px-4 py-5 whitespace-nowrap text-center">
                              <span className="text-sm text-gray-900">
                                {serviceUserTotals[serviceUser.id] || 0}
                              </span>
                            </td>
                          ))}
                          <td className="px-6 py-5 whitespace-nowrap text-right bg-gray-200">
                            <span className="text-sm font-bold text-gray-900">
                              {grandTotal}
                            </span>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Notification
            show={notification.show}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ show: false, message: '', type: 'success' })}
          />
        </main>
      </div>
    </div>
  );
}

