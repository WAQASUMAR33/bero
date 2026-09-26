'use client';

import { useState, useEffect } from 'react';
import ServiceUserLedgerModal from './ServiceUserLedgerModal';
import { Search, Users, TrendingDown, TrendingUp, Minus } from 'lucide-react';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '£0.00';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(val);
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return d || '—'; }
}

function StatusBadge({ status }) {
  if (status === 'ARREARS') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />Arrears
    </span>
  );
  if (status === 'IN_CREDIT') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />In Credit
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />Balanced
    </span>
  );
}

export default function ServiceUserFinancesHub({ onNotification }) {
  const [year, setYear] = useState(2026);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => { fetchUsers(year); }, [year]);

  const fetchUsers = async (targetYear) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/finances/service-users?year=${targetYear}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.serviceUsers || []);
        setStats(data.stats);
      } else {
        if (onNotification) onNotification({ show: true, message: data.error || 'Failed to load finances.', type: 'error' });
      }
    } catch {
      if (onNotification) onNotification({ show: true, message: 'Failed to load finances.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      (u.property?.toLowerCase().includes(q)) ||
      (u.rentPaymentResponsibility?.toLowerCase().includes(q)) ||
      (u.supportPaymentResponsibility?.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'ALL' || u.financialStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Rent Outstanding', value: formatCurrency(stats?.totalRentOutstanding || 0), sub: 'C/F + current year', color: 'blue' },
          { label: 'Utilities Outstanding', value: formatCurrency(stats?.totalUtilitiesOutstanding || 0), sub: 'Weekly service charges', color: 'amber' },
          { label: 'Support Outstanding', value: formatCurrency(stats?.totalSupportOutstanding || 0), sub: 'Care package balances', color: 'purple' },
          { label: 'Overall Balance', value: formatCurrency(stats?.netOutstandingBalance || 0), sub: `${stats?.arrearsCount || 0} in arrears · ${stats?.balancedCount || 0} balanced`, color: 'gray' },
        ].map((card) => {
          const colorMap = {
            blue: 'border-blue-100 text-[#224fa6] bg-blue-50/40',
            amber: 'border-amber-100 text-amber-700 bg-amber-50/40',
            purple: 'border-purple-100 text-purple-700 bg-purple-50/40',
            gray: 'border-gray-200 text-gray-900 bg-gray-50/40',
          };
          return (
            <div key={card.label} className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm relative overflow-hidden ${colorMap[card.color].split(' ').slice(0,1).join(' ')}`}>
              <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full -mr-2 -mt-2 opacity-30 ${colorMap[card.color].split(' ').slice(2).join(' ')}`} />
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{card.label}</p>
              <p className={`text-lg sm:text-2xl font-black mt-1.5 ${(stats?.netOutstandingBalance || 0) > 0 && card.color === 'gray' ? 'text-rose-700' : colorMap[card.color].split(' ')[1]}`}>
                {card.value}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Main Table Card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-[#224fa6] rounded-lg shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 leading-tight">Service User Ledgers ({year})</h3>
              <p className="text-[11px] text-gray-500 hidden sm:block">Resident rent, utilities & care hour accounting</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search resident..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 pl-8 pr-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:outline-none"
              />
            </div>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All ({users.length})</option>
              <option value="ARREARS">Arrears ({stats?.arrearsCount || 0})</option>
              <option value="BALANCED">Balanced ({stats?.balancedCount || 0})</option>
              <option value="IN_CREDIT">Credit ({stats?.creditCount || 0})</option>
            </select>
            {/* Year */}
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 text-[#224fa6] font-bold focus:outline-none cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 sm:p-16 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]" />
            <p className="mt-3 text-sm">Loading service user finances...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-[#224fa6]" />
            </div>
            <p className="font-semibold text-gray-700">No service users found</p>
            <p className="text-xs text-gray-400 mt-1">Adjust search or filter to find residents.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse" style={{ minWidth: '900px' }}>
                <thead className="bg-slate-50 text-gray-600 font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Resident</th>
                    <th className="py-3 px-3">Property</th>
                    <th className="py-3 px-3">Rent Rate</th>
                    <th className="py-3 px-3">Utilities</th>
                    <th className="py-3 px-3">Support</th>
                    <th className="py-3 px-3 text-right">Rent Owing</th>
                    <th className="py-3 px-3 text-right">Utils Owing</th>
                    <th className="py-3 px-3 text-right">Support Owing</th>
                    <th className="py-3 px-3 text-right">Net Balance</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Ledger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                      onClick={() => setSelectedUserId(u.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#224fa6] to-[#3270e9] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-[#224fa6] transition-colors">{u.name}</p>
                            <span className="text-[10px] text-gray-400">ID #{u.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-gray-900">{u.property || '—'}</p>
                        <p className="text-[10px] text-gray-400">In: {formatDate(u.movedInDate)}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-gray-900">{formatCurrency(u.rentAmount)}/wk</p>
                        <p className="text-[10px] text-gray-500">{u.rentPaymentResponsibility}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-gray-900">{formatCurrency(u.utilitiesPerWeek)}/wk</p>
                        <p className="text-[10px] text-gray-500">{u.utilitiesPaymentResponsibility}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-gray-900">{u.supportHoursPerDay}h @ {formatCurrency(u.costPerHour)}</p>
                        <p className="text-[10px] text-gray-500">{u.supportPaymentResponsibility}</p>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-blue-900">{formatCurrency(u.rent.totalOwing)}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-amber-800">{formatCurrency(u.utilities.totalOwing)}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-purple-900">{formatCurrency(u.support.totalOwing)}</td>
                      <td className={`py-3 px-3 text-right font-mono font-bold text-sm ${u.netTotalOwing > 0 ? 'text-rose-600' : u.netTotalOwing < 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {formatCurrency(u.netTotalOwing)}
                      </td>
                      <td className="py-3 px-3 text-center"><StatusBadge status={u.financialStatus} /></td>
                      <td className="py-3 px-4 text-center" onClick={(e) => { e.stopPropagation(); setSelectedUserId(u.id); }}>
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-gradient-to-r from-[#224fa6] to-[#3270e9] hover:from-[#1a3d85] hover:to-[#2859c7] text-white rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                        >
                          Open Ledger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedUserId(u.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#224fa6] to-[#3270e9] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{u.name}</p>
                        <p className="text-[11px] text-gray-500">{u.property || 'No property'}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-base font-black font-mono ${u.netTotalOwing > 0 ? 'text-rose-600' : u.netTotalOwing < 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {formatCurrency(u.netTotalOwing)}
                      </p>
                      <StatusBadge status={u.financialStatus} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-blue-50 rounded-lg p-2">
                      <span className="text-blue-700 font-bold block">Rent</span>
                      <span className="font-mono font-semibold text-blue-900">{formatCurrency(u.rent.totalOwing)}</span>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2">
                      <span className="text-amber-700 font-bold block">Utilities</span>
                      <span className="font-mono font-semibold text-amber-900">{formatCurrency(u.utilities.totalOwing)}</span>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2">
                      <span className="text-purple-700 font-bold block">Support</span>
                      <span className="font-mono font-semibold text-purple-900">{formatCurrency(u.support.totalOwing)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-3 w-full py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Open 52-Week Ledger
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Ledger Modal */}
      {selectedUserId && (
        <ServiceUserLedgerModal
          serviceSeekerId={selectedUserId}
          onClose={() => { setSelectedUserId(null); fetchUsers(year); }}
          onNotification={onNotification}
        />
      )}
    </div>
  );
}
