'use client';

import { useState, useEffect } from 'react';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '£0.00';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export default function FinanceAnalyticsView({ onNotification }) {
  const [year, setYear] = useState(2026);
  const [pnlData, setPnlData] = useState(null);
  const [suData, setSuData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics(year);
  }, [year]);

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
    } catch (err) {
      console.error('fetchAnalytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const records = pnlData?.records || [];
  const maxRevenue = Math.max(...records.map(r => Math.max(r.totalIncoming || 0, r.totalOutgoings || 0, 1000)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Financial Performance & Analytics</h2>
          <p className="text-xs text-gray-500">Revenue, cost distributions, and resident arrears intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600">Year:</span>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="text-sm font-bold text-blue-900 bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]"></div>
          <p className="mt-2 text-sm">Computing financial analytics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Comparison Bar Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Monthly Revenue vs Outgoings</h4>
                <p className="text-[11px] text-gray-500">Incoming Fees vs Operating Costs across 12 months</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Incoming
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-rose-700">
                  <span className="w-3 h-3 bg-rose-500 rounded-sm"></span> Outgoings
                </span>
              </div>
            </div>

            <div className="h-64 flex items-end justify-between gap-1.5 pt-4">
              {records.map((r) => {
                const incomingHeight = maxRevenue > 0 ? (r.totalIncoming / maxRevenue) * 100 : 0;
                const outgoingsHeight = maxRevenue > 0 ? (r.totalOutgoings / maxRevenue) * 100 : 0;
                const monthShort = r.monthName.slice(0, 3);

                return (
                  <div key={r.id} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-0.5 h-48">
                      {/* Incoming bar */}
                      <div
                        style={{ height: `${Math.max(incomingHeight, 2)}%` }}
                        className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all relative group/bar"
                        title={`${r.monthName} Incoming: ${formatCurrency(r.totalIncoming)}`}
                      ></div>
                      {/* Outgoings bar */}
                      <div
                        style={{ height: `${Math.max(outgoingsHeight, 2)}%` }}
                        className="w-1/2 bg-rose-400 hover:bg-rose-500 rounded-t transition-all relative group/bar"
                        title={`${r.monthName} Outgoings: ${formatCurrency(r.totalOutgoings)}`}
                      ></div>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-600 mt-1">{monthShort}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Service User Arrears Risk & Payment Responsibilities */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h4 className="text-sm font-bold text-gray-900">Resident Financial Position & Arrears</h4>
              <p className="text-[11px] text-gray-500">Distribution of residents by collection health</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
                <span className="text-2xl font-black text-rose-700">{suData?.stats?.arrearsCount || 0}</span>
                <span className="text-xs font-semibold text-rose-900 block mt-0.5">In Arrears</span>
                <span className="text-[10px] text-rose-600 block mt-1">Requires Payment Plan</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <span className="text-2xl font-black text-[#224fa6]">{suData?.stats?.balancedCount || 0}</span>
                <span className="text-xs font-semibold text-blue-900 block mt-0.5">Balanced</span>
                <span className="text-[10px] text-blue-600 block mt-1">Zero Balance</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <span className="text-2xl font-black text-emerald-700">{suData?.stats?.creditCount || 0}</span>
                <span className="text-xs font-semibold text-emerald-900 block mt-0.5">In Credit</span>
                <span className="text-[10px] text-emerald-600 block mt-1">Overpaid Account</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
              <h6 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Arrears Breakdown</h6>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Rent Arrears:</span>
                <span className="font-bold text-blue-900 font-mono">{formatCurrency(suData?.stats?.totalRentOutstanding || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Utilities / Service Charges:</span>
                <span className="font-bold text-amber-900 font-mono">{formatCurrency(suData?.stats?.totalUtilitiesOutstanding || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Support Hours & Funding:</span>
                <span className="font-bold text-purple-900 font-mono">{formatCurrency(suData?.stats?.totalSupportOutstanding || 0)}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs font-bold">
                <span className="text-gray-900">Total Outstanding:</span>
                <span className="font-mono text-rose-700">{formatCurrency(suData?.stats?.netOutstandingBalance || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
