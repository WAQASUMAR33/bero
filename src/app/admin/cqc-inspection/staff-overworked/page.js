'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Notification from '../../components/Notification';

export default function StaffOverworkedPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffData, setStaffData] = useState([]);
  const [monthTotals, setMonthTotals] = useState({});
  const [grandTotal, setGrandTotal] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdownData, setBreakdownData] = useState(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchStaffHours();
    } else {
      router.push('/login');
    }
  }, [router, year]);

  const fetchStaffHours = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cqc-inspection/staff-hours?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setStaffData(result.data.staff);
        setMonthTotals(result.data.monthTotals);
        setGrandTotal(result.data.grandTotal);
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching staff hours:', error);
      showNotification('Error fetching staff hours. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBreakdown = async (userId, monthIndex) => {
    try {
      setBreakdownLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/cqc-inspection/staff-hours/breakdown?userId=${userId}&month=${monthIndex}&year=${year}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const result = await response.json();
      
      if (result.success) {
        setBreakdownData(result.data);
        setShowBreakdown(true);
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching breakdown:', error);
      showNotification('Error fetching breakdown. Please try again.', 'error');
    } finally {
      setBreakdownLoading(false);
    }
  };

  const handleHoursClick = (userId, monthIndex) => {
    fetchBreakdown(userId, monthIndex);
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
                  <h1 className="text-3xl font-bold text-gray-900">Are Staff Overworked?</h1>
                </div>
                <p className="text-gray-600 ml-14">Monitor staff workload and working hours by month</p>
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
                <p className="text-gray-600">Loading staff hours...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Staff Hours by Month ({staffData.length})
                  </h3>
                  <div className="text-sm text-gray-600">
                    Click on hours to view detailed breakdown
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                        Staff
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
                    {staffData.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="px-6 py-12 text-center text-gray-500">
                          No staff data available.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {staffData.map((staff) => (
                          <tr key={staff.userId} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-5 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-100">
                              <div className="text-sm font-medium text-gray-900">
                                {staff.staffName}
                              </div>
                            </td>
                            {months.map((month, index) => {
                              const hours = staff.months[month] || 0;
                              return (
                                <td key={month} className="px-4 py-5 whitespace-nowrap text-center">
                                  {hours > 0 ? (
                                    <button
                                      onClick={() => handleHoursClick(staff.userId, index)}
                                      className="text-sm text-[#224fa6] hover:text-[#3270e9] underline cursor-pointer hover:font-semibold transition-all duration-200"
                                    >
                                      {hours.toFixed(2)}
                                    </button>
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-6 py-5 whitespace-nowrap text-right bg-gray-50">
                              <span className="text-sm font-semibold text-gray-900">
                                {staff.total.toFixed(2)}
                              </span>
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
                                {monthTotals[month] ? monthTotals[month].toFixed(2) : '0.00'}
                              </span>
                            </td>
                          ))}
                          <td className="px-6 py-5 whitespace-nowrap text-right bg-gray-200">
                            <span className="text-sm font-bold text-gray-900">
                              {grandTotal.toFixed(2)}
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

          {/* Breakdown Modal */}
          {showBreakdown && breakdownData && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">
                      {breakdownData.staffName}&apos;s {breakdownData.month} {breakdownData.year} Breakdown
                    </h3>
                    <p className="text-sm text-white/90 mt-1">
                      Detailed shift breakdown for the selected month
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowBreakdown(false);
                      setBreakdownData(null);
                    }}
                    className="p-2 text-white hover:text-gray-200 hover:bg-white/20 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-8">
                  {breakdownLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading breakdown...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Shift
                              </th>
                              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Hours
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {breakdownData.breakdown.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                  No shifts found for this month.
                                </td>
                              </tr>
                            ) : (
                              <>
                                {breakdownData.breakdown.map((item, index) => (
                                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {item.displayDate}
                                      </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {item.shift}
                                      </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-right">
                                      <div className="text-sm font-medium text-gray-900">
                                        {item.hours.toFixed(2)}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-gray-50 font-semibold">
                                  <td colSpan={2} className="px-6 py-5 whitespace-nowrap">
                                    <span className="text-sm text-gray-900">Totals</span>
                                  </td>
                                  <td className="px-6 py-5 whitespace-nowrap text-right">
                                    <span className="text-sm text-gray-900">
                                      {breakdownData.totalHours.toFixed(2)}
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
                </div>

                {/* Modal Footer */}
                <div className="border-t border-gray-200 px-8 py-6 flex justify-end">
                  <button
                    onClick={() => {
                      setShowBreakdown(false);
                      setBreakdownData(null);
                    }}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Close
                  </button>
                </div>
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

