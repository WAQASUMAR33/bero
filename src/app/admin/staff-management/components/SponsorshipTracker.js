'use client';

import { useState, useEffect } from 'react';
import { isManager } from '@/lib/permissions';

export default function SponsorshipTracker({ currentUser, onViewStaff }) {
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL'); // ALL | SPONSORED | CITIZEN | EXPIRING_SOON | EXPIRED
  const isUserManager = isManager(currentUser);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/users?status=CURRENT', { headers });
      if (res.ok) {
        const data = await res.json();
        const activeOnly = (Array.isArray(data) ? data : []).filter(
          s => (s.status || 'CURRENT').toUpperCase() === 'CURRENT'
        );
        setStaff(activeOnly);
      }
    } catch (err) {
      console.error('Error fetching staff for sponsorship tracker:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const now = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(now.getDate() + 90);

  const nonSponsoredRoles = ['British Citizen', 'Irish Citizen', 'Settled Status (ILR)', 'Permanent Resident'];

  // Status helper
  const getVisaStatus = (dateStr, sponsorship) => {
    if (!dateStr) {
      if (nonSponsoredRoles.includes(sponsorship)) {
        return { code: 'CITIZEN', label: 'Citizen / Settled', badge: 'bg-gray-100 text-gray-700 border-gray-300' };
      }
      return { code: 'NONE', label: 'Not Recorded', badge: 'bg-gray-100 text-gray-500 border-gray-200' };
    }
    const expiry = new Date(dateStr);
    if (isNaN(expiry.getTime())) return { code: 'NONE', label: 'Invalid Date', badge: 'bg-gray-100 text-gray-500' };

    const warningDate = new Date(expiry);
    warningDate.setMonth(warningDate.getMonth() - 3);

    if (now >= expiry) {
      return { code: 'EXPIRED', label: 'EXPIRED', badge: 'bg-red-100 text-red-700 border-red-200 font-bold' };
    }
    if (now >= warningDate) {
      return { code: 'EXPIRING_SOON', label: 'EXPIRING (<3 MOS)', badge: 'bg-amber-100 text-amber-700 border-amber-200 font-bold' };
    }
    return { code: 'IN_DATE', label: 'IN DATE (VALID)', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 font-bold' };
  };

  const getDbsStatus = (dateStr) => {
    if (!dateStr) return { label: 'Not Set', badge: 'bg-gray-100 text-gray-500' };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { label: 'Invalid Date', badge: 'bg-gray-100 text-gray-500' };

    const expiry = new Date(date);
    expiry.setFullYear(expiry.getFullYear() + 3);

    const warningDate = new Date(expiry);
    warningDate.setMonth(warningDate.getMonth() - 6);

    if (now >= expiry) {
      return { label: 'EXPIRED (3+ YRS)', badge: 'bg-red-100 text-red-700 border-red-200 font-bold' };
    }
    if (now >= warningDate) {
      return { label: 'EXPIRING (<6 MOS)', badge: 'bg-amber-100 text-amber-700 border-amber-200 font-bold' };
    }
    return { label: 'IN DATE', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 font-bold' };
  };

  // KPI Calculations
  let totalSponsored = 0;
  let expiredVisas = 0;
  let expiringSoonVisas = 0;
  let inDateVisas = 0;
  let settledOrCitizen = 0;

  staff.forEach(s => {
    const isCitizen = nonSponsoredRoles.includes(s.sponsorshipStatus);
    if (isCitizen) {
      settledOrCitizen++;
    } else if (s.sponsorshipStatus || s.visaExpiryDate) {
      totalSponsored++;
      const v = getVisaStatus(s.visaExpiryDate, s.sponsorshipStatus);
      if (v.code === 'EXPIRED') expiredVisas++;
      else if (v.code === 'EXPIRING_SOON') expiringSoonVisas++;
      else if (v.code === 'IN_DATE') inDateVisas++;
    }
  });

  const filteredStaff = staff.filter(s => {
    if ((s.status || 'CURRENT').toUpperCase() !== 'CURRENT') return false;
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || (s.shareCode && s.shareCode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const vStatus = getVisaStatus(s.visaExpiryDate, s.sponsorshipStatus);
    const isCitizen = nonSponsoredRoles.includes(s.sponsorshipStatus);

    let matchesFilter = true;
    if (filterCategory === 'SPONSORED') {
      matchesFilter = !isCitizen && (Boolean(s.sponsorshipStatus) || Boolean(s.visaExpiryDate));
    } else if (filterCategory === 'CITIZEN') {
      matchesFilter = isCitizen;
    } else if (filterCategory === 'EXPIRING_SOON') {
      matchesFilter = vStatus.code === 'EXPIRING_SOON';
    } else if (filterCategory === 'EXPIRED') {
      matchesFilter = vStatus.code === 'EXPIRED';
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Sponsorship & Compliance Tracker</h2>
          <p className="text-xs text-gray-500 mt-1">Collation of Right to Work, Share Codes, Visa Expiry & DBS compliance dates</p>
        </div>
      </div>

      {/* EXPIRED & EXPIRING ALERT BANNERS */}
      {(expiredVisas > 0 || expiringSoonVisas > 0) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-900 text-xs">
          <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <span className="font-bold">Compliance Warning: </span>
            {expiredVisas > 0 && <span className="text-red-700 font-bold">{expiredVisas} visa(s) EXPIRED. </span>}
            {expiringSoonVisas > 0 && <span>{expiringSoonVisas} visa(s) expiring within 3 months. Verify right-to-work extensions.</span>}
          </div>
          <button
            onClick={() => setFilterCategory(expiredVisas > 0 ? 'EXPIRED' : 'EXPIRING_SOON')}
            className="underline font-bold hover:text-amber-950"
          >
            Filter Flagged
          </button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterCategory('SPONSORED')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterCategory === 'SPONSORED' ? 'bg-blue-50 border-[#224fa6] ring-1 ring-[#224fa6]' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">Total Sponsored Staff</span>
          <span className="text-2xl font-black text-gray-900">{totalSponsored}</span>
          <span className="text-[11px] text-gray-500 block mt-1">Requiring visa monitoring</span>
        </div>

        <div
          onClick={() => setFilterCategory('EXPIRING_SOON')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterCategory === 'EXPIRING_SOON' ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-1">Expiring in &lt;3 Months</span>
          <span className="text-2xl font-black text-amber-600">{expiringSoonVisas}</span>
          <span className="text-[11px] text-amber-500 block mt-1">Amber threshold warning</span>
        </div>

        <div
          onClick={() => setFilterCategory('EXPIRED')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterCategory === 'EXPIRED' ? 'bg-red-50 border-red-500 ring-1 ring-red-500' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider block mb-1">Expired Visas</span>
          <span className="text-2xl font-black text-red-600">{expiredVisas}</span>
          <span className="text-[11px] text-red-500 block mt-1">Immediate action needed</span>
        </div>

        <div
          onClick={() => setFilterCategory('CITIZEN')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterCategory === 'CITIZEN' ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-1">Citizen / Settled</span>
          <span className="text-2xl font-black text-emerald-600">{settledOrCitizen}</span>
          <span className="text-[11px] text-emerald-600 block mt-1">No visa expiry required</span>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by staff name, share code..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Category:</span>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-[#224fa6]"
          >
            <option value="ALL">All Staff</option>
            <option value="SPONSORED">Sponsored Staff Only</option>
            <option value="EXPIRING_SOON">Visa Expiring in &lt;3 Months</option>
            <option value="EXPIRED">Visa Expired</option>
            <option value="CITIZEN">British/Irish/Settled</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-gray-400 text-xs">
            <div className="w-8 h-8 border-4 border-[#224fa6] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading compliance and sponsorship data...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            No staff records found matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Sponsorship Status</th>
                  <th className="py-3.5 px-4">Share Code</th>
                  <th className="py-3.5 px-4">Visa Expiry Date</th>
                  <th className="py-3.5 px-4">Visa Status Flag</th>
                  <th className="py-3.5 px-4">DBS Check Date</th>
                  <th className="py-3.5 px-4">DBS Status Flag</th>
                  <th className="py-3.5 px-4">Contracted Hrs</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.map(s => {
                  const visaStatus = getVisaStatus(s.visaExpiryDate, s.sponsorshipStatus);
                  const dbsStatus = getDbsStatus(s.dbsDate);
                  return (
                    <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {s.role?.displayName || s.role?.name || 'Staff'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {s.sponsorshipStatus || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-700">
                        {s.shareCode || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {s.visaExpiryDate ? (
                          <span className="font-semibold text-gray-900">
                            {new Date(s.visaExpiryDate).toLocaleDateString()}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] tracking-wider uppercase border ${visaStatus.badge}`}>
                          {visaStatus.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {s.dbsDate ? new Date(s.dbsDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] tracking-wider uppercase border ${dbsStatus.badge}`}>
                          {dbsStatus.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {s.contractedHours ? `${s.contractedHours} hrs` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onViewStaff(s.id)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-[#224fa6] hover:text-white rounded-lg text-xs font-semibold text-gray-700 transition-all"
                        >
                          View File
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
