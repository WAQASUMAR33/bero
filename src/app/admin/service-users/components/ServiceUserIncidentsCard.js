'use client';

import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, PlusCircle, ShieldAlert, Eye, Calendar, Clock, MapPin, UserCheck, ExternalLink, ChevronRight, X, Shield } from 'lucide-react';
import Link from 'next/link';

export default function ServiceUserIncidentsCard({ serviceSeekerId, serviceUserName, onNotification }) {
  const [incidents, setIncidents] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [incidentLocations, setIncidentLocations] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
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

  const fetchIncidents = async () => {
    if (!serviceSeekerId) return;
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [incRes, typesRes, locsRes, staffRes] = await Promise.all([
        fetch('/api/incident-fall-tasks', { headers }),
        fetch('/api/incident-types', { headers }),
        fetch('/api/incident-locations', { headers }),
        fetch('/api/users?status=CURRENT', { headers })
      ]);

      if (incRes.ok) {
        const allIncidents = await incRes.json();
        const residentIncidents = (Array.isArray(allIncidents) ? allIncidents : []).filter(
          i => i.serviceSeekerId === parseInt(serviceSeekerId, 10)
        );
        setIncidents(residentIncidents);
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
        const sData = await staffRes.json();
        setStaffList(Array.isArray(sData) ? sData : []);
      }
    } catch (err) {
      console.error('Error fetching service user incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [serviceSeekerId]);

  const stats = useMemo(() => {
    let falls = 0;
    let injuries = 0;
    let hospital = 0;

    incidents.forEach(inc => {
      const typeName = inc.incidentType?.name?.toLowerCase() || '';
      if (typeName.includes('fall')) falls += 1;
      if (inc.serviceUserInjured === 'YES' || inc.injuryDetail) injuries += 1;
      if (inc.contactsCalled === 'EMERGENCY_SERVICES' || inc.contactsCalled === 'GP_OR_DOCTOR' || (inc.notes || '').toLowerCase().includes('hospital')) {
        hospital += 1;
      }
    });

    return {
      total: incidents.length,
      falls,
      injuries,
      hospital
    };
  }, [incidents]);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        serviceSeekerId: parseInt(serviceSeekerId, 10),
        incidentTypeId: parseInt(form.incidentTypeId, 10),
        locationId: parseInt(form.locationId, 10),
        witnessedByStaffId: form.witnessedByStaffId ? parseInt(form.witnessedByStaffId, 10) : null,
      };

      const res = await fetch('/api/incident-fall-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to log accident/incident');
      }

      if (onNotification) {
        onNotification({ show: true, message: 'Accident / Incident logged successfully and collated into tracker!', type: 'success' });
      }
      setShowLogModal(false);
      fetchIncidents();
    } catch (err) {
      console.error(err);
      if (onNotification) {
        onNotification({ show: true, message: err.message, type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden mt-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md"><AlertTriangle className="w-5 h-5" /></div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">Accidents & Incidents Tracker</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                {incidents.length} Logged
              </span>
            </div>
            <p className="text-xs text-rose-100 mt-0.5">
              Individual safety records for {serviceUserName || 'this resident'} (collated into central hub)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/incidents"
            className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition-all"
          >
            <span>Central Hub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-red-600" />
            <span>Log Accident / Fall</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 border-b border-gray-200 text-xs">
        <div className="bg-white p-3 rounded-xl border border-gray-200">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Incidents</p>
          <p className="text-xl font-black text-gray-900 mt-0.5">{stats.total}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-rose-200">
          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Falls Recorded</p>
          <p className="text-xl font-black text-rose-700 mt-0.5">{stats.falls}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-amber-200">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Injuries Sustained</p>
          <p className="text-xl font-black text-amber-700 mt-0.5">{stats.injuries}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-blue-200">
          <p className="text-[10px] font-bold text-[#173a7a] uppercase tracking-wider">Emergency Calls</p>
          <p className="text-xl font-black text-[#224fa6] mt-0.5">{stats.hospital}</p>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="p-4">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-gray-500">Loading accident & incident logs...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl space-y-2">
            <Shield className="w-8 h-8 text-gray-400 mx-auto" />
            <h4 className="font-bold text-sm text-gray-800">No accidents or falls on record</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No accidents, falls, or safety incidents have been reported for {serviceUserName || 'this resident'}.
            </p>
            <button
              onClick={() => setShowLogModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Log Incident
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Incident Type</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Injury Status</th>
                  <th className="py-2.5 px-3">Witnessed By</th>
                  <th className="py-2.5 px-3">Brief Overview</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {incidents.map((inc) => {
                  const incDate = new Date(inc.date);
                  const isInjured = inc.serviceUserInjured === 'YES' || inc.injuryDetail;

                  return (
                    <tr key={inc.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-gray-900">
                        {incDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <span className="block text-[10px] text-gray-500 font-normal">{inc.time}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          {inc.incidentType?.name || 'Incident / Fall'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-gray-600">
                        {inc.location?.name || 'Care Home'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isInjured ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 ring-1 ring-red-300">
                            Injured
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            No Injury
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-gray-600">
                        {inc.witnessedByStaff ? `${inc.witnessedByStaff.firstName} ${inc.witnessedByStaff.lastName}` : (inc.witnessedBy?.replace(/_/g, ' ') || 'Staff')}
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-gray-700">
                        {inc.howIncidentHappened || inc.whatResidentDoing || inc.notes || '-'}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedIncident(inc)}
                          className="px-2.5 py-1 text-[#224fa6] hover:bg-blue-50 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          View Details
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

      {/* Log Accident / Incident Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-white/10 rounded-xl backdrop-blur-md"><AlertTriangle className="w-5 h-5" /></span>
                <div>
                  <h3 className="font-bold text-lg">Log Accident / Incident</h3>
                  <p className="text-xs text-rose-100">Service User: <strong>{serviceUserName}</strong></p>
                </div>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Time *</label>
                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Incident Type *</label>
                  <select
                    required
                    value={form.incidentTypeId}
                    onChange={(e) => setForm({ ...form, incidentTypeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  >
                    {incidentTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Location *</label>
                  <select
                    required
                    value={form.locationId}
                    onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  >
                    {incidentLocations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Service User Injured?</label>
                  <select
                    value={form.serviceUserInjured}
                    onChange={(e) => setForm({ ...form, serviceUserInjured: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  >
                    <option value="NO">No</option>
                    <option value="YES">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Witnessed by Staff</label>
                  <select
                    value={form.witnessedByStaffId}
                    onChange={(e) => setForm({ ...form, witnessedByStaffId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  >
                    <option value="">-- None / Select Staff --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {form.serviceUserInjured === 'YES' && (
                <div>
                  <label className="block text-xs font-bold text-red-700 mb-1">Injury Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Minor graze on left elbow, bruising..."
                    value={form.injuryDetail}
                    onChange={(e) => setForm({ ...form, injuryDetail: e.target.value })}
                    className="w-full px-3 py-2 border border-red-300 rounded-xl text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">How Incident Happened *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detail the circumstances, sequence of events, and observations..."
                  value={form.howIncidentHappened}
                  onChange={(e) => setForm({ ...form, howIncidentHappened: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Actions Taken & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Immediate first aid given, senior staff informed, observations..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Logging Incident...' : 'Save Incident Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Incident Details</h3>
                <p className="text-xs text-rose-100">{new Date(selectedIncident.date).toLocaleDateString('en-GB')} at {selectedIncident.time}</p>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-gray-100">
                <div>
                  <span className="font-bold text-gray-500">Incident Type:</span>
                  <p className="font-semibold text-gray-900">{selectedIncident.incidentType?.name || 'Incident'}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-500">Location:</span>
                  <p className="font-semibold text-gray-900">{selectedIncident.location?.name || 'Property'}</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-gray-500">How Incident Happened:</span>
                <p className="mt-1 p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-800">
                  {selectedIncident.howIncidentHappened || 'No description recorded'}
                </p>
              </div>

              {selectedIncident.serviceUserInjured === 'YES' && (
                <div>
                  <span className="font-bold text-red-600">Injury Description:</span>
                  <p className="mt-1 p-2.5 bg-red-50 rounded-xl border border-red-200 text-red-800">
                    {selectedIncident.injuryDetail || 'Injured - no additional details'}
                  </p>
                </div>
              )}

              <div>
                <span className="font-bold text-gray-500">Actions Taken & Follow-up Notes:</span>
                <p className="mt-1 p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-800">
                  {selectedIncident.notes || 'None noted'}
                </p>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
