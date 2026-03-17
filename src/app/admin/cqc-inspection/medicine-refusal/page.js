'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Notification from '../../components/Notification';

export default function MedicineRefusalPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceUsers, setServiceUsers] = useState([]);
  const [monthTotals, setMonthTotals] = useState({});
  const [grandTotal, setGrandTotal] = useState(0);
  const [grandRefused, setGrandRefused] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, year]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cqc-inspection/medicine-refusal?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setServiceUsers(result.data.serviceUsers);
        setMonthTotals(result.data.monthTotals);
        setGrandTotal(result.data.grandTotal);
        setGrandRefused(result.data.grandRefused);
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      showNotification('Error fetching data. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const refusalBadge = (refused) => {
    if (!refused) return null;
    const color = refused >= 10 ? 'bg-red-700' : refused >= 5 ? 'bg-red-500' : refused >= 3 ? 'bg-orange-500' : 'bg-yellow-500';
    return (
      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-semibold text-white ${color}`}>
        {refused}
      </span>
    );
  };

  if (!user) return null;

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
                  <h1 className="text-3xl font-bold text-gray-900">How do you ensure medicines are not being refused?</h1>
                </div>
                <p className="text-gray-600 ml-14">Medicine refusal tracking per service user by month</p>
              </div>
              <div className="flex items-center space-x-4">
                <label className="text-sm font-semibold text-gray-700">Year:</label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading medicine data...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Medicine Refusals by Service User ({serviceUsers.length})
                  </h3>
                  <div className="text-sm text-gray-600">
                    Total Refusals: <span className="font-semibold text-red-600">{grandRefused}</span>
                    <span className="mx-2 text-gray-400">|</span>
                    Total Administered: <span className="font-semibold text-green-600">{grandTotal - grandRefused}</span>
                    <span className="mx-2 text-gray-400">|</span>
                    Total Records: <span className="font-semibold">{grandTotal}</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                        Service User
                      </th>
                      {months.map(month => (
                        <th key={month} className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {month}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {serviceUsers.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="px-6 py-12 text-center text-gray-500">
                          No medicine records found for {year}.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {serviceUsers.map((su) => (
                          <tr key={su.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-5 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-100">
                              <div className="text-sm font-medium text-gray-900">{su.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {su.totalRefused} refusal{su.totalRefused !== 1 ? 's' : ''} / {su.totalTasks} total
                              </div>
                            </td>
                            {months.map((month) => {
                              const data = su.months[month];
                              return (
                                <td key={month} className="px-4 py-5 whitespace-nowrap text-center">
                                  {data ? (
                                    data.refused > 0 ? refusalBadge(data.refused) : (
                                      <span className="text-sm text-green-600 font-medium">✓</span>
                                    )
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-6 py-5 whitespace-nowrap text-right bg-gray-50">
                              {su.totalRefused > 0 ? (
                                <span className="text-sm font-semibold text-red-600">{su.totalRefused}</span>
                              ) : (
                                <span className="text-sm font-semibold text-green-600">0</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        <tr className="bg-gradient-to-r from-gray-100 to-gray-50 font-semibold border-t-2 border-gray-300">
                          <td className="px-6 py-5 whitespace-nowrap sticky left-0 bg-gray-100 z-10 border-r border-gray-200">
                            <span className="text-sm text-gray-900">Totals</span>
                          </td>
                          {months.map(month => (
                            <td key={month} className="px-4 py-5 whitespace-nowrap text-center">
                              <span className="text-sm text-gray-900">
                                {monthTotals[month] ? monthTotals[month].refused : '-'}
                              </span>
                            </td>
                          ))}
                          <td className="px-6 py-5 whitespace-nowrap text-right bg-gray-200">
                            <span className="text-sm font-bold text-red-600">{grandRefused}</span>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
            <span className="flex items-center space-x-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span><span>No refusals (✓)</span></span>
            <span className="flex items-center space-x-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span><span>1–2 refusals</span></span>
            <span className="flex items-center space-x-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span><span>3–4 refusals</span></span>
            <span className="flex items-center space-x-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span><span>5–9 refusals</span></span>
            <span className="flex items-center space-x-1"><span className="w-3 h-3 rounded-full bg-red-700 inline-block"></span><span>10+ refusals</span></span>
          </div>

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
