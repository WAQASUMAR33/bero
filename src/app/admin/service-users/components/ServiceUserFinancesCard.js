'use client';

import { useState, useEffect } from 'react';
import ServiceUserLedgerModal from '../../finances/components/ServiceUserLedgerModal';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '£0.00';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(val);
}

export default function ServiceUserFinancesCard({ serviceSeekerId, serviceUserName, onNotification }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  useEffect(() => {
    if (serviceSeekerId) {
      fetchFinances();
    }
  }, [serviceSeekerId]);

  const fetchFinances = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/finances/service-users/${serviceSeekerId}?year=2026`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const profile = data?.profile || {};
  const summary = data?.summary || {};
  const grandTotalOwing = summary.grandTotalOwing || 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-white/10 rounded-lg text-lg">💷</span>
          <div>
            <h2 className="text-lg font-bold">Service User Finances & 52-Week Ledger</h2>
            <p className="text-xs text-blue-100">Weekly accounting, rent, utilities, and care package ledger</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLedgerModal(true)}
          className="px-4 py-2 bg-white text-[#224fa6] hover:bg-blue-50 font-bold rounded-lg text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>📊</span>
          <span>Open Full 52-Week Ledger</span>
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-[#224fa6]"></div>
            <p className="mt-2 text-xs">Loading finances...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Agreement Rates & Payment Responsibilities */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Rent Rate</span>
                <span className="font-bold text-gray-900 text-sm">{formatCurrency(profile.rentAmount)} / wk</span>
                <span className="text-[10px] text-gray-500 block">Resp: {profile.rentPaymentResponsibility || 'Not Specified'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Utilities Service Charge</span>
                <span className="font-bold text-gray-900 text-sm">{formatCurrency(profile.utilitiesPerWeek)} / wk</span>
                <span className="text-[10px] text-gray-500 block">Resp: {profile.utilitiesPaymentResponsibility || 'Not Specified'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Support Hours</span>
                <span className="font-bold text-gray-900 text-sm">{profile.supportHoursPerDay || 0} hrs/day</span>
                <span className="text-[10px] text-gray-500 block">Rate: {formatCurrency(profile.costPerHour)}/hr</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Support Responsibility</span>
                <span className="font-bold text-gray-900 text-sm">{profile.supportPaymentResponsibility || 'Local Authority'}</span>
                <span className="text-[10px] text-gray-500 block">Night: {profile.sleepingNight ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {/* Owing Balances Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200">
                <span className="text-[11px] font-bold text-blue-900 block">Rent Owing</span>
                <span className="text-base font-bold text-blue-950 font-mono">
                  {formatCurrency(summary.rent?.totalOwing)}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  C/F: {formatCurrency(summary.rent?.carriedForward)} | YTD: {formatCurrency(summary.rent?.currentYear)}
                </span>
              </div>

              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
                <span className="text-[11px] font-bold text-amber-900 block">Utilities Owing</span>
                <span className="text-base font-bold text-amber-950 font-mono">
                  {formatCurrency(summary.utilities?.totalOwing)}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  C/F: {formatCurrency(summary.utilities?.carriedForward)} | YTD: {formatCurrency(summary.utilities?.currentYear)}
                </span>
              </div>

              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200">
                <span className="text-[11px] font-bold text-purple-900 block">Support Hours Owing</span>
                <span className="text-base font-bold text-purple-950 font-mono">
                  {formatCurrency(summary.support?.totalOwing)}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  C/F: {formatCurrency(summary.support?.carriedForward)} | YTD: {formatCurrency(summary.support?.currentYear)}
                </span>
              </div>

              <div className={`p-3.5 rounded-xl border ${
                grandTotalOwing > 0 ? 'bg-rose-50 border-rose-200' : grandTotalOwing < 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-100 border-gray-200'
              }`}>
                <span className="text-[11px] font-bold text-gray-800 block">Total Balance</span>
                <span className={`text-base font-black font-mono ${
                  grandTotalOwing > 0 ? 'text-rose-700' : grandTotalOwing < 0 ? 'text-emerald-700' : 'text-gray-700'
                }`}>
                  {formatCurrency(grandTotalOwing)}
                </span>
                <span className="text-[10px] font-semibold text-gray-500 block mt-0.5">
                  {grandTotalOwing > 0 ? 'In Arrears' : grandTotalOwing < 0 ? 'In Credit' : 'Zero Balance'}
                </span>
              </div>
            </div>

            {profile.comments && (
              <p className="text-xs text-gray-600 italic bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                <strong>Notes:</strong> {profile.comments}
              </p>
            )}
          </div>
        )}
      </div>

      {showLedgerModal && (
        <ServiceUserLedgerModal
          serviceSeekerId={serviceSeekerId}
          onClose={() => {
            setShowLedgerModal(false);
            fetchFinances(); // refresh on modal close
          }}
          onNotification={onNotification}
        />
      )}
    </div>
  );
}
