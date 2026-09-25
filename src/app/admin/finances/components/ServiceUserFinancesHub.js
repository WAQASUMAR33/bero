'use client';

import { useState, useEffect } from 'react';
import ServiceUserLedgerModal from './ServiceUserLedgerModal';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '£0.00';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(val);
}

function formatDate(d) {
  if (!d) return '-';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return d || '-';
  }
}

export default function ServiceUserFinancesHub({ onNotification }) {
  const [year, setYear] = useState(2026);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ARREARS, BALANCED, IN_CREDIT
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    fetchUsers(year);
  }, [year]);

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
        if (onNotification) onNotification({ show: true, message: data.error || 'Failed to load service user finances.', type: 'error' });
      }
    } catch (err) {
      console.error('fetchUsers error:', err);
      if (onNotification) onNotification({ show: true, message: 'Failed to load service user finances.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.property && u.property.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.rentPaymentResponsibility && u.rentPaymentResponsibility.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.supportPaymentResponsibility && u.supportPaymentResponsibility.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || u.financialStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rent Outstanding */}
        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Total Rent Outstanding</p>
          <h3 className={`text-2xl font-bold mt-2 ${
            (stats?.totalRentOutstanding || 0) > 0 ? 'text-rose-600' : 'text-emerald-700'
          }`}>
            {formatCurrency(stats?.totalRentOutstanding || 0)}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">Carried forward + current year arrears</p>
        </div>

        {/* Total Utilities Outstanding */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider">Total Utilities Outstanding</p>
          <h3 className={`text-2xl font-bold mt-2 ${
            (stats?.totalUtilitiesOutstanding || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'
          }`}>
            {formatCurrency(stats?.totalUtilitiesOutstanding || 0)}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">Weekly service charge arrears</p>
        </div>

        {/* Total Support Outstanding */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <p className="text-xs font-semibold text-purple-900 uppercase tracking-wider">Total Support Outstanding</p>
          <h3 className={`text-2xl font-bold mt-2 ${
            (stats?.totalSupportOutstanding || 0) > 0 ? 'text-purple-700' : 'text-emerald-700'
          }`}>
            {formatCurrency(stats?.totalSupportOutstanding || 0)}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">Care package & 1:1 funding balances</p>
        </div>

        {/* Net Outstanding Balance */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-800 uppercase tracking-wider">Overall Balance</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              (stats?.netOutstandingBalance || 0) > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {stats?.arrearsCount || 0} in Arrears
            </span>
          </div>
          <h3 className={`text-2xl font-black mt-2 ${
            (stats?.netOutstandingBalance || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
          }`}>
            {formatCurrency(stats?.netOutstandingBalance || 0)}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">
            {stats?.totalUsers || 0} residents monitored ({stats?.balancedCount || 0} balanced)
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Controls Header */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-100 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-50 text-[#224fa6] rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-900">Service User Financial Ledgers ({year})</h3>
              <p className="text-xs text-gray-500">
                Individual resident rent, utilities, and care hours accounting
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search resident or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:outline-none w-52"
              />
              <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-gray-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses ({users.length})</option>
              <option value="ARREARS">In Arrears ({stats?.arrearsCount || 0})</option>
              <option value="BALANCED">Balanced ({stats?.balancedCount || 0})</option>
              <option value="IN_CREDIT">In Credit ({stats?.creditCount || 0})</option>
            </select>

            {/* Year Selector */}
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="text-xs bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-blue-900 font-bold focus:outline-none cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]"></div>
            <p className="mt-2 text-sm">Loading service user finances...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="font-semibold text-gray-700">No service users found matching criteria.</p>
            <p className="text-xs text-gray-400 mt-1">Adjust search filter or select another year.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Resident</th>
                  <th className="py-3 px-3">Property</th>
                  <th className="py-3 px-3">Rent Rate</th>
                  <th className="py-3 px-3">Utilities Rate</th>
                  <th className="py-3 px-3">Support Rate</th>
                  <th className="py-3 px-3 text-right">Rent Owing</th>
                  <th className="py-3 px-3 text-right">Utilities Owing</th>
                  <th className="py-3 px-3 text-right">Support Owing</th>
                  <th className="py-3 px-3 text-right">Net Balance</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedUserId(u.id)}
                  >
                    {/* Resident */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#224fa6] to-[#3270e9] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-[#224fa6] transition-colors">
                            {u.name}
                          </p>
                          <span className="text-[10px] text-gray-400">ID #{u.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Property */}
                    <td className="py-3 px-3 text-gray-700">
                      <p className="font-semibold text-gray-900">{u.property}</p>
                      <p className="text-[10px] text-gray-400">Moved: {formatDate(u.movedInDate)}</p>
                    </td>

                    {/* Rent Rate */}
                    <td className="py-3 px-3">
                      <p className="font-semibold text-gray-900">{formatCurrency(u.rentAmount)} / wk</p>
                      <p className="text-[10px] text-gray-500">{u.rentPaymentResponsibility}</p>
                    </td>

                    {/* Utilities Rate */}
                    <td className="py-3 px-3">
                      <p className="font-semibold text-gray-900">{formatCurrency(u.utilitiesPerWeek)} / wk</p>
                      <p className="text-[10px] text-gray-500">{u.utilitiesPaymentResponsibility}</p>
                    </td>

                    {/* Support Rate */}
                    <td className="py-3 px-3">
                      <p className="font-semibold text-gray-900">{u.supportHoursPerDay}h/day @ {formatCurrency(u.costPerHour)}</p>
                      <p className="text-[10px] text-gray-500">{u.supportPaymentResponsibility}</p>
                    </td>

                    {/* Rent Owing */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-blue-900">
                      {formatCurrency(u.rent.totalOwing)}
                    </td>

                    {/* Utilities Owing */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-amber-900">
                      {formatCurrency(u.utilities.totalOwing)}
                    </td>

                    {/* Support Owing */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-purple-900">
                      {formatCurrency(u.support.totalOwing)}
                    </td>

                    {/* Net Balance */}
                    <td className={`py-3 px-3 text-right font-mono font-bold text-sm ${
                      u.netTotalOwing > 0 ? 'text-rose-600' : u.netTotalOwing < 0 ? 'text-emerald-600' : 'text-gray-500'
                    }`}>
                      {formatCurrency(u.netTotalOwing)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.financialStatus === 'ARREARS'
                          ? 'bg-rose-100 text-rose-800'
                          : u.financialStatus === 'IN_CREDIT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.financialStatus === 'ARREARS' ? 'Arrears' : u.financialStatus === 'IN_CREDIT' ? 'In Credit' : 'Balanced'}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-center" onClick={(e) => { e.stopPropagation(); setSelectedUserId(u.id); }}>
                      <button
                        type="button"
                        className="px-3 py-1 bg-gradient-to-r from-[#224fa6] to-[#3270e9] hover:from-[#1a3d85] hover:to-[#2859c7] text-white rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
                      >
                        Open 52-Wk Ledger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 52-Week Ledger Modal */}
      {selectedUserId && (
        <ServiceUserLedgerModal
          serviceSeekerId={selectedUserId}
          onClose={() => {
            setSelectedUserId(null);
            fetchUsers(year); // refresh on close
          }}
          onNotification={onNotification}
        />
      )}
    </div>
  );
}
