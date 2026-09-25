'use client';

import { useState, useEffect } from 'react';

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

export default function ServiceUserLedgerModal({ serviceSeekerId, onClose, onNotification }) {
  const [year, setYear] = useState(2026);
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState({});
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMonthFilter, setActiveMonthFilter] = useState('ALL');
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    if (serviceSeekerId) {
      fetchLedger(year);
    }
  }, [serviceSeekerId, year]);

  const fetchLedger = async (targetYear) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/finances/service-users/${serviceSeekerId}?year=${targetYear}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
        setProfile(json.profile || {});
        setWeeks(json.weeks || []);
      } else {
        if (onNotification) onNotification({ show: true, message: json.error || 'Failed to load ledger.', type: 'error' });
      }
    } catch (err) {
      console.error('fetchLedger error:', err);
      if (onNotification) onNotification({ show: true, message: 'Failed to load ledger.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleWeekChange = (idx, field, value) => {
    const numeric = parseFloat(value) || 0;
    setWeeks((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: numeric };
      return copy;
    });
  };

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Live dynamic totals calculation
  const computedTotals = weeks.reduce(
    (acc, w) => {
      acc.supportDue += parseFloat(w.supportDue) || 0;
      acc.supportPaid += parseFloat(w.supportPaid) || 0;
      acc.utilitiesDue += parseFloat(w.utilitiesDue) || 0;
      acc.utilitiesPaid += parseFloat(w.utilitiesPaid) || 0;
      acc.rentDue += parseFloat(w.rentDue) || 0;
      acc.rentPaid += parseFloat(w.rentPaid) || 0;
      return acc;
    },
    { supportDue: 0, supportPaid: 0, utilitiesDue: 0, utilitiesPaid: 0, rentDue: 0, rentPaid: 0 }
  );

  // Live calculation of summary cards matching Service User Finances.xlsx
  const rentCurrentYear = computedTotals.rentDue - computedTotals.rentPaid;
  const rentCarriedForward = parseFloat(profile.rentCarriedForward) || 0;
  const totalRentOwing = rentCarriedForward + rentCurrentYear;

  const utilitiesCurrentYear = computedTotals.utilitiesDue - computedTotals.utilitiesPaid;
  const utilitiesCarriedForward = parseFloat(profile.utilitiesCarriedForward) || 0;
  const totalUtilitiesOwing = utilitiesCarriedForward + utilitiesCurrentYear;

  const supportCurrentYear = computedTotals.supportDue - computedTotals.supportPaid;
  const supportCarriedForward = parseFloat(profile.supportCarriedForward) || 0;
  const totalSupportOwing = supportCarriedForward + supportCurrentYear;

  const grandTotalOwing = totalRentOwing + totalUtilitiesOwing + totalSupportOwing;

  const saveAll = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/finances/service-users/${serviceSeekerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          year,
          profile,
          weeks,
        }),
      });
      const json = await res.json();
      if (json.success) {
        if (onNotification) onNotification({ show: true, message: 'Finances & Ledger saved successfully.', type: 'success' });
        setEditingProfile(false);
        await fetchLedger(year);
      } else {
        if (onNotification) onNotification({ show: true, message: json.error || 'Failed to save finances.', type: 'error' });
      }
    } catch (err) {
      console.error('saveAll error:', err);
      if (onNotification) onNotification({ show: true, message: 'Failed to save finances.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const applyDefaultWeeklyRatesToLedger = () => {
    if (!confirm('This will populate empty weeks with the current profile weekly rates (Support, Utilities, Rent). Continue?')) return;
    const defaultSupport = profile.costPerWeek || (profile.supportHoursPerDay && profile.costPerHour ? profile.supportHoursPerDay * profile.costPerHour * 7 : 0);
    const defaultUtilities = profile.utilitiesPerWeek || 0;
    const defaultRent = profile.rentAmount || 0;

    setWeeks((prev) =>
      prev.map((w) => ({
        ...w,
        supportDue: w.supportDue === 0 ? defaultSupport : w.supportDue,
        utilitiesDue: w.utilitiesDue === 0 ? defaultUtilities : w.utilitiesDue,
        rentDue: w.rentDue === 0 ? defaultRent : w.rentDue,
      }))
    );
  };

  const filteredWeeks = activeMonthFilter === 'ALL'
    ? weeks
    : weeks.filter(w => w.monthName === activeMonthFilter);

  const months = [
    'ALL', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] overflow-hidden flex flex-col animate-in fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#224fa6] via-[#2a59be] to-[#3270e9] text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/10 rounded-xl text-xl">💳</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">
                  {data?.serviceSeeker?.name || 'Service User'} — Financial Accounting Ledger
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  grandTotalOwing > 0 ? 'bg-rose-100 text-rose-800' : grandTotalOwing < 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-900'
                }`}>
                  {grandTotalOwing > 0 ? 'Arrears' : grandTotalOwing < 0 ? 'Credit Balance' : 'Balanced'}
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Weekly Ledger & Account Breakdown matching Service User Finances tracker ({year})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Year Selector */}
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="bg-white/10 border border-white/20 text-white rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value={2026} className="text-gray-900">2026</option>
              <option value={2027} className="text-gray-900">2027</option>
            </select>

            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none transition-colors cursor-pointer px-2"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-gray-50/50">
          {loading ? (
            <div className="p-16 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]"></div>
              <p className="mt-2 text-sm">Loading 52-week ledger for {data?.serviceSeeker?.name || 'resident'}...</p>
            </div>
          ) : (
            <>
              {/* Top Section: Resident Header & Owing Summary Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Resident Financial Configuration (8 cols) */}
                <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                      <span>📋</span> Agreement & Payment Responsibilities
                    </h5>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(!editingProfile)}
                      className="text-xs font-semibold text-[#224fa6] hover:underline cursor-pointer"
                    >
                      {editingProfile ? 'Close Editor' : 'Edit Agreement Details'}
                    </button>
                  </div>

                  {editingProfile ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Property / Unit</label>
                        <input
                          type="text"
                          value={profile.property || ''}
                          onChange={(e) => handleProfileChange('property', e.target.value)}
                          className="w-full border rounded px-2 py-1"
                          placeholder="e.g. 14 Maple House"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Moved In Date</label>
                        <input
                          type="date"
                          value={profile.movedInDate ? new Date(profile.movedInDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleProfileChange('movedInDate', e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Rent (£/wk)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={profile.rentAmount || ''}
                          onChange={(e) => handleProfileChange('rentAmount', e.target.value)}
                          className="w-full border rounded px-2 py-1 font-mono"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Rent Payment Resp.</label>
                        <input
                          type="text"
                          value={profile.rentPaymentResponsibility || ''}
                          onChange={(e) => handleProfileChange('rentPaymentResponsibility', e.target.value)}
                          className="w-full border rounded px-2 py-1"
                          placeholder="e.g. Housing Benefit"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Utilities per week (£)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={profile.utilitiesPerWeek || ''}
                          onChange={(e) => handleProfileChange('utilitiesPerWeek', e.target.value)}
                          className="w-full border rounded px-2 py-1 font-mono"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Utilities Payment Resp.</label>
                        <input
                          type="text"
                          value={profile.utilitiesPaymentResponsibility || ''}
                          onChange={(e) => handleProfileChange('utilitiesPaymentResponsibility', e.target.value)}
                          className="w-full border rounded px-2 py-1"
                          placeholder="e.g. Service User"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Support Hours / Day</label>
                        <input
                          type="number"
                          step="0.5"
                          value={profile.supportHoursPerDay || ''}
                          onChange={(e) => handleProfileChange('supportHoursPerDay', e.target.value)}
                          className="w-full border rounded px-2 py-1 font-mono"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Cost per Hour (£)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={profile.costPerHour || ''}
                          onChange={(e) => handleProfileChange('costPerHour', e.target.value)}
                          className="w-full border rounded px-2 py-1 font-mono"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Support Payment Resp.</label>
                        <input
                          type="text"
                          value={profile.supportPaymentResponsibility || ''}
                          onChange={(e) => handleProfileChange('supportPaymentResponsibility', e.target.value)}
                          className="w-full border rounded px-2 py-1"
                          placeholder="e.g. Council / CCG"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Property</span>
                        <span className="font-semibold text-gray-800">{profile.property || 'Not Assigned'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Moved In</span>
                        <span className="font-semibold text-gray-800">{formatDate(profile.movedInDate)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Rent Rate</span>
                        <span className="font-bold text-gray-900">{formatCurrency(profile.rentAmount)} / wk</span>
                        <span className="text-[10px] text-gray-500 block">({profile.rentPaymentResponsibility || 'HB'})</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Utilities</span>
                        <span className="font-bold text-gray-900">{formatCurrency(profile.utilitiesPerWeek)} / wk</span>
                        <span className="text-[10px] text-gray-500 block">({profile.utilitiesPaymentResponsibility || 'Resident'})</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Support Hours</span>
                        <span className="font-semibold text-gray-800">{profile.supportHoursPerDay || 0} hrs/day</span>
                        <span className="text-[10px] text-gray-500 block">@ {formatCurrency(profile.costPerHour)}/hr</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Sleeping Night</span>
                        <span className="font-semibold text-gray-800">{profile.sleepingNight ? 'Yes' : 'No'}</span>
                        {profile.sleepingNight && <span className="text-[10px] text-gray-500 block">{formatCurrency(profile.costPerNight)}/night</span>}
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Support Responsibility</span>
                        <span className="font-semibold text-gray-800">{profile.supportPaymentResponsibility || 'Local Authority'}</span>
                      </div>
                    </div>
                  )}

                  {/* Comments / Audit Notes */}
                  <div className="pt-2 border-t border-gray-100 flex items-start gap-2">
                    <span className="text-xs font-semibold text-gray-600 shrink-0">Notes:</span>
                    <input
                      type="text"
                      value={profile.comments || ''}
                      onChange={(e) => handleProfileChange('comments', e.target.value)}
                      placeholder="Add comments or payment agreement notes here..."
                      className="w-full text-xs border-b border-dashed border-gray-300 focus:border-[#224fa6] focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Account Balances & Owing Summary Cards (4 cols) matching Service User Finances.xlsx */}
                <div className="lg:col-span-4 grid grid-cols-1 gap-2.5">
                  {/* Rent Owing */}
                  <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Rent Owing</span>
                      <span className="text-[11px] text-gray-500">
                        C/F: {formatCurrency(rentCarriedForward)} | Cur: {formatCurrency(rentCurrentYear)}
                      </span>
                    </div>
                    <span className={`text-base font-bold font-mono ${totalRentOwing > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {formatCurrency(totalRentOwing)}
                    </span>
                  </div>

                  {/* Utilities Owing */}
                  <div className="bg-white border border-amber-200 rounded-xl p-3 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Utilities Owing</span>
                      <span className="text-[11px] text-gray-500">
                        C/F: {formatCurrency(utilitiesCarriedForward)} | Cur: {formatCurrency(utilitiesCurrentYear)}
                      </span>
                    </div>
                    <span className={`text-base font-bold font-mono ${totalUtilitiesOwing > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {formatCurrency(totalUtilitiesOwing)}
                    </span>
                  </div>

                  {/* Support Owing */}
                  <div className="bg-white border border-purple-200 rounded-xl p-3 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">Support Owing</span>
                      <span className="text-[11px] text-gray-500">
                        C/F: {formatCurrency(supportCarriedForward)} | Cur: {formatCurrency(supportCurrentYear)}
                      </span>
                    </div>
                    <span className={`text-base font-bold font-mono ${totalSupportOwing > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {formatCurrency(totalSupportOwing)}
                    </span>
                  </div>

                  {/* Grand Net Total */}
                  <div className={`rounded-xl p-3 shadow-xs flex items-center justify-between border ${
                    grandTotalOwing > 0 ? 'bg-rose-50 border-rose-200' : grandTotalOwing < 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-100 border-gray-200'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-800 block">Total Outstanding Balance</span>
                      <span className="text-[10px] text-gray-500">All categories combined</span>
                    </div>
                    <span className={`text-lg font-black font-mono ${
                      grandTotalOwing > 0 ? 'text-rose-700' : grandTotalOwing < 0 ? 'text-emerald-700' : 'text-gray-700'
                    }`}>
                      {formatCurrency(grandTotalOwing)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 52-Week Ledger Table matching Service User Finances.xlsx */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Table Control Bar */}
                <div className="p-3.5 bg-gradient-to-r from-gray-50 to-slate-100 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#224fa6]"></span>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      52-Week Ledger ({year})
                    </h4>
                    <span className="text-[11px] text-gray-500">
                      (Showing {filteredWeeks.length} of 52 weeks)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Month Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-gray-500">Filter Month:</span>
                      <select
                        value={activeMonthFilter}
                        onChange={(e) => setActiveMonthFilter(e.target.value)}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white font-medium text-gray-700"
                      >
                        {months.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={applyDefaultWeeklyRatesToLedger}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                      title="Populate empty due fields from profile rate"
                    >
                      Autofill Due Rates
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-xs text-left border-collapse min-w-[950px]">
                    <thead className="sticky top-0 z-20 bg-slate-800 text-white font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 border-r border-slate-700 w-16">Wk #</th>
                        <th className="py-2.5 px-3 border-r border-slate-700 w-28">Month</th>
                        <th className="py-2.5 px-3 border-r border-slate-700 w-32">Week Commencing</th>
                        <th colSpan={2} className="py-2 px-3 text-center border-r border-slate-700 bg-purple-950/70 text-purple-200">
                          Support Hours
                        </th>
                        <th colSpan={2} className="py-2 px-3 text-center border-r border-slate-700 bg-amber-950/70 text-amber-200">
                          Utilities
                        </th>
                        <th colSpan={2} className="py-2 px-3 text-center border-r border-slate-700 bg-blue-950/70 text-blue-200">
                          Rent
                        </th>
                        <th className="py-2.5 px-3 text-right bg-slate-900 w-28">Net Week Balance</th>
                      </tr>
                      <tr className="bg-slate-700 text-[11px] text-gray-200 font-semibold border-b border-slate-600">
                        <th className="py-1 px-3 border-r border-slate-600">#</th>
                        <th className="py-1 px-3 border-r border-slate-600">Month</th>
                        <th className="py-1 px-3 border-r border-slate-600">Date (Mon)</th>
                        <th className="py-1 px-2.5 text-right border-r border-slate-600 w-24">Due (£)</th>
                        <th className="py-1 px-2.5 text-right border-r border-slate-600 w-24">Paid (£)</th>
                        <th className="py-1 px-2.5 text-right border-r border-slate-600 w-24">Due (£)</th>
                        <th className="py-1 px-2.5 text-right border-r border-slate-600 w-24">Paid (£)</th>
                        <th className="py-1 px-2.5 text-right border-r border-slate-600 w-24">Due (£)</th>
                        <th className="py-1 px-2.5 text-right border-r border-slate-600 w-24">Paid (£)</th>
                        <th className="py-1 px-3 text-right">Due - Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredWeeks.map((w, idx) => {
                        const originalIndex = weeks.findIndex(item => item.id === w.id);
                        const rowTotalDue = (w.supportDue || 0) + (w.utilitiesDue || 0) + (w.rentDue || 0);
                        const rowTotalPaid = (w.supportPaid || 0) + (w.utilitiesPaid || 0) + (w.rentPaid || 0);
                        const rowNet = rowTotalDue - rowTotalPaid;

                        return (
                          <tr key={w.id || idx} className="hover:bg-blue-50/20 transition-colors">
                            <td className="py-2 px-3 font-bold text-gray-500 border-r border-gray-100 text-center">
                              {w.weekNumber}
                            </td>
                            <td className="py-2 px-3 font-semibold text-gray-800 border-r border-gray-100">
                              {w.monthName}
                            </td>
                            <td className="py-2 px-3 text-gray-600 font-mono border-r border-gray-100">
                              {formatDate(w.weekStartDate)}
                            </td>

                            {/* Support Due & Paid */}
                            <td className="py-1 px-1.5 border-r border-gray-100 bg-purple-50/20">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={w.supportDue ?? ''}
                                onChange={(e) => handleWeekChange(originalIndex, 'supportDue', e.target.value)}
                                className="w-full text-right px-1.5 py-1 text-xs border border-transparent hover:border-gray-300 focus:border-purple-500 rounded font-mono"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="py-1 px-1.5 border-r border-gray-100 bg-purple-50/30">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={w.supportPaid ?? ''}
                                onChange={(e) => handleWeekChange(originalIndex, 'supportPaid', e.target.value)}
                                className="w-full text-right px-1.5 py-1 text-xs border border-transparent hover:border-gray-300 focus:border-purple-500 rounded font-mono font-semibold text-purple-900"
                                placeholder="0.00"
                              />
                            </td>

                            {/* Utilities Due & Paid */}
                            <td className="py-1 px-1.5 border-r border-gray-100 bg-amber-50/20">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={w.utilitiesDue ?? ''}
                                onChange={(e) => handleWeekChange(originalIndex, 'utilitiesDue', e.target.value)}
                                className="w-full text-right px-1.5 py-1 text-xs border border-transparent hover:border-gray-300 focus:border-amber-500 rounded font-mono"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="py-1 px-1.5 border-r border-gray-100 bg-amber-50/30">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={w.utilitiesPaid ?? ''}
                                onChange={(e) => handleWeekChange(originalIndex, 'utilitiesPaid', e.target.value)}
                                className="w-full text-right px-1.5 py-1 text-xs border border-transparent hover:border-gray-300 focus:border-amber-500 rounded font-mono font-semibold text-amber-900"
                                placeholder="0.00"
                              />
                            </td>

                            {/* Rent Due & Paid */}
                            <td className="py-1 px-1.5 border-r border-gray-100 bg-blue-50/20">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={w.rentDue ?? ''}
                                onChange={(e) => handleWeekChange(originalIndex, 'rentDue', e.target.value)}
                                className="w-full text-right px-1.5 py-1 text-xs border border-transparent hover:border-gray-300 focus:border-blue-500 rounded font-mono"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="py-1 px-1.5 border-r border-gray-100 bg-blue-50/30">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={w.rentPaid ?? ''}
                                onChange={(e) => handleWeekChange(originalIndex, 'rentPaid', e.target.value)}
                                className="w-full text-right px-1.5 py-1 text-xs border border-transparent hover:border-gray-300 focus:border-blue-500 rounded font-mono font-semibold text-blue-900"
                                placeholder="0.00"
                              />
                            </td>

                            {/* Net Row Balance */}
                            <td className={`py-2 px-3 text-right font-bold font-mono ${
                              rowNet > 0 ? 'text-rose-600' : rowNet < 0 ? 'text-emerald-600' : 'text-gray-400'
                            }`}>
                              {formatCurrency(rowNet)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Bottom Totals Row matching Row 62 in Service User Finances.xlsx */}
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-bold text-xs sticky bottom-0 z-20">
                        <td colSpan={3} className="py-2.5 px-3 border-r border-slate-700 uppercase tracking-wider">
                          TOTALS ({year})
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono bg-purple-950/80 border-r border-slate-700 text-purple-200">
                          {formatCurrency(computedTotals.supportDue)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono bg-purple-950/90 border-r border-slate-700 text-purple-300">
                          {formatCurrency(computedTotals.supportPaid)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono bg-amber-950/80 border-r border-slate-700 text-amber-200">
                          {formatCurrency(computedTotals.utilitiesDue)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono bg-amber-950/90 border-r border-slate-700 text-amber-300">
                          {formatCurrency(computedTotals.utilitiesPaid)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono bg-blue-950/80 border-r border-slate-700 text-blue-200">
                          {formatCurrency(computedTotals.rentDue)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono bg-blue-950/90 border-r border-slate-700 text-blue-300">
                          {formatCurrency(computedTotals.rentPaid)}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono ${
                          grandTotalOwing > 0 ? 'text-rose-400 bg-rose-950/80' : 'text-emerald-400 bg-emerald-950/80'
                        }`}>
                          {formatCurrency(
                            (computedTotals.supportDue - computedTotals.supportPaid) +
                            (computedTotals.utilitiesDue - computedTotals.utilitiesPaid) +
                            (computedTotals.rentDue - computedTotals.rentPaid)
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Changes are saved to database and live-calculated across all summary cards
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={saveAll}
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#224fa6] to-[#3270e9] hover:from-[#1a3d85] hover:to-[#2859c7] text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Saving Changes...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
