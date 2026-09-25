'use client';

import { useState, useEffect } from 'react';

const OUTGOING_COLUMNS = [
  { key: 'rent', label: 'Rent' },
  { key: 'gas', label: 'Gas' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'water', label: 'Water' },
  { key: 'councilTax', label: 'Council Tax' },
  { key: 'tvLicence', label: 'TV Licence' },
  { key: 'internet', label: 'Internet' },
  { key: 'furnishings', label: 'Furnishings' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'wages', label: 'Wages' },
  { key: 'other', label: 'Other' },
];

const INCOMING_COLUMNS = [
  { key: 'fees', label: 'Fees' },
  { key: 'utilities', label: 'Utilities' },
  { key: 'rentPayments', label: 'Rent Payments' },
];

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '£0.00';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(val);
}

export default function PnlManager({ onNotification }) {
  const [year, setYear] = useState(2026);
  const [availableYears, setAvailableYears] = useState([2026, 2027]);
  const [records, setRecords] = useState([]);
  const [totals, setTotals] = useState(null);
  const [marginPercent, setMarginPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchPnl(year);
  }, [year]);

  const fetchPnl = async (targetYear) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/finances/pnl?year=${targetYear}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        setTotals(data.totals);
        setMarginPercent(data.marginPercent || 0);
        if (data.availableYears) setAvailableYears(data.availableYears);
      } else {
        if (onNotification) onNotification({ show: true, message: data.error || 'Failed to load P&L records.', type: 'error' });
      }
    } catch (err) {
      console.error('fetchPnl error:', err);
      if (onNotification) onNotification({ show: true, message: 'Failed to load P&L records.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (rec) => {
    setEditingRecord(rec);
    setEditFormData({
      periodCode: rec.periodCode,
      month: rec.month,
      year: rec.year,
      monthName: rec.monthName,
      rent: rec.rent,
      gas: rec.gas,
      electricity: rec.electricity,
      water: rec.water,
      councilTax: rec.councilTax,
      tvLicence: rec.tvLicence,
      internet: rec.internet,
      furnishings: rec.furnishings,
      maintenance: rec.maintenance,
      insurance: rec.insurance,
      wages: rec.wages,
      other: rec.other,
      fees: rec.fees,
      utilities: rec.utilities,
      rentPayments: rec.rentPayments,
      notes: rec.notes || '',
    });
  };

  const handleEditChange = (key, val) => {
    setEditFormData(prev => ({
      ...prev,
      [key]: key === 'notes' ? val : (parseFloat(val) || 0)
    }));
  };

  // Live calculation inside edit modal
  const computedOutgoings = OUTGOING_COLUMNS.reduce((acc, col) => acc + (parseFloat(editFormData[col.key]) || 0), 0);
  const computedIncoming = INCOMING_COLUMNS.reduce((acc, col) => acc + (parseFloat(editFormData[col.key]) || 0), 0);
  const computedEbitdarm = computedIncoming - computedOutgoings;

  const saveMonthRecord = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/finances/pnl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (data.success) {
        if (onNotification) onNotification({ show: true, message: `${editFormData.monthName} P&L saved successfully.`, type: 'success' });
        setEditingRecord(null);
        await fetchPnl(year);
      } else {
        if (onNotification) onNotification({ show: true, message: data.error || 'Failed to save month.', type: 'error' });
      }
    } catch (err) {
      console.error('saveMonthRecord error:', err);
      if (onNotification) onNotification({ show: true, message: 'Failed to save month.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Find biggest expense category for analytics
  const expenseBreakdown = totals ? OUTGOING_COLUMNS.map(col => ({
    label: col.label,
    amount: totals[col.key] || 0,
    pct: totals.totalOutgoings > 0 ? (((totals[col.key] || 0) / totals.totalOutgoings) * 100).toFixed(1) : 0,
  })).sort((a, b) => b.amount - a.amount) : [];

  const topExpense = expenseBreakdown[0] || { label: 'N/A', amount: 0, pct: 0 };

  return (
    <div className="space-y-6">
      {/* Top Header & Year Selector */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-[#224fa6] rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Profit & Loss Statement (P&L)</h2>
              <p className="text-xs text-gray-500">Live operational financial statement matching Beerusys P&L tracker</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 shadow-xs">
            <span className="text-xs font-semibold text-gray-600 mr-2">Fiscal Year:</span>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="bg-transparent text-sm font-bold text-blue-900 focus:outline-none cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => fetchPnl(year)}
            className="p-2 text-gray-600 hover:text-blue-900 hover:bg-blue-50 rounded-xl border border-gray-200 transition-colors"
            title="Refresh P&L Data"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Incoming */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Incoming YTD</p>
          <h3 className="text-2xl font-bold text-emerald-700 mt-2">
            {formatCurrency(totals?.totalIncoming || 0)}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <span>Fees, Utilities & Rent</span>
          </p>
        </div>

        {/* Total Outgoings */}
        <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Total Outgoings YTD</p>
          <h3 className="text-2xl font-bold text-rose-700 mt-2">
            {formatCurrency(totals?.totalOutgoings || 0)}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">
            Wages, Rent, Utilities & Ops
          </p>
        </div>

        {/* EBITDARM */}
        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#224fa6] uppercase tracking-wider">EBITDARM (Net Profit)</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              (totals?.ebitdarm || 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {marginPercent}% Margin
            </span>
          </div>
          <h3 className={`text-2xl font-bold mt-2 ${
            (totals?.ebitdarm || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
          }`}>
            {formatCurrency(totals?.ebitdarm || 0)}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">
            Operating balance before taxes/deprec.
          </p>
        </div>

        {/* Top Expense Category */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Largest Cost Driver</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">
            {topExpense.label}
          </h3>
          <p className="text-[11px] text-gray-600 mt-1">
            <strong>{formatCurrency(topExpense.amount)}</strong> ({topExpense.pct}% of total outgoings)
          </p>
        </div>
      </div>

      {/* Main 12-Month Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-100 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#224fa6]"></span>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              {year} Monthly Ledger Breakdown
            </h4>
          </div>
          <span className="text-xs text-gray-500">
            Click on any month row or the <strong>Edit</strong> button to input or update actual figures
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]"></div>
            <p className="mt-2 text-sm">Loading P&L records for {year}...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[1400px]">
              <thead>
                {/* Level 1 Header: Group Categories */}
                <tr className="bg-slate-800 text-white font-semibold">
                  <th className="py-2.5 px-3 sticky left-0 z-20 bg-slate-800 border-r border-slate-700 min-w-[120px]">
                    Month
                  </th>
                  <th colSpan={OUTGOING_COLUMNS.length + 1} className="py-2 px-3 text-center border-r border-slate-700 bg-rose-950/60 uppercase tracking-wider text-[11px] text-rose-200">
                    Outgoings (Expenses)
                  </th>
                  <th colSpan={INCOMING_COLUMNS.length + 1} className="py-2 px-3 text-center border-r border-slate-700 bg-emerald-950/60 uppercase tracking-wider text-[11px] text-emerald-200">
                    Incoming (Revenue)
                  </th>
                  <th className="py-2.5 px-3 text-center bg-blue-950 uppercase tracking-wider text-[11px] text-blue-200 min-w-[110px]">
                    Profitability
                  </th>
                  <th className="py-2.5 px-3 text-center bg-slate-800 min-w-[70px]">
                    Action
                  </th>
                </tr>

                {/* Level 2 Header: Individual Columns */}
                <tr className="bg-slate-100 text-gray-700 font-bold border-b border-gray-200 text-[11px]">
                  <th className="py-2 px-3 sticky left-0 z-20 bg-slate-100 border-r border-gray-200">
                    Period
                  </th>
                  {OUTGOING_COLUMNS.map((col) => (
                    <th key={col.key} className="py-2 px-2.5 text-right font-semibold text-gray-600 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th className="py-2 px-3 text-right font-bold text-rose-800 bg-rose-50/70 border-r border-gray-200 whitespace-nowrap">
                    Total Outgoings
                  </th>
                  {INCOMING_COLUMNS.map((col) => (
                    <th key={col.key} className="py-2 px-2.5 text-right font-semibold text-gray-600 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th className="py-2 px-3 text-right font-bold text-emerald-800 bg-emerald-50/70 border-r border-gray-200 whitespace-nowrap">
                    Total Incoming
                  </th>
                  <th className="py-2 px-3 text-right font-bold text-blue-950 bg-blue-50/60 whitespace-nowrap">
                    EBITDARM
                  </th>
                  <th className="py-2 px-2 text-center text-gray-500">
                    Edit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => openEditModal(rec)}
                  >
                    <td className="py-2.5 px-3 font-bold text-gray-900 sticky left-0 z-10 bg-white group-hover:bg-blue-50/40 border-r border-gray-200 whitespace-nowrap">
                      {rec.monthName.split(' ')[0]}
                    </td>
                    {OUTGOING_COLUMNS.map((col) => (
                      <td key={col.key} className="py-2 px-2.5 text-right text-gray-700 font-mono">
                        {rec[col.key] ? formatCurrency(rec[col.key]) : '-'}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-rose-700 bg-rose-50/30 border-r border-gray-200 font-mono">
                      {formatCurrency(rec.totalOutgoings)}
                    </td>
                    {INCOMING_COLUMNS.map((col) => (
                      <td key={col.key} className="py-2 px-2.5 text-right text-gray-700 font-mono">
                        {rec[col.key] ? formatCurrency(rec[col.key]) : '-'}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-emerald-700 bg-emerald-50/30 border-r border-gray-200 font-mono">
                      {formatCurrency(rec.totalIncoming)}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold font-mono ${
                      rec.ebitdarm >= 0 ? 'text-emerald-700 bg-emerald-50/20' : 'text-rose-600 bg-rose-50/20'
                    }`}>
                      {formatCurrency(rec.ebitdarm)}
                    </td>
                    <td className="py-2 px-2 text-center" onClick={(e) => { e.stopPropagation(); openEditModal(rec); }}>
                      <button
                        type="button"
                        className="text-xs px-2 py-1 bg-white hover:bg-[#224fa6] text-[#224fa6] hover:text-white rounded border border-[#224fa6] transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals Row matching Excel Formula Row */}
              {totals && (
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] border-t-2 border-slate-700">
                    <td className="py-3 px-3 sticky left-0 z-20 bg-slate-900 border-r border-slate-700 uppercase tracking-wider">
                      TOTAL ({year})
                    </td>
                    {OUTGOING_COLUMNS.map((col) => (
                      <td key={col.key} className="py-3 px-2.5 text-right font-mono text-gray-200">
                        {formatCurrency(totals[col.key])}
                      </td>
                    ))}
                    <td className="py-3 px-3 text-right font-bold text-rose-300 bg-rose-950/80 border-r border-slate-700 font-mono">
                      {formatCurrency(totals.totalOutgoings)}
                    </td>
                    {INCOMING_COLUMNS.map((col) => (
                      <td key={col.key} className="py-3 px-2.5 text-right font-mono text-gray-200">
                        {formatCurrency(totals[col.key])}
                      </td>
                    ))}
                    <td className="py-3 px-3 text-right font-bold text-emerald-300 bg-emerald-950/80 border-r border-slate-700 font-mono">
                      {formatCurrency(totals.totalIncoming)}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold font-mono ${
                      totals.ebitdarm >= 0 ? 'text-emerald-400 bg-emerald-950/90' : 'text-rose-400 bg-rose-950/90'
                    }`}>
                      {formatCurrency(totals.ebitdarm)}
                    </td>
                    <td className="py-3 px-2 text-center"><span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Edit Month Modal */}
      {editingRecord && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Edit P&L Month — {editingRecord.monthName}</h3>
                <p className="text-xs text-blue-100">Update incoming revenues and outgoing operational expenses</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-white/80 hover:text-white text-2xl leading-none transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Live Preview Summary Bar */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div>
                  <span className="text-[11px] font-semibold text-rose-800 uppercase block">Total Outgoings</span>
                  <span className="text-lg font-bold text-rose-700">{formatCurrency(computedOutgoings)}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Total Incoming</span>
                  <span className="text-lg font-bold text-emerald-700">{formatCurrency(computedIncoming)}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#224fa6] uppercase block">EBITDARM</span>
                  <span className={`text-lg font-bold ${computedEbitdarm >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {formatCurrency(computedEbitdarm)}
                  </span>
                </div>
              </div>

              {/* Section 1: Incoming Revenue */}
              <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    Incoming Revenues (Fees, Utilities, Rent)
                  </h5>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {INCOMING_COLUMNS.map((col) => (
                    <div key={col.key}>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{col.label} (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editFormData[col.key] || ''}
                        onChange={(e) => handleEditChange(col.key, e.target.value)}
                        className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Outgoings Expenses */}
              <div className="bg-rose-50/30 border border-rose-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  <h5 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                    Outgoings (Operational Expenses & Utilities)
                  </h5>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {OUTGOING_COLUMNS.map((col) => (
                    <div key={col.key}>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{col.label} (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editFormData[col.key] || ''}
                        onChange={(e) => handleEditChange(col.key, e.target.value)}
                        className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-rose-500 focus:border-transparent font-mono"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Month Notes / Comments</label>
                <textarea
                  rows={2}
                  value={editFormData.notes || ''}
                  onChange={(e) => handleEditChange('notes', e.target.value)}
                  placeholder="Optional financial or variance notes for this month..."
                  className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6]"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">All calculations update automatically on save</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  disabled={saving}
                  className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveMonthRecord}
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#224fa6] to-[#3270e9] hover:from-[#1a3d85] hover:to-[#2859c7] text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Month'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
