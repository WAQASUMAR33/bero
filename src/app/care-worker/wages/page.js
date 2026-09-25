'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StaffWageSheetView from '@/app/admin/wages/components/StaffWageSheetView';
import { DollarSign, Clock, Calendar, RefreshCw } from 'lucide-react';

export default function CareWorkerWagesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [wageSheet, setWageSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('ALL');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      router.push('/care-worker-login');
    }
  }, [router]);

  const fetchMyWages = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      let url = `/api/wages?year=${year}`;
      if (month && month !== 'ALL') url += `&month=${month}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.wageSheets && data.wageSheets.length > 0) {
        setWageSheet(data.wageSheets[0]);
      } else {
        setWageSheet(null);
      }
    } catch (err) {
      console.error('Error fetching my wages:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchMyWages();
  }, [fetchMyWages]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#173a7a] via-[#224fa6] to-[#3270e9] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white/10 rounded-xl backdrop-blur-md text-xl">💷</span>
              <h1 className="text-2xl font-bold tracking-tight">My Wages & Timesheet</h1>
            </div>
            <p className="text-blue-100 text-xs sm:text-sm max-w-2xl">
              View your clocked hours, pay rates, standby allowances, and wage breakdowns. To request corrections or amendments, click "Request Amendment".
            </p>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 bg-white/15 border border-white/20 rounded-xl text-xs font-semibold text-white backdrop-blur-md focus:bg-white focus:text-gray-900"
            >
              <option value="ALL" className="text-gray-900">All Months (Year {year})</option>
              <option value="1" className="text-gray-900">January</option>
              <option value="2" className="text-gray-900">February</option>
              <option value="3" className="text-gray-900">March</option>
              <option value="4" className="text-gray-900">April</option>
              <option value="5" className="text-gray-900">May</option>
              <option value="6" className="text-gray-900">June</option>
              <option value="7" className="text-gray-900">July</option>
              <option value="8" className="text-gray-900">August</option>
              <option value="9" className="text-gray-900">September</option>
              <option value="10" className="text-gray-900">October</option>
              <option value="11" className="text-gray-900">November</option>
              <option value="12" className="text-gray-900">December</option>
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 bg-white/15 border border-white/20 rounded-xl text-xs font-semibold text-white backdrop-blur-md focus:bg-white focus:text-gray-900"
            >
              <option value="2025" className="text-gray-900">2025</option>
              <option value="2026" className="text-gray-900">2026</option>
              <option value="2027" className="text-gray-900">2027</option>
            </select>

            <button
              onClick={fetchMyWages}
              className="p-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-white transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs">
          <div className="w-8 h-8 border-3 border-[#224fa6] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-gray-500">Loading your wage sheet & timesheet...</p>
        </div>
      ) : wageSheet ? (
        <StaffWageSheetView
          wageSheet={wageSheet}
          isManager={false}
          onDataChanged={fetchMyWages}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#224fa6] flex items-center justify-center mx-auto text-xl">
            💷
          </div>
          <h3 className="font-bold text-gray-900 text-base">No Wage Records Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No clock-in records or wage data found for your account in the selected time period.
          </p>
        </div>
      )}
    </div>
  );
}
