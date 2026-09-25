'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';
import { isManager } from '@/lib/permissions';

export default function AccidentsIncidentsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [serviceUsers, setServiceUsers] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [incidentLocations, setIncidentLocations] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterServiceUser, setFilterServiceUser] = useState('ALL');
  const [filterInjury, setFilterInjury] = useState('ALL'); // ALL | YES | NO
  const [activeTab, setActiveTab] = useState('all'); // all | falls | injuries | severe | analytics
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Detail Modal
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // New Incident Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    incidentTypeId: '',
    locationId: '',
    incidentLasted: 'A few minutes',
    serviceUserInjured: 'NO',
    injuryDetail: '',
    whatResidentDoing: '',
    howIncidentHappened: '',
    witnessedBy: 'WITNESSED_BY_STAFF',
    witnessedByStaffId: '',
    witnessDetail: '',
    othersInvolved: false,
    othersInvolvedDetails: '',
    equipmentInvolved: 'NO',
    relativesInformed: 'YES',
    contactsCalled: 'NONE',
    emotion: 'CALM',
    photoConsent: 'NO',
    residentInfoProvided: 'YES',
    notes: ''
  });

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [incRes, suRes, typesRes, locsRes, staffRes] = await Promise.all([
        fetch('/api/incident-fall-tasks', { headers }),
        fetch('/api/service-seekers', { headers }),
        fetch('/api/incident-types', { headers }),
        fetch('/api/incident-locations', { headers }),
        fetch('/api/users?status=CURRENT', { headers })
      ]);

      if (incRes.ok) {
        const incData = await incRes.json();
        setIncidents(Array.isArray(incData) ? incData : []);
      }

      if (suRes.ok) {
        const suData = await suRes.json();
        const activeSu = (Array.isArray(suData) ? suData : []).filter(
          s => !s.status || s.status === 'LIVE' || s.status === 'PRE_ADMISSION'
        );
        setServiceUsers(activeSu);
        if (activeSu.length > 0 && !form.serviceSeekerId) {
          setForm(prev => ({ ...prev, serviceSeekerId: activeSu[0].id.toString() }));
        }
      }

      if (typesRes.ok) {
        const tData = await typesRes.json();
        setIncidentTypes(Array.isArray(tData) ? tData : []);
        if (tData.length > 0 && !form.incidentTypeId) {
          setForm(prev => ({ ...prev, incidentTypeId: tData[0].id.toString() }));
        }
      }

      if (locsRes.ok) {
        const lData = await locsRes.json();
        setIncidentLocations(Array.isArray(lData) ? lData : []);
        if (lData.length > 0 && !form.locationId) {
          setForm(prev => ({ ...prev, locationId: lData[0].id.toString() }));
        }
      }

      if (staffRes.ok) {
        const stData = await staffRes.json();
        setStaffList(Array.isArray(stData) ? stData : []);
      }
    } catch (err) {
      console.error('Error fetching incidents data:', err);
      showToast('Error loading accidents & incidents data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
    fetchData();
  }, []);

  // Filtered List
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const residentName = `${inc.serviceSeeker?.firstName || ''} ${inc.serviceSeeker?.lastName || ''}`.toLowerCase();
      const typeName = inc.incidentType?.type?.toLowerCase() || '';
      const notes = inc.notes?.toLowerCase() || '';
      const how = inc.howIncidentHappened?.toLowerCase() || '';
      const searchMatch = !searchTerm || residentName.includes(searchTerm.toLowerCase()) || typeName.includes(searchTerm.toLowerCase()) || notes.includes(searchTerm.toLowerCase()) || how.includes(searchTerm.toLowerCase());

      const typeMatch = filterType === 'ALL' || inc.incidentTypeId?.toString() === filterType;
      const suMatch = filterServiceUser === 'ALL' || inc.serviceSeekerId?.toString() === filterServiceUser;
      
      const isInjured = inc.serviceUserInjured === 'YES' || Boolean(inc.injuryDetail);
      const injuryMatch = filterInjury === 'ALL' || (filterInjury === 'YES' && isInjured) || (filterInjury === 'NO' && !isInjured);

      if (!searchMatch || !typeMatch || !suMatch || !injuryMatch) return false;

      if (activeTab === 'falls') {
        return typeName.includes('fall');
      }
      if (activeTab === 'injuries') {
        return isInjured;
      }
      if (activeTab === 'severe') {
        return isInjured || inc.contactsCalled === 'DOCTOR' || inc.contactsCalled === 'EMERGENCY_SERVICES' || inc.relativesInformed === 'YES';
      }

      return true;
    });
  }, [incidents, searchTerm, filterType, filterServiceUser, filterInjury, activeTab]);

  // KPIs
  const totalIncidents = incidents.length;
  const fallIncidents = incidents.filter(i => (i.incidentType?.type || '').toLowerCase().includes('fall')).length;
  const injuredCount = incidents.filter(i => i.serviceUserInjured === 'YES' || Boolean(i.injuryDetail)).length;
  const emergencyCallsCount = incidents.filter(i => i.contactsCalled === 'EMERGENCY_SERVICES' || i.contactsCalled === 'DOCTOR').length;

  const handleSaveIncident = async (e) => {
    e.preventDefault();
    if (!form.serviceSeekerId || !form.incidentTypeId || !form.locationId) {
      showToast('Please select resident, incident type, and location.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        serviceSeekerId: parseInt(form.serviceSeekerId),
        incidentTypeId: parseInt(form.incidentTypeId),
        locationId: parseInt(form.locationId),
        witnessedByStaffId: form.witnessedByStaffId ? parseInt(form.witnessedByStaffId) : null,
        othersInvolved: Boolean(form.othersInvolved)
      };

      const res = await fetch('/api/incident-fall-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Accident / Incident logged successfully!', 'success');
        setShowNewModal(false);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to record incident', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while saving incident', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateInvestigation = (incident) => {
    const residentName = `${incident.serviceSeeker?.firstName || ''} ${incident.serviceSeeker?.lastName || ''}`.trim();
    const type = incident.incidentType?.type || 'Incident';
    const title = `Investigation into ${type} involving ${residentName} on ${new Date(incident.date).toLocaleDateString()}`;
    router.push(`/admin/investigations?new=true&title=${encodeURIComponent(title)}&serviceUser=${encodeURIComponent(residentName)}&ref=${incident.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {notification.show && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification({ ...notification, show: false })}
            />
          )}

          {/* PAGE BANNER */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 text-white rounded-xl shadow-md">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
                    Accidents & Incidents Tracker
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Centralized management and auditing register for all falls, injuries, adverse events, and near misses across the service.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => router.push('/admin/investigations')}
                className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                <span>Investigations Hub</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Log New Incident</span>
              </button>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Recorded</span>
                <span className="text-2xl font-black text-slate-900">{totalIncidents}</span>
                <span className="text-[11px] text-slate-400 block">Organization-wide</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">Falls & Slips</span>
                <span className="text-2xl font-black text-amber-700">{fallIncidents}</span>
                <span className="text-[11px] text-amber-600/80 block">Mobility incidents</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider block">Injuries Sustained</span>
                <span className="text-2xl font-black text-rose-700">{injuredCount}</span>
                <span className="text-[11px] text-rose-600/80 block">First aid / medical</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider block">Emergency Escalations</span>
                <span className="text-2xl font-black text-purple-700">{emergencyCallsCount}</span>
                <span className="text-[11px] text-purple-600/80 block">Doctor / 999 / 111</span>
              </div>
            </div>
          </div>

          {/* VIEW TABS */}
          <div className="mb-4 bg-white p-1.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All Incidents (${totalIncidents})`, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { id: 'falls', label: `Falls & Slips (${fallIncidents})`, icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { id: 'injuries', label: `Injuries & First Aid (${injuredCount})`, icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
              { id: 'severe', label: `High Severity & Alerts`, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search resident, incident type, details, location..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterServiceUser}
                onChange={e => setFilterServiceUser(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                <option value="ALL">All Service Users</option>
                {serviceUsers.map(su => (
                  <option key={su.id} value={su.id}>{su.firstName} {su.lastName}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                <option value="ALL">All Incident Types</option>
                {incidentTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.type}</option>
                ))}
              </select>

              <select
                value={filterInjury}
                onChange={e => setFilterInjury(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                <option value="ALL">All Outcomes</option>
                <option value="YES">Injured Only</option>
                <option value="NO">No Injury Reported</option>
              </select>
            </div>
          </div>

          {/* INCIDENTS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Date & Time</th>
                    <th className="px-5 py-3.5">Service User</th>
                    <th className="px-5 py-3.5">Type & Location</th>
                    <th className="px-5 py-3.5">Injury Status</th>
                    <th className="px-5 py-3.5">Witness & Staff</th>
                    <th className="px-5 py-3.5">Contacts Called</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-red-600 border-t-transparent mb-2"></div>
                        <p className="font-medium text-xs">Loading incident records...</p>
                      </td>
                    </tr>
                  ) : filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">
                        <svg className="w-12 h-12 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-semibold text-slate-700 text-sm">No incidents or accidents found</p>
                        <p className="text-xs text-slate-400 mt-1">Adjust filters or record a new incident using the button above.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map(inc => {
                      const isInjured = inc.serviceUserInjured === 'YES' || Boolean(inc.injuryDetail);
                      const residentName = `${inc.serviceSeeker?.firstName || 'Unknown'} ${inc.serviceSeeker?.lastName || ''}`.trim();
                      const type = inc.incidentType?.type || 'Incident';
                      const loc = inc.location?.location || inc.location?.name || 'Unspecified Location';

                      return (
                        <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block">
                              {inc.date ? new Date(inc.date).toLocaleDateString() : '—'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {inc.time || 'Time not logged'}
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => inc.serviceSeekerId && router.push(`/admin/service-users/${inc.serviceSeekerId}/admission`)}
                              className="font-bold text-[#224fa6] hover:underline flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>{residentName}</span>
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </button>
                            <span className="text-[11px] text-slate-400 block">
                              ID: #{inc.serviceSeekerId}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                              type.toLowerCase().includes('fall')
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}>
                              {type}
                            </span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {loc}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            {isInjured ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                  Injured
                                </span>
                                {inc.injuryDetail && (
                                  <span className="text-[11px] text-slate-600 block mt-1 line-clamp-1 max-w-xs" title={inc.injuryDetail}>
                                    {inc.injuryDetail}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                No Injury
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                            <div>
                              <span className="font-medium text-slate-900 block">
                                {inc.witnessedByStaff ? `${inc.witnessedByStaff.firstName} ${inc.witnessedByStaff.lastName}` : (inc.witnessedBy || 'Not logged')}
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                Logged by: {inc.createdBy?.firstName || 'Staff'}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                              inc.contactsCalled === 'EMERGENCY_SERVICES'
                                ? 'bg-red-100 text-red-800 font-bold'
                                : inc.contactsCalled === 'DOCTOR'
                                ? 'bg-purple-100 text-purple-800 font-bold'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {inc.contactsCalled || 'None'}
                            </span>
                            {inc.relativesInformed === 'YES' && (
                              <span className="text-[11px] text-emerald-700 block mt-0.5 font-medium">Relatives informed</span>
                            )}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedIncident(inc);
                                setShowDetailModal(true);
                              }}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-all cursor-pointer"
                            >
                              View Details
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCreateInvestigation(inc)}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-all cursor-pointer"
                              title="Investigate Incident"
                            >
                              Investigate
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* INCIDENT DETAILS MODAL */}
          {showDetailModal && selectedIncident && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-red-500/20 text-red-300 rounded-lg border border-red-400/30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </span>
                    <div>
                      <h3 className="font-bold text-base">Incident & Accident Record #{selectedIncident.id}</h3>
                      <p className="text-xs text-slate-300">
                        {selectedIncident.serviceSeeker?.firstName} {selectedIncident.serviceSeeker?.lastName} • {new Date(selectedIncident.date).toLocaleDateString()} at {selectedIncident.time}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDetailModal(false)}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Incident Type</span>
                      <span className="font-bold text-slate-900">{selectedIncident.incidentType?.type || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Location</span>
                      <span className="font-bold text-slate-900">{selectedIncident.location?.location || selectedIncident.location?.name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Duration</span>
                      <span className="font-bold text-slate-900">{selectedIncident.incidentLasted || 'A few minutes'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Service User Injured</span>
                      <span className={`font-bold ${selectedIncident.serviceUserInjured === 'YES' ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {selectedIncident.serviceUserInjured || 'NO'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Witnessed By</span>
                      <span className="font-bold text-slate-900">{selectedIncident.witnessedByStaff ? `${selectedIncident.witnessedByStaff.firstName} ${selectedIncident.witnessedByStaff.lastName}` : (selectedIncident.witnessedBy || 'Staff')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Emergency Services</span>
                      <span className="font-bold text-slate-900">{selectedIncident.contactsCalled || 'None'}</span>
                    </div>
                  </div>

                  {selectedIncident.injuryDetail && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                      <span className="font-bold text-rose-900 text-[11px] block mb-1">Injury & First Aid Detail</span>
                      <p className="text-rose-800 leading-relaxed">{selectedIncident.injuryDetail}</p>
                    </div>
                  )}

                  {selectedIncident.howIncidentHappened && (
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">How Incident Happened</span>
                      <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed">
                        {selectedIncident.howIncidentHappened}
                      </p>
                    </div>
                  )}

                  {selectedIncident.whatResidentDoing && (
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">What Resident Was Doing</span>
                      <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed">
                        {selectedIncident.whatResidentDoing}
                      </p>
                    </div>
                  )}

                  {selectedIncident.notes && (
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Action Taken & Observations</span>
                      <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {selectedIncident.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-slate-500 text-[11px]">
                    <span>Recorded by: {selectedIncident.createdBy?.firstName || 'System'}</span>
                    <span>Created: {new Date(selectedIncident.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleCreateInvestigation(selectedIncident)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Open Investigation
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LOG NEW INCIDENT MODAL */}
          {showNewModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-white/20 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </span>
                    <h3 className="font-bold text-base">Record Accident / Incident</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSaveIncident} className="p-6 overflow-y-auto space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Service User *</label>
                      <select
                        value={form.serviceSeekerId}
                        onChange={e => setForm({ ...form, serviceSeekerId: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden"
                      >
                        <option value="">Select resident...</option>
                        {serviceUsers.map(su => (
                          <option key={su.id} value={su.id}>{su.firstName} {su.lastName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Incident Type *</label>
                      <select
                        value={form.incidentTypeId}
                        onChange={e => setForm({ ...form, incidentTypeId: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden"
                      >
                        <option value="">Select type...</option>
                        {incidentTypes.map(t => (
                          <option key={t.id} value={t.id}>{t.type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Date *</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={e => setForm({ ...form, date: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Time *</label>
                      <input
                        type="time"
                        value={form.time}
                        onChange={e => setForm({ ...form, time: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Location *</label>
                      <select
                        value={form.locationId}
                        onChange={e => setForm({ ...form, locationId: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden"
                      >
                        <option value="">Select location...</option>
                        {incidentLocations.map(l => (
                          <option key={l.id} value={l.id}>{l.location || l.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Was Service User Injured? *</label>
                      <select
                        value={form.serviceUserInjured}
                        onChange={e => setForm({ ...form, serviceUserInjured: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden"
                      >
                        <option value="NO">No Injury</option>
                        <option value="YES">Yes, Injured</option>
                      </select>
                    </div>
                  </div>

                  {form.serviceUserInjured === 'YES' && (
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Injury Detail & First Aid Administered</label>
                      <input
                        type="text"
                        placeholder="e.g. Minor graze to left elbow, cleansed with saline, dressing applied"
                        value={form.injuryDetail}
                        onChange={e => setForm({ ...form, injuryDetail: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Witnessed by Staff Member</label>
                      <select
                        value={form.witnessedByStaffId}
                        onChange={e => setForm({ ...form, witnessedByStaffId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden"
                      >
                        <option value="">Un-witnessed / Select staff member...</option>
                        {staffList.map(st => (
                          <option key={st.id} value={st.id}>{st.firstName} {st.lastName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Emergency / Doctor Called</label>
                      <select
                        value={form.contactsCalled}
                        onChange={e => setForm({ ...form, contactsCalled: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden"
                      >
                        <option value="NONE">None</option>
                        <option value="DOCTOR">GP / 111 Contacted</option>
                        <option value="EMERGENCY_SERVICES">Emergency Services (999 / Ambulance)</option>
                        <option value="OTHER">Other Professional</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">How Did The Incident Happen?</label>
                    <textarea
                      rows={2}
                      placeholder="Describe what occurred leading up to and during the incident..."
                      value={form.howIncidentHappened}
                      onChange={e => setForm({ ...form, howIncidentHappened: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Immediate Actions Taken & Follow-up Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Immediate care provided, safety checks, monitoring plan, vitals taken..."
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowNewModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs hover:shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Incident'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
