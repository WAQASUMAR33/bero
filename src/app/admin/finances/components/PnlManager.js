'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus, X, PencilLine } from 'lucide-react';

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

function KpiCard({ label, value, sub, color = 'blue', badge, badgeColor }) {
  const colorMap = {
    emerald: { border: 'border-emerald-100', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    rose:    { border: 'border-rose-100',    bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500' },
    blue:    { border: 'border-blue-100',    bg: 'bg-blue-50',    text: 'text-[#224fa6]',   dot: 'bg-[#224fa6]' },
    amber:   { border: 'border-amber-100',   bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-5 border ${c.border} shadow-sm relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-20 h-20 ${c.bg} rounded-bl-full -mr-3 -mt-3 opacity-40`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
          {badge && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${badgeColor}`}>{badge}</span>
          )}
        </div>
        <p className={`text-xl sm:text-2xl font-black mt-2 ${c.text}`}>{value}</p>
        {sub && <p className="text-[11px] text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
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

  useEffect(() => { fetchPnl(year); }, [year]);

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
    } catch {
      if (onNotification) onNotification({ show: true, message: 'Failed to load P&L records.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (rec) => {
    setEditingRecord(rec);
    setEditFormData({
      periodCode: rec.periodCode, month: rec.month, year: rec.year, monthName: rec.monthName,
      rent: rec.rent, gas: rec.gas, electricity: rec.electricity, water: rec.water,
      councilTax: rec.councilTax, tvLicence: rec.tvLicence, internet: rec.internet,
      furnishings: rec.furnishings, maintenance: rec.maintenance, insurance: rec.insurance,
      wages: rec.wages, other: rec.other, fees: rec.fees, utilities: rec.utilities,
      rentPayments: rec.rentPayments, notes: rec.notes || '',
    });
  };

  const handleEditChange = (key, val) => {
    setEditFormData(prev => ({ ...prev, [key]: key === 'notes' ? val : (parseFloat(val) || 0) }));
  };

  const computedOutgoings = OUTGOING_COLUMNS.reduce((acc, col) => acc + (parseFloat(editFormData[col.key]) || 0), 0);
  const computedIncoming = INCOMING_COLUMNS.reduce((acc, col) => acc + (parseFloat(editFormData[col.key]) || 0), 0);
  const computedEbitdarm = computedIncoming - computedOutgoings;

  const saveMonthRecord = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/finances/pnl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (data.success) {
        if (onNotification) onNotification({ show: true, message: `${editFormData.monthName} P&L saved.`, type: 'success' });
        setEditingRecord(null);
        await fetchPnl(year);
      } else {
        if (onNotification) onNotification({ show: true, message: data.error || 'Failed to save month.', type: 'error' });
      }
    } catch {
      if (onNotification) onNotification({ show: true, message: 'Failed to save month.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const expenseBreakdown = totals
    ? OUTGOING_COLUMNS.map(col => ({
        label: col.label,
        amount: totals[col.key] || 0,
        pct: totals.totalOutgoings > 0 ? (((totals[col.key] || 0) / totals.totalOutgoings) * 100).toFixed(1) : 0,
      })).sort((a, b) => b.amount - a.amount)
    : [];
  const topExpense = expenseBreakdown[0] || { label: 'N/A', amount: 0, pct: 0 };

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Profit & Loss Statement</h2>
          <p className="text-xs text-gray-500 mt-0.5">Live operational financial statement — updated automatically from manual entries</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
            <span className="text-[11px] font-semibold text-gray-500 mr-2 whitespace-nowrap">Fiscal Year</span>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="bg-transparent text-sm font-bold text-[#224fa6] focus:outline-none cursor-pointer"
            >
              {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={() => fetchPnl(year)}
            className="p-2 text-gray-500 hover:text-[#224fa6] hover:bg-blue-50 rounded-xl border border-gray-200 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Total Incoming YTD"
          value={formatCurrency(totals?.totalIncoming || 0)}
          sub="Fees, Utilities & Rent"
          color="emerald"
        />
        <KpiCard
          label="Total Outgoings YTD"
          value={formatCurrency(totals?.totalOutgoings || 0)}
          sub="Wages, Rent & Ops"
          color="rose"
        />
        <KpiCard
          label="EBITDARM"
          value={formatCurrency(totals?.ebitdarm || 0)}
          sub="Operating balance before taxes"
          color={(totals?.ebitdarm || 0) >= 0 ? 'emerald' : 'rose'}
          badge={`${marginPercent}% Margin`}
          badgeColor={(totals?.ebitdarm || 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}
        />
        <KpiCard
          label="Largest Cost Driver"
          value={topExpense.label}
          sub={`${formatCurrency(topExpense.amount)} · ${topExpense.pct}% of outgoings`}
          color="amber"
        />
      </div>

      {/* ── Monthly Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#224fa6]" />
            <h4 className="text-sm font-bold text-gray-900">{year} Monthly Ledger</h4>
          </div>
          <p className="text-xs text-gray-500">Tap any row to edit monthly figures</p>
        </div>

        {loading ? (
          <div className="p-12 sm:p-16 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]" />
            <p className="mt-3 text-sm">Loading P&L for {year}...</p>
          </div>
        ) : (
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full text-xs text-left border-collapse" style={{ minWidth: '1350px' }}>
              <thead>
                <tr className="bg-slate-800 text-white font-semibold">
                  <th className="py-3 px-3 sticky left-0 z-20 bg-slate-800 border-r border-slate-700 min-w-[90px]">Month</th>
                  <th colSpan={OUTGOING_COLUMNS.length + 1} className="py-2 px-3 text-center border-r border-slate-700 bg-rose-950/70 uppercase tracking-wider text-[11px] text-rose-200">
                    Outgoings (Expenses)
                  </th>
                  <th colSpan={INCOMING_COLUMNS.length + 1} className="py-2 px-3 text-center border-r border-slate-700 bg-emerald-950/70 uppercase tracking-wider text-[11px] text-emerald-200">
                    Incoming (Revenue)
                  </th>
                  <th className="py-2 px-3 text-center bg-blue-950/80 uppercase tracking-wider text-[11px] text-blue-200 min-w-[100px]">Profit</th>
                  <th className="py-2 px-3 text-center bg-slate-800 min-w-[60px]" />
                </tr>
                <tr className="bg-slate-100 text-gray-700 font-bold border-b border-gray-200 text-[11px]">
                  <th className="py-2 px-3 sticky left-0 z-20 bg-slate-100 border-r border-gray-200">Period</th>
                  {OUTGOING_COLUMNS.map((col) => (
                    <th key={col.key} className="py-2 px-2.5 text-right font-semibold text-gray-600 whitespace-nowrap">{col.label}</th>
                  ))}
                  <th className="py-2 px-3 text-right font-bold text-rose-800 bg-rose-50 border-r border-gray-200 whitespace-nowrap">Total Out</th>
                  {INCOMING_COLUMNS.map((col) => (
                    <th key={col.key} className="py-2 px-2.5 text-right font-semibold text-gray-600 whitespace-nowrap">{col.label}</th>
                  ))}
                  <th className="py-2 px-3 text-right font-bold text-emerald-800 bg-emerald-50 border-r border-gray-200 whitespace-nowrap">Total In</th>
                  <th className="py-2 px-3 text-right font-bold text-[#224fa6] bg-blue-50/60 whitespace-nowrap">EBITDARM</th>
                  <th className="py-2 px-2 text-center text-gray-400">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => openEditModal(rec)}
                  >
                    <td className="py-2.5 px-3 font-bold text-gray-900 sticky left-0 z-10 bg-white group-hover:bg-blue-50/40 border-r border-gray-200 whitespace-nowrap">
                      {rec.monthName.split(' ')[0]}
                    </td>
                    {OUTGOING_COLUMNS.map((col) => (
                      <td key={col.key} className="py-2 px-2.5 text-right text-gray-600 font-mono">
                        {rec[col.key] ? formatCurrency(rec[col.key]) : <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-rose-700 bg-rose-50/40 border-r border-gray-200 font-mono">
                      {formatCurrency(rec.totalOutgoings)}
                    </td>
                    {INCOMING_COLUMNS.map((col) => (
                      <td key={col.key} className="py-2 px-2.5 text-right text-gray-600 font-mono">
                        {rec[col.key] ? formatCurrency(rec[col.key]) : <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-emerald-700 bg-emerald-50/40 border-r border-gray-200 font-mono">
                      {formatCurrency(rec.totalIncoming)}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold font-mono ${rec.ebitdarm >= 0 ? 'text-emerald-700 bg-emerald-50/20' : 'text-rose-600 bg-rose-50/20'}`}>
                      {formatCurrency(rec.ebitdarm)}
                    </td>
                    <td className="py-2 px-2 text-center" onClick={(e) => { e.stopPropagation(); openEditModal(rec); }}>
                      <button
                        type="button"
                        className="p-1.5 text-gray-400 hover:text-[#224fa6] hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-[#224fa6] transition-all cursor-pointer"
                      >
                        <PencilLine className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {totals && (
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] border-t-2 border-slate-700">
                    <td className="py-3 px-3 sticky left-0 z-20 bg-slate-900 border-r border-slate-700 uppercase tracking-wider text-slate-300">TOTAL</td>
                    {OUTGOING_COLUMNS.map((col) => (
                      <td key={col.key} className="py-3 px-2.5 text-right font-mono text-gray-300">{formatCurrency(totals[col.key])}</td>
                    ))}
                    <td className="py-3 px-3 text-right font-bold text-rose-300 bg-rose-950/80 border-r border-slate-700 font-mono">{formatCurrency(totals.totalOutgoings)}</td>
                    {INCOMING_COLUMNS.map((col) => (
                      <td key={col.key} className="py-3 px-2.5 text-right font-mono text-gray-300">{formatCurrency(totals[col.key])}</td>
                    ))}
                    <td className="py-3 px-3 text-right font-bold text-emerald-300 bg-emerald-950/80 border-r border-slate-700 font-mono">{formatCurrency(totals.totalIncoming)}</td>
                    <td className={`py-3 px-3 text-right font-bold font-mono ${totals.ebitdarm >= 0 ? 'text-emerald-400 bg-emerald-950/90' : 'text-rose-400 bg-rose-950/90'}`}>
                      {formatCurrency(totals.ebitdarm)}
                    </td>
                    <td className="py-3 px-2" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editingRecord && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:fade-in sm:zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold">Edit P&L — {editingRecord.monthName}</h3>
                <p className="text-xs text-blue-100">Update incoming revenues and outgoing operational expenses</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Live Preview */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="text-center sm:text-left">
                  <span className="text-[10px] sm:text-[11px] font-bold text-rose-700 uppercase block">Outgoings</span>
                  <span className="text-base sm:text-lg font-black text-rose-700">{formatCurrency(computedOutgoings)}</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase block">Incoming</span>
                  <span className="text-base sm:text-lg font-black text-emerald-700">{formatCurrency(computedIncoming)}</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#224fa6] uppercase block">EBITDARM</span>
                  <span className={`text-base sm:text-lg font-black ${computedEbitdarm >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {formatCurrency(computedEbitdarm)}
                  </span>
                </div>
              </div>

              {/* Incoming Revenue */}
              <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Incoming Revenues</h5>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {INCOMING_COLUMNS.map((col) => (
                    <div key={col.key}>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{col.label} (£)</label>
                      <input
                        type="number" step="0.01" min="0"
                        value={editFormData[col.key] || ''}
                        onChange={(e) => handleEditChange(col.key, e.target.value)}
                        className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Outgoing Expenses */}
              <div className="bg-rose-50/30 border border-rose-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <h5 className="text-xs font-bold text-rose-900 uppercase tracking-wide">Outgoings & Expenses</h5>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {OUTGOING_COLUMNS.map((col) => (
                    <div key={col.key}>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{col.label} (£)</label>
                      <input
                        type="number" step="0.01" min="0"
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
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Month Notes</label>
                <textarea
                  rows={2}
                  value={editFormData.notes || ''}
                  onChange={(e) => handleEditChange('notes', e.target.value)}
                  placeholder="Optional variance notes for this month..."
                  className="w-full text-sm bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500 hidden sm:block">All totals update automatically on save</span>
              <div className="flex gap-2 ml-auto">
                <button
                  type="button" onClick={() => setEditingRecord(null)} disabled={saving}
                  className="px-4 sm:px-5 py-2 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button" onClick={saveMonthRecord} disabled={saving}
                  className="px-5 sm:px-6 py-2 rounded-xl bg-gradient-to-r from-[#224fa6] to-[#3270e9] hover:from-[#1a3d85] hover:to-[#2859c7] text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-60 cursor-pointer"
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
