import { useState, useEffect } from 'react';
import { isManager } from '@/lib/permissions';
import StaffWageSheetView from '../wages/components/StaffWageSheetView';

export default function StaffFileModal({ staffId, isOpen, onClose, currentUser, onEditClick, onDataUpdated }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [staffData, setStaffData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [wageSheetData, setWageSheetData] = useState(null);
  const [loadingWages, setLoadingWages] = useState(false);

  // Sub-modal states for logging items
  const [showLogSupervision, setShowLogSupervision] = useState(false);
  const [showLogAppraisal, setShowLogAppraisal] = useState(false);
  const [showLogProbation, setShowLogProbation] = useState(false);
  const [showLogPdp, setShowLogPdp] = useState(false);

  // Forms
  const [supervisionForm, setSupervisionForm] = useState({
    supervisionDate: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    type: '1-to-1 Regular',
    status: 'COMPLETED',
    discussionNotes: '',
    actionAgreed: '',
    notes: ''
  });

  const [appraisalForm, setAppraisalForm] = useState({
    lastAppraisalDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'PENDING',
    rating: 'Meets Expectations',
    feedback: '',
    goals: '',
    notes: ''
  });

  const [probationForm, setProbationForm] = useState({
    startDate: '',
    dueDate: '',
    reviewDate: '',
    status: 'UNDER_PROBATION',
    outcome: 'In Progress',
    notes: ''
  });

  const [pdpForm, setPdpForm] = useState({
    dateIdentified: new Date().toISOString().split('T')[0],
    routeIdentified: 'Supervision',
    area: '',
    personResponsible: '',
    targetDate: '',
    progress: 'NOT_STARTED',
    notes: ''
  });

  const isUserManager = isManager(currentUser);

  const fetchStaffFile = async () => {
    if (!staffId) return;
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/users/${staffId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStaffData(data);
      } else {
        const err = await res.json();
        setNotification({ show: true, message: err.error || 'Failed to load staff file', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching staff file:', error);
      setNotification({ show: true, message: 'Network error loading staff file', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffWages = async () => {
    if (!staffId) return;
    setLoadingWages(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/wages?userId=${staffId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const userSheet = Array.isArray(data) ? data.find(s => s.userId === parseInt(staffId)) || data[0] : data;
        setWageSheetData(userSheet || null);
      }
    } catch (err) {
      console.error('Error fetching staff wages:', err);
    } finally {
      setLoadingWages(false);
    }
  };

  useEffect(() => {
    if (isOpen && staffId) {
      fetchStaffFile();
      setActiveTab('overview');
    }
  }, [isOpen, staffId]);

  useEffect(() => {
    if (isOpen && activeTab === 'wages' && staffId) {
      fetchStaffWages();
    }
  }, [isOpen, activeTab, staffId]);

  if (!isOpen) return null;

  // Compliance calculations
  const getDbsStatus = (dateStr) => {
    if (!dateStr) return { status: 'none', label: 'Not Set', badge: 'bg-gray-100 text-gray-700 border-gray-300' };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { status: 'none', label: 'Invalid Date', badge: 'bg-gray-100 text-gray-700' };

    const expiry = new Date(date);
    expiry.setFullYear(expiry.getFullYear() + 3);

    const warningDate = new Date(expiry);
    warningDate.setMonth(warningDate.getMonth() - 6);

    const now = new Date();
    if (now >= expiry) {
      return { status: 'expired', label: 'Expired (3+ Yrs)', badge: 'bg-red-100 text-red-800 border-red-300' };
    }
    if (now >= warningDate) {
      return { status: 'expiring', label: 'Expiring in < 6 Mos', badge: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    return { status: 'valid', label: 'In Date (Valid)', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  const getVisaStatus = (dateStr, sponsorship) => {
    if (!dateStr) {
      if (['British Citizen', 'Irish Citizen', 'Settled Status (ILR)', 'Permanent Resident'].includes(sponsorship)) {
        return { status: 'na', label: 'Citizen / Settled', badge: 'bg-gray-100 text-gray-700 border-gray-300' };
      }
      return { status: 'none', label: 'Not Set', badge: 'bg-gray-100 text-gray-600 border-gray-300' };
    }
    const expiry = new Date(dateStr);
    if (isNaN(expiry.getTime())) return { status: 'none', label: 'Invalid Date', badge: 'bg-gray-100 text-gray-700' };

    const warningDate = new Date(expiry);
    warningDate.setMonth(warningDate.getMonth() - 3);

    const now = new Date();
    if (now >= expiry) {
      return { status: 'expired', label: 'Expired', badge: 'bg-red-100 text-red-800 border-red-300' };
    }
    if (now >= warningDate) {
      return { status: 'expiring', label: 'Expiring in < 3 Mos', badge: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    return { status: 'valid', label: 'In Date (Valid)', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  const dbsStatus = getDbsStatus(staffData?.dbsDate);
  const visaStatus = getVisaStatus(staffData?.visaExpiryDate, staffData?.sponsorshipStatus);

  // Handlers for logging records
  const handleSaveSupervision = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/staff/supervisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...supervisionForm, userId: staffId })
      });
      if (res.ok) {
        setShowLogSupervision(false);
        setSupervisionForm({
          supervisionDate: new Date().toISOString().split('T')[0],
          nextDueDate: '',
          type: '1-to-1 Regular',
          status: 'COMPLETED',
          discussionNotes: '',
          actionAgreed: '',
          notes: ''
        });
        fetchStaffFile();
        if (onDataUpdated) onDataUpdated();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save supervision');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving supervision');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAppraisal = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/staff/appraisals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...appraisalForm, userId: staffId })
      });
      if (res.ok) {
        setShowLogAppraisal(false);
        setAppraisalForm({
          lastAppraisalDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          status: 'PENDING',
          rating: 'Meets Expectations',
          feedback: '',
          goals: '',
          notes: ''
        });
        fetchStaffFile();
        if (onDataUpdated) onDataUpdated();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save appraisal');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving appraisal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProbation = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/staff/probations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...probationForm, userId: staffId })
      });
      if (res.ok) {
        setShowLogProbation(false);
        setProbationForm({
          startDate: '',
          dueDate: '',
          reviewDate: '',
          status: 'UNDER_PROBATION',
          outcome: 'In Progress',
          notes: ''
        });
        fetchStaffFile();
        if (onDataUpdated) onDataUpdated();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save probation review');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving probation review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePdp = async (e) => {
    e.preventDefault();
    if (!isUserManager) {
      alert('Permission Denied: Only management has permission to add or modify Personal Development Plans.');
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/staff/pdps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...pdpForm, userId: staffId })
      });
      if (res.ok) {
        setShowLogPdp(false);
        setPdpForm({
          dateIdentified: new Date().toISOString().split('T')[0],
          routeIdentified: 'Supervision',
          area: '',
          personResponsible: '',
          targetDate: '',
          progress: 'NOT_STARTED',
          notes: ''
        });
        fetchStaffFile();
        if (onDataUpdated) onDataUpdated();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save PDP');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving PDP');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-[#1a3a75] to-[#224fa6] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-4">
            {staffData?.profilePic ? (
              <img
                src={staffData.profilePic}
                alt="Profile"
                className="w-14 h-14 rounded-full object-cover border-2 border-white/50 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center font-bold text-xl text-white shadow-inner">
                {staffData?.firstName?.[0] || 'S'}{staffData?.lastName?.[0] || 'M'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">
                  {staffData ? `${staffData.firstName} ${staffData.lastName}` : 'Staff File'}
                </h2>
                {staffData?.status && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    staffData.status === 'CURRENT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}>
                    {staffData.status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-blue-100/90 mt-1">
                <span>{staffData?.role?.displayName || staffData?.role?.name || 'Staff Member'}</span>
                <span>•</span>
                <span>ID: {staffData?.employeeNumber || `#${staffData?.id}`}</span>
                {staffData?.region?.title && (
                  <>
                    <span>•</span>
                    <span>Region: {staffData.region.title}</span>
                  </>
                )}
                {staffData?.startDate && (
                  <>
                    <span>•</span>
                    <span>Started: {new Date(staffData.startDate).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUserManager && onEditClick && staffData && (
              <button
                onClick={() => {
                  onClose();
                  onEditClick(staffData);
                }}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 border border-white/20"
                title="Edit Staff File"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Profile</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Close File"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="bg-slate-50 border-b border-gray-200 px-6 py-2 overflow-x-auto flex items-center gap-2 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { id: 'personal', label: 'Personal & Contact', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { id: 'employment', label: 'Employment & Pay', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
            { id: 'compliance', label: 'Compliance & DBS', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { id: 'supervisions', label: `Supervisions (${staffData?.supervisions?.length || 0})`, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'appraisals', label: `Appraisals (${staffData?.appraisals?.length || 0})`, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
            { id: 'probation', label: `Probation (${staffData?.probations?.length || 0})`, icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'sponsorship', label: 'Sponsorship & Visa', icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9' },
            { id: 'driving', label: 'Driving Details', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
            { id: 'health', label: 'NOK & Medical', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
            { id: 'pdp', label: `PDP (${staffData?.pdps?.length || 0})`, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            { id: 'wages', label: 'Wages & Timesheet', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#224fa6] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
              <div className="w-10 h-10 border-4 border-[#224fa6] border-t-transparent rounded-full animate-spin"></div>
              <span className="mt-3 text-sm font-medium">Loading staff file details...</span>
            </div>
          ) : !staffData ? (
            <div className="text-center py-16 text-gray-500">
              <p>Staff file could not be loaded or you do not have permission to view this file.</p>
            </div>
          ) : (
            <>
              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* COMPLIANCE ALERT CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">DBS Status</span>
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${dbsStatus.badge}`}>
                          {dbsStatus.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {staffData.dbsDate ? new Date(staffData.dbsDate).toLocaleDateString() : 'No date'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Visa / Right to Work</span>
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${visaStatus.badge}`}>
                          {visaStatus.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {staffData.visaExpiryDate ? new Date(staffData.visaExpiryDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Supervision Status</span>
                      <div className="flex items-center justify-between">
                        {staffData.supervisions?.[0]?.nextDueDate ? (
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                            new Date(staffData.supervisions[0].nextDueDate) < new Date()
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {new Date(staffData.supervisions[0].nextDueDate) < new Date() ? 'Overdue' : 'Due: ' + new Date(staffData.supervisions[0].nextDueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 italic">No supervision set</span>
                        )}
                        <span className="text-xs text-gray-500 font-medium">
                          {staffData.supervisions?.length || 0} recorded
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Appraisal Status</span>
                      <div className="flex items-center justify-between">
                        {staffData.appraisals?.[0]?.dueDate ? (
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                            new Date(staffData.appraisals[0].dueDate) < new Date()
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {new Date(staffData.appraisals[0].dueDate) < new Date() ? 'Overdue' : 'Due: ' + new Date(staffData.appraisals[0].dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 italic">No appraisal set</span>
                        )}
                        <span className="text-xs text-gray-500 font-medium">
                          {staffData.appraisals?.length || 0} recorded
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QUICK INFO MATRICES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#224fa6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Staff Contact & Identification
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500 block">Email Address:</span>
                          <span className="font-semibold text-gray-900 break-all">{staffData.email || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Primary Phone:</span>
                          <span className="font-semibold text-gray-900">{staffData.phoneNo || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Secondary Phone:</span>
                          <span className="font-semibold text-gray-900">{staffData.secondaryPhone || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Date of Birth:</span>
                          <span className="font-semibold text-gray-900">
                            {staffData.dob ? new Date(staffData.dob).toLocaleDateString() : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">National Insurance (NI):</span>
                          <span className="font-semibold text-gray-900">{staffData.niNumber || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Postal Code:</span>
                          <span className="font-semibold text-gray-900">{staffData.postalCode || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#224fa6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Employment & Compensation Summary
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500 block">Contracted Hours:</span>
                          <span className="font-semibold text-gray-900">{staffData.contractedHours ? `${staffData.contractedHours} hrs/wk` : '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Rate of Pay:</span>
                          <span className="font-semibold text-gray-900">{staffData.rateOfPay ? `£${staffData.rateOfPay}/hr` : '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Annual Salary:</span>
                          <span className="font-semibold text-gray-900">{staffData.salary ? `£${staffData.salary}` : '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Sleeping Nights:</span>
                          <span className="font-semibold text-gray-900">
                            {staffData.sleepingNights ? `Yes (Cost: £${staffData.costForSleepingNights || 0})` : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Start Date:</span>
                          <span className="font-semibold text-gray-900">
                            {staffData.startDate ? new Date(staffData.startDate).toLocaleDateString() : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Driving Licence:</span>
                          <span className="font-semibold text-gray-900">
                            {staffData.drivingLicenceValid ? 'Valid Licence' : 'None / Not recorded'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PERSONAL & CONTACT */}
              {activeTab === 'personal' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-gray-900 border-b pb-3">Personal and Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">First Name</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.firstName}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Last Name</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.lastName}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Username</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.username}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Email Address</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.email}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Primary Phone</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.phoneNo || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Secondary Phone</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.secondaryPhone || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Date of Birth</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.dob ? new Date(staffData.dob).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">NI Number</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.niNumber || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Consent to Email</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.consentToEmail ? 'Yes (Opted In)' : 'No'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-xs text-gray-500 block mb-1">Full Residential Address</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.address || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Postal Code</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.postalCode || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: EMPLOYMENT & PAY */}
              {activeTab === 'employment' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-gray-900 border-b pb-3">Employment, Hours & Compensation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Job Role</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.role?.displayName || staffData.role?.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Employee Number</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.employeeNumber || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Region</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.region?.title || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Employment Status</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.status}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Start Date</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.startDate ? new Date(staffData.startDate).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Leave Date</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.leaveDate ? new Date(staffData.leaveDate).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Contracted Hours PW</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.contractedHours ? `${staffData.contractedHours} hours` : '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Rate of Pay</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.rateOfPay ? `£${staffData.rateOfPay}/hr` : '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Salary</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.salary ? `£${staffData.salary}` : '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Sleeping Nights Eligible</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.sleepingNights ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Cost for Sleeping Nights</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.costForSleepingNights ? `£${staffData.costForSleepingNights}` : '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Reason for Leaving</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.reasonForLeaving || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: COMPLIANCE & DBS */}
              {activeTab === 'compliance' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="text-base font-bold text-gray-900">DBS Check & Regulatory Compliance</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${dbsStatus.badge}`}>
                      {dbsStatus.label}
                    </span>
                  </div>

                  <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong className="font-semibold block mb-0.5">Automated DBS Tracking Rule:</strong>
                      DBS checks are marked <span className="text-emerald-700 font-semibold">Green (In Date)</span> for the first 2.5 years, <span className="text-amber-700 font-semibold">Amber</span> when 6 months away from the 3-year expiry, and <span className="text-red-700 font-semibold">Red (Expired)</span> once 3 years have passed.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">DBS Check Date</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.dbsDate ? new Date(staffData.dbsDate).toLocaleDateString() : 'Not Set'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">DBS Update Service Code</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.dbsUpdateCode || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SUPERVISIONS */}
              {activeTab === 'supervisions' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Staff Supervisions History</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Periodic 1-to-1 supervision sessions and agreed objectives</p>
                    </div>
                    {isUserManager && (
                      <button
                        onClick={() => setShowLogSupervision(true)}
                        className="px-3.5 py-2 bg-[#224fa6] hover:bg-[#1a3a75] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Log Supervision</span>
                      </button>
                    )}
                  </div>

                  {staffData.supervisions && staffData.supervisions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-slate-100 text-gray-700 font-semibold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Supervisor</th>
                            <th className="py-2.5 px-3">Next Due Date</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Discussion / Notes</th>
                            <th className="py-2.5 px-3">Agreed Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {staffData.supervisions.map((s) => {
                            const isOverdue = s.nextDueDate && new Date(s.nextDueDate) < new Date();
                            return (
                              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3 font-semibold text-gray-900">
                                  {new Date(s.supervisionDate).toLocaleDateString()}
                                </td>
                                <td className="py-2.5 px-3 text-gray-700">{s.type || 'Regular'}</td>
                                <td className="py-2.5 px-3 text-gray-700">
                                  {s.supervisor ? `${s.supervisor.firstName} ${s.supervisor.lastName}` : '—'}
                                </td>
                                <td className="py-2.5 px-3">
                                  {s.nextDueDate ? (
                                    <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                                      {new Date(s.nextDueDate).toLocaleDateString()}
                                    </span>
                                  ) : '—'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isOverdue ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {isOverdue ? 'OVERDUE' : s.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">{s.discussionNotes || s.notes || '—'}</td>
                                <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">{s.actionAgreed || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs">No supervisions have been logged for this staff member yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: APPRAISALS */}
              {activeTab === 'appraisals' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Annual & Periodic Appraisals</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Evaluation of performance, rating, and strategic career objectives</p>
                    </div>
                    {isUserManager && (
                      <button
                        onClick={() => setShowLogAppraisal(true)}
                        className="px-3.5 py-2 bg-[#224fa6] hover:bg-[#1a3a75] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Log Appraisal</span>
                      </button>
                    )}
                  </div>

                  {staffData.appraisals && staffData.appraisals.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-slate-100 text-gray-700 font-semibold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Last Appraisal Date</th>
                            <th className="py-2.5 px-3">Date Due</th>
                            <th className="py-2.5 px-3">Appraiser</th>
                            <th className="py-2.5 px-3">Rating</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Feedback</th>
                            <th className="py-2.5 px-3">Goals</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {staffData.appraisals.map((a) => {
                            const isOverdue = a.dueDate && new Date(a.dueDate) < new Date();
                            return (
                              <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3 text-gray-900">
                                  {a.lastAppraisalDate ? new Date(a.lastAppraisalDate).toLocaleDateString() : '—'}
                                </td>
                                <td className="py-2.5 px-3 font-semibold">
                                  <span className={isOverdue ? 'text-red-600' : 'text-gray-900'}>
                                    {new Date(a.dueDate).toLocaleDateString()}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-gray-700">
                                  {a.appraiser ? `${a.appraiser.firstName} ${a.appraiser.lastName}` : '—'}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-gray-800">{a.rating || '—'}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isOverdue ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {isOverdue ? 'OVERDUE' : a.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">{a.feedback || '—'}</td>
                                <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">{a.goals || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs">No appraisals recorded for this staff member yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PROBATION */}
              {activeTab === 'probation' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Probation Reviews Tracker</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Initial employment probation milestones and performance confirmation</p>
                    </div>
                    {isUserManager && (
                      <button
                        onClick={() => setShowLogProbation(true)}
                        className="px-3.5 py-2 bg-[#224fa6] hover:bg-[#1a3a75] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Log Probation Review</span>
                      </button>
                    )}
                  </div>

                  {staffData.probations && staffData.probations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-slate-100 text-gray-700 font-semibold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Start Date</th>
                            <th className="py-2.5 px-3">Review Due Date</th>
                            <th className="py-2.5 px-3">Review Date</th>
                            <th className="py-2.5 px-3">Reviewer</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Outcome</th>
                            <th className="py-2.5 px-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {staffData.probations.map((p) => {
                            const isOverdue = p.status !== 'PASSED' && p.status !== 'FAILED' && p.dueDate && new Date(p.dueDate) < new Date();
                            return (
                              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3 text-gray-900">
                                  {p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'}
                                </td>
                                <td className="py-2.5 px-3 font-semibold">
                                  <span className={isOverdue ? 'text-red-600' : 'text-gray-900'}>
                                    {new Date(p.dueDate).toLocaleDateString()}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-gray-700">
                                  {p.reviewDate ? new Date(p.reviewDate).toLocaleDateString() : 'Pending'}
                                </td>
                                <td className="py-2.5 px-3 text-gray-700">
                                  {p.reviewer ? `${p.reviewer.firstName} ${p.reviewer.lastName}` : '—'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    p.status === 'PASSED' ? 'bg-emerald-100 text-emerald-700' : (isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')
                                  }`}>
                                    {isOverdue ? 'OVERDUE' : p.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-medium text-gray-800">{p.outcome || '—'}</td>
                                <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">{p.notes || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs">No probation review recorded for this staff member yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: SPONSORSHIP & VISA */}
              {activeTab === 'sponsorship' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Sponsorship & Right to Work</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Immigration status, CoS Certificate, Visa expiry tracking</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${visaStatus.badge}`}>
                      {visaStatus.label}
                    </span>
                  </div>

                  <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-100 text-xs text-amber-900 flex items-start gap-2">
                    <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <strong className="font-semibold block mb-0.5">Automated Visa Tracking Rule:</strong>
                      Visas are flagged <span className="text-emerald-700 font-semibold">Green (In Date)</span>, <span className="text-amber-700 font-semibold">Amber</span> when 3 months away from expiry, and <span className="text-red-700 font-semibold">Red</span> when expired.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Sponsorship Status</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.sponsorshipStatus || 'Not Specified'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Visa Expiry Date</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.visaExpiryDate ? new Date(staffData.visaExpiryDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Share Code</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.shareCode || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Certificate of Sponsorship (CoS)</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.cosNumber || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Visa Type / Category</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.visaType || 'Skilled Worker / Health & Care'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Passport Number</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.passportNumber || '—'}
                      </p>
                    </div>
                    <div className="md:col-span-3">
                      <span className="text-xs text-gray-500 block mb-1">Sponsorship Notes & Conditions</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200 whitespace-pre-wrap">
                        {staffData.sponsorshipNotes || 'No specific sponsorship notes on file.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: DRIVING DETAILS */}
              {activeTab === 'driving' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-gray-900 border-b pb-3">Staff Driving Details & Vehicle Registration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Valid Driving Licence</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.drivingLicenceValid ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Owns A Car</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.ownCar ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Car Registration</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200 font-mono">
                        {staffData.carRegistration || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Car Make</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.carMake || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Car Model</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.carModel || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Car Colour</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.carColour || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Car Insurance Verified</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.carInsuranceVerified ? 'Verified' : 'Pending / No'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Business Insurance</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.businessInsurance ? 'Covered' : 'Not Covered'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: NOK & MEDICAL */}
              {activeTab === 'health' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-gray-900 border-b pb-3">Next of Kin & Health / GP Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">NOK Name</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.emergencyName || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">NOK Relationship</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.nokRelationship || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">NOK Phone Number</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.emergencyContact || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Allergy Status</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.allergyStatus || 'None'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Vaccination Status</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.vaccinationStatus || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Pays for Prescriptions</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        {staffData.paysForPrescriptions ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="md:col-span-3">
                      <span className="text-xs text-gray-500 block mb-1">Known Allergies</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{staffData.allergies || 'None declared'}</p>
                    </div>
                    <div className="md:col-span-3">
                      <span className="text-xs text-gray-500 block mb-1">Registered GP Details</span>
                      <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200 whitespace-pre-wrap">{staffData.gpDetails || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PDP */}
              {activeTab === 'pdp' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Personal Development Plan (PDP)</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Identified learning areas, target completion dates and progress</p>
                    </div>
                    {isUserManager ? (
                      <button
                        onClick={() => setShowLogPdp(true)}
                        className="px-3.5 py-2 bg-[#224fa6] hover:bg-[#1a3a75] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add PDP Goal</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1.5 font-medium">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Read-Only (Managed by Management)
                      </span>
                    )}
                  </div>

                  {staffData.pdps && staffData.pdps.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-slate-100 text-gray-700 font-semibold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Date Identified</th>
                            <th className="py-2.5 px-3">Route Identified</th>
                            <th className="py-2.5 px-3">Development Area</th>
                            <th className="py-2.5 px-3">Person Responsible</th>
                            <th className="py-2.5 px-3">Target Date</th>
                            <th className="py-2.5 px-3">Progress</th>
                            <th className="py-2.5 px-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {staffData.pdps.map((p) => {
                            const isOverdue = p.progress !== 'COMPLETED' && p.targetDate && new Date(p.targetDate) < new Date();
                            return (
                              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3 text-gray-900">
                                  {p.dateIdentified ? new Date(p.dateIdentified).toLocaleDateString() : '—'}
                                </td>
                                <td className="py-2.5 px-3 text-gray-700">{p.routeIdentified || 'Supervision'}</td>
                                <td className="py-2.5 px-3 font-semibold text-gray-900">{p.area}</td>
                                <td className="py-2.5 px-3 text-gray-700">{p.personResponsible || '—'}</td>
                                <td className="py-2.5 px-3 font-semibold">
                                  {p.targetDate ? (
                                    <span className={isOverdue ? 'text-red-600' : 'text-gray-900'}>
                                      {new Date(p.targetDate).toLocaleDateString()}
                                    </span>
                                  ) : '—'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    p.progress === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : (isOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')
                                  }`}>
                                    {isOverdue ? 'OVERDUE' : p.progress.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">{p.notes || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs">No personal development objectives logged yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: WAGES & TIMESHEET */}
              {activeTab === 'wages' && (
                <div className="space-y-4">
                  {loadingWages ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                      <div className="w-8 h-8 border-3 border-[#224fa6] border-t-transparent rounded-full animate-spin"></div>
                      <span className="mt-2 text-xs">Loading payroll and timesheet data...</span>
                    </div>
                  ) : wageSheetData ? (
                    <StaffWageSheetView
                      wageSheet={wageSheetData}
                      isManager={isUserManager}
                      onDataChanged={fetchStaffWages}
                    />
                  ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-500">No wage or timesheet records found for this staff member.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Staff Member File: <strong className="text-gray-700">{staffData?.firstName} {staffData?.lastName}</strong> ({staffData?.employeeNumber || 'ID: ' + staffData?.id})
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* SUB-MODAL: LOG SUPERVISION */}
      {showLogSupervision && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Record Staff Supervision</h3>
            <form onSubmit={handleSaveSupervision} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Supervision Date *</label>
                  <input
                    type="date"
                    required
                    value={supervisionForm.supervisionDate}
                    onChange={e => setSupervisionForm({ ...supervisionForm, supervisionDate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Next Due Date</label>
                  <input
                    type="date"
                    value={supervisionForm.nextDueDate}
                    onChange={e => setSupervisionForm({ ...supervisionForm, nextDueDate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Supervision Type</label>
                  <select
                    value={supervisionForm.type}
                    onChange={e => setSupervisionForm({ ...supervisionForm, type: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="1-to-1 Regular">1-to-1 Regular</option>
                    <option value="Annual">Annual</option>
                    <option value="Probationary">Probationary</option>
                    <option value="Ad-hoc">Ad-hoc</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Status</label>
                  <select
                    value={supervisionForm.status}
                    onChange={e => setSupervisionForm({ ...supervisionForm, status: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Discussion Points & Notes</label>
                <textarea
                  rows={3}
                  value={supervisionForm.discussionNotes}
                  onChange={e => setSupervisionForm({ ...supervisionForm, discussionNotes: e.target.value })}
                  placeholder="Key items discussed during supervision session..."
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Action Agreed</label>
                <input
                  type="text"
                  value={supervisionForm.actionAgreed}
                  onChange={e => setSupervisionForm({ ...supervisionForm, actionAgreed: e.target.value })}
                  placeholder="Agreed follow-ups or targets..."
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogSupervision(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#224fa6] hover:bg-[#1a3a75] text-white font-semibold rounded-lg"
                >
                  {actionLoading ? 'Saving...' : 'Save Supervision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: LOG APPRAISAL */}
      {showLogAppraisal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Record Staff Appraisal</h3>
            <form onSubmit={handleSaveAppraisal} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Date of Last Appraisal</label>
                  <input
                    type="date"
                    value={appraisalForm.lastAppraisalDate}
                    onChange={e => setAppraisalForm({ ...appraisalForm, lastAppraisalDate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Date Next Due *</label>
                  <input
                    type="date"
                    required
                    value={appraisalForm.dueDate}
                    onChange={e => setAppraisalForm({ ...appraisalForm, dueDate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Overall Rating</label>
                  <select
                    value={appraisalForm.rating}
                    onChange={e => setAppraisalForm({ ...appraisalForm, rating: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="Outstanding">Outstanding</option>
                    <option value="Exceeds Expectations">Exceeds Expectations</option>
                    <option value="Meets Expectations">Meets Expectations</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Status</label>
                  <select
                    value={appraisalForm.status}
                    onChange={e => setAppraisalForm({ ...appraisalForm, status: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Feedback & Appraiser Remarks</label>
                <textarea
                  rows={2}
                  value={appraisalForm.feedback}
                  onChange={e => setAppraisalForm({ ...appraisalForm, feedback: e.target.value })}
                  placeholder="Appraisal summary and key feedback..."
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Development Goals</label>
                <input
                  type="text"
                  value={appraisalForm.goals}
                  onChange={e => setAppraisalForm({ ...appraisalForm, goals: e.target.value })}
                  placeholder="Key targets for the coming year..."
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogAppraisal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#224fa6] hover:bg-[#1a3a75] text-white font-semibold rounded-lg"
                >
                  {actionLoading ? 'Saving...' : 'Save Appraisal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: LOG PROBATION */}
      {showLogProbation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Record Probation Review</h3>
            <form onSubmit={handleSaveProbation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={probationForm.startDate}
                    onChange={e => setProbationForm({ ...probationForm, startDate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Review Due Date *</label>
                  <input
                    type="date"
                    required
                    value={probationForm.dueDate}
                    onChange={e => setProbationForm({ ...probationForm, dueDate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Status</label>
                  <select
                    value={probationForm.status}
                    onChange={e => setProbationForm({ ...probationForm, status: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="UNDER_PROBATION">Under Probation</option>
                    <option value="PASSED">Passed</option>
                    <option value="EXTENDED">Extended</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Outcome</label>
                  <input
                    type="text"
                    value={probationForm.outcome}
                    onChange={e => setProbationForm({ ...probationForm, outcome: e.target.value })}
                    placeholder="e.g. Passed, Extended 3 Mos..."
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Review Notes</label>
                <textarea
                  rows={3}
                  value={probationForm.notes}
                  onChange={e => setProbationForm({ ...probationForm, notes: e.target.value })}
                  placeholder="Review observations and feedback..."
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogProbation(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#224fa6] hover:bg-[#1a3a75] text-white font-semibold rounded-lg"
                >
                  {actionLoading ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: LOG PDP */}
      {showLogPdp && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Add Personal Development Objective</h3>
            <form onSubmit={handleSavePdp} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Date Identified</label>
                  <input
                    type="date"
                    value={pdpForm.dateIdentified}
                    onChange={e => setPdpForm({ ...pdpForm, dateIdentified: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Route Identified</label>
                  <input
                    type="text"
                    value={pdpForm.routeIdentified}
                    onChange={e => setPdpForm({ ...pdpForm, routeIdentified: e.target.value })}
                    placeholder="e.g. Supervision, Appraisal..."
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Development Area / Objective *</label>
                <input
                  type="text"
                  required
                  value={pdpForm.area}
                  onChange={e => setPdpForm({ ...pdpForm, area: e.target.value })}
                  placeholder="e.g. Medication Management, Manual Handling..."
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Person Responsible / Mentor</label>
                  <input
                    type="text"
                    value={pdpForm.personResponsible}
                    onChange={e => setPdpForm({ ...pdpForm, personResponsible: e.target.value })}
                    placeholder="Name of manager or mentor..."
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Target Date to Complete</label>
                  <input
                    type="date"
                    value={pdpForm.targetDate}
                    onChange={e => setPdpForm({ ...pdpForm, targetDate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Progress Status</label>
                <select
                  value={pdpForm.progress}
                  onChange={e => setPdpForm({ ...pdpForm, progress: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Notes & Progress Details</label>
                <textarea
                  rows={2}
                  value={pdpForm.notes}
                  onChange={e => setPdpForm({ ...pdpForm, notes: e.target.value })}
                  placeholder="Action steps or milestones..."
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogPdp(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#224fa6] hover:bg-[#1a3a75] text-white font-semibold rounded-lg"
                >
                  {actionLoading ? 'Saving...' : 'Save Objective'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
