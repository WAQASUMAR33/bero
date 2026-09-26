'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, BarChart2 } from 'lucide-react';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '£0';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
}

function formatCurrencyFull(val) {
  if (val === undefined || val === null || isNaN(val)) return '£0.00';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(val);
}

export default function FinanceAnalyticsView({ onNotification }) {
  const [year, setYear] = useState(2026);
  const [pnlData, setPnlData] = useState(null);
  const [suData, setSuData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(year); }, [year]);

  const fetchAnalytics = async (targetYear) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [pnlRes, suRes] = await Promise.all([
        fetch(`/api/finances/pnl?year=${targetYear}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/finances/service-users?year=${targetYear}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const pnlJson = await pnlRes.json();
      const suJson = await suRes.json();
      if (pnlJson.success) setPnlData(pnlJson);
      if (suJson.success) setSuData(suJson);
    } catch {
      if (onNotification) onNotification({ show: true, message: 'Failed to load analytics.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const records = pnlData?.records || [];
  const maxRevenue = Math.max(...records.map(r => Math.max(r.totalIncoming || 0, r.totalOutgoings || 0, 1000)));

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#224fa6] rounded-lg shrink-0">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Financial Performance & Analytics</h2>
            <p className="text-xs text-gray-500">Revenue, cost distributions, and resident arrears intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Year:</span>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="text-sm font-bold text-[#224fa6] bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]" />
          <p className="mt-3 text-sm">Computing financial analytics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* ── Monthly Bar Chart ── */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Monthly Revenue vs Outgoings</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Incoming vs Operating Costs across 12 months</p>
              </div>
              <div className="flex items-center gap-3 text-xs shrink-0">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />In
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-rose-700">
                  <span className="w-2.5 h-2.5 bg-rose-400 rounded-sm" />Out
                </span>
              </div>
            </div>

            {records.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data available for {year}</div>
            ) : (
              <div className="h-56 sm:h-64 flex items-end justify-between gap-1 pt-2">
                {records.map((r) => {
                  const inH = maxRevenue > 0 ? (r.totalIncoming / maxRevenue) * 100 : 0;
                  const outH = maxRevenue > 0 ? (r.totalOutgoings / maxRevenue) * 100 : 0;
                  return (
                    <div key={r.id} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-0.5 h-full max-h-44 sm:max-h-52">
                        <div
                          style={{ height: `${Math.max(inH, 2)}%` }}
                          className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all cursor-pointer"
                          title={`${r.monthName} In: ${formatCurrencyFull(r.totalIncoming)}`}
                        />
                        <div
                          style={{ height: `${Math.max(outH, 2)}%` }}
                          className="w-1/2 bg-rose-400 hover:bg-rose-500 rounded-t transition-all cursor-pointer"
                          title={`${r.monthName} Out: ${formatCurrencyFull(r.totalOutgoings)}`}
                        />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-gray-500 mt-1">
                        {r.monthName.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Resident Arrears Panel ── */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h4 className="text-sm font-bold text-gray-900">Resident Financial Position</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Distribution by collection health status</p>
            </div>

            {/* Status pills */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 sm:p-4 text-center">
                <span className="text-xl sm:text-2xl font-black text-rose-700">{suData?.stats?.arrearsCount || 0}</span>
                <span className="text-[11px] font-bold text-rose-800 block mt-0.5">In Arrears</span>
                <span className="text-[10px] text-rose-500 hidden sm:block mt-1">Payment plan needed</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 text-center">
                <span className="text-xl sm:text-2xl font-black text-[#224fa6]">{suData?.stats?.balancedCount || 0}</span>
                <span className="text-[11px] font-bold text-blue-800 block mt-0.5">Balanced</span>
                <span className="text-[10px] text-blue-500 hidden sm:block mt-1">Zero balance</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 text-center">
                <span className="text-xl sm:text-2xl font-black text-emerald-700">{suData?.stats?.creditCount || 0}</span>
                <span className="text-[11px] font-bold text-emerald-800 block mt-0.5">In Credit</span>
                <span className="text-[10px] text-emerald-500 hidden sm:block mt-1">Overpaid</span>
              </div>
            </div>

            {/* Arrears breakdown */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200 space-y-2.5">
              <h6 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Arrears Breakdown</h6>
              {[
                { label: 'Rent Arrears', value: suData?.stats?.totalRentOutstanding || 0, color: 'text-blue-900' },
                { label: 'Utilities / Service Charges', value: suData?.stats?.totalUtilitiesOutstanding || 0, color: 'text-amber-800' },
                { label: 'Support & Funding', value: suData?.stats?.totalSupportOutstanding || 0, color: 'text-purple-900' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{row.label}</span>
                  <span className={`font-bold font-mono ${row.color}`}>{formatCurrencyFull(row.value)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs font-bold">
                <span className="text-gray-900">Total Outstanding</span>
                <span className="font-mono text-rose-700">{formatCurrencyFull(suData?.stats?.netOutstandingBalance || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
