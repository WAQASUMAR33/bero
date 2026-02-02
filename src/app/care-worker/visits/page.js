'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VisitsPage() {
    const router = useRouter();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('upcoming'); // upcoming, history, all
    const [serviceSeeker, setServiceSeeker] = useState(null);
    const [notClockedIn, setNotClockedIn] = useState(false);
    const [error, setError] = useState(null);

    // Modal states
    const [showReportModal, setShowReportModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Report form state
    const [reportForm, setReportForm] = useState({
        name: '',
        visitType: 'FAMILY',
        role: '',
        relationship: '',
        purpose: '',
        summary: '',
        time: '',
        date: new Date().toISOString().split('T')[0]
    });

    const professionalRoles = [
        { value: 'GP', label: 'GP' },
        { value: 'DISTRICT_NURSE', label: 'District Nurse' },
        { value: 'SOCIAL_WORKER', label: 'Social Worker' },
        { value: 'PARAMEDIC', label: 'Paramedic' },
        { value: 'CHIROPODIST', label: 'Chiropodist' },
        { value: 'MANAGER', label: 'Manager' },
        { value: 'CLINICAL_PSYCHOLOGIST', label: 'Clinical Psychologist' },
        { value: 'SALT', label: 'SALT' },
        { value: 'DOLS', label: 'DoLS' },
        { value: 'OTHER', label: 'Other' }
    ];

    useEffect(() => {
        fetchVisits();
    }, [filterStatus]);

    const fetchVisits = async () => {
        try {
            setLoading(true);
            setError(null);
            setNotClockedIn(false);

            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/care-worker-login');
                return;
            }

            const response = await fetch(`/api/mobile/visits?status=${filterStatus}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                setVisits(data.data || []);
                setServiceSeeker(data.serviceSeeker);
            } else if (data.notClockedIn) {
                setNotClockedIn(true);
                setVisits([]);
            } else {
                setError(data.error || 'Failed to fetch visits');
            }
        } catch (err) {
            console.error('Error fetching visits:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkVisit = async (visitId, completed) => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/mobile/visits/${visitId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed })
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMessage(data.message);
                fetchVisits();
                setShowDetailsModal(false);
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to update visit');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReportVisit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');

            const response = await fetch('/api/mobile/visits', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportForm)
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMessage(data.message);
                setShowReportModal(false);
                setReportForm({
                    name: '',
                    visitType: 'FAMILY',
                    role: '',
                    relationship: '',
                    purpose: '',
                    summary: '',
                    time: '',
                    date: new Date().toISOString().split('T')[0]
                });
                fetchVisits();
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to report visit');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        return timeStr.slice(0, 5);
    };

    const getVisitTypeLabel = (entryType) => {
        if (entryType === 'FAMILY_VISIT') return 'Family';
        if (entryType === 'PROFESSIONAL_VISIT') return 'Professional';
        return 'Visit';
    };

    const getStatusBadge = (visit) => {
        if (visit.completed === 'YES') {
            return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700 border border-green-200">Completed</span>;
        }
        if (visit.completed === 'NO') {
            return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200">Missed</span>;
        }
        const visitDate = new Date(visit.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (visitDate < today) {
            return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">Past</span>;
        }
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700 border border-blue-200">Scheduled</span>;
    };

    const upcomingCount = visits.filter(v => !v.completed).length;
    const completedCount = visits.filter(v => v.completed === 'YES').length;

    // Not clocked in state
    if (notClockedIn) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Clocked In</h2>
                    <p className="text-gray-600 mb-6 max-w-md">
                        You need to clock in to a shift before you can view or manage visits for a service user.
                    </p>
                    <button
                        onClick={() => router.push('/care-worker')}
                        className="bg-[#224fa6] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1e438f] transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-green-800 font-medium">{successMessage}</p>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Visits</h1>
                    {serviceSeeker && (
                        <p className="text-sm text-gray-500">
                            For: <span className="font-medium text-gray-700">
                                {serviceSeeker.preferredName || `${serviceSeeker.firstName} ${serviceSeeker.lastName}`}
                            </span>
                        </p>
                    )}
                </div>
                <button
                    onClick={() => setShowReportModal(true)}
                    className="bg-[#224fa6] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#1e438f] transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Report Visit
                </button>
            </div>

            {/* Stats / Filters */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { key: 'upcoming', label: 'Upcoming', count: upcomingCount, color: 'blue' },
                    { key: 'history', label: 'History', count: completedCount, color: 'green' },
                    { key: 'all', label: 'All', count: visits.length, color: 'gray' }
                ].map((item) => (
                    <button
                        key={item.key}
                        onClick={() => setFilterStatus(item.key)}
                        className={`p-4 rounded-xl border transition-all text-left group ${filterStatus === item.key
                            ? 'bg-blue-50 border-[#224fa6] ring-1 ring-[#224fa6]'
                            : 'bg-white border-gray-100 hover:border-blue-100 hover:shadow-sm'
                            }`}
                    >
                        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${filterStatus === item.key ? 'text-[#224fa6]' : 'text-gray-400 group-hover:text-[#224fa6]'
                            }`}>
                            {item.label}
                        </p>
                        <p className={`text-2xl font-bold ${filterStatus === item.key ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                            {item.count}
                        </p>
                    </button>
                ))}
            </div>

            {/* Visits List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]" />
                    </div>
                ) : visits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No visits found</h3>
                        <p className="text-gray-500 text-sm mt-1 mb-6">
                            {filterStatus === 'upcoming'
                                ? 'No upcoming visits scheduled.'
                                : 'No visits in this category.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {visits.map((visit) => (
                            <div
                                key={visit.id}
                                onClick={() => {
                                    setSelectedVisit(visit);
                                    setShowDetailsModal(true);
                                }}
                                className="p-5 hover:bg-gray-50/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${visit.entryType === 'FAMILY_VISIT'
                                            ? 'bg-pink-100 text-pink-600'
                                            : 'bg-purple-100 text-purple-600'
                                            }`}>
                                            {visit.entryType === 'FAMILY_VISIT' ? (
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="font-bold text-gray-900">{visit.name || 'Visitor'}</h3>
                                                {getStatusBadge(visit)}
                                                {visit.announced === 'NO' && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700 border border-yellow-200">Unannounced</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {getVisitTypeLabel(visit.entryType)}
                                                {visit.relationship && ` • ${visit.relationship}`}
                                                {visit.role && ` • ${visit.role.replace(/_/g, ' ')}`}
                                            </p>
                                            {visit.purpose && (
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{visit.purpose}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-semibold text-gray-900">{formatDate(visit.date)}</p>
                                        <p className="text-sm text-gray-500">{formatTime(visit.time)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Report Visit Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Report Unscheduled Visit</h2>
                                <p className="text-sm text-gray-500 mt-1">Record a visitor who arrived without prior notice</p>
                            </div>
                            <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleReportVisit} className="p-6 overflow-y-auto flex-1 space-y-4">
                            {/* Visit Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Visit Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['FAMILY', 'PROFESSIONAL'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setReportForm({ ...reportForm, visitType: type })}
                                            className={`p-4 rounded-xl border-2 transition-all ${reportForm.visitType === type
                                                ? 'border-[#224fa6] bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <p className={`font-bold ${reportForm.visitType === type ? 'text-[#224fa6]' : 'text-gray-700'}`}>
                                                {type === 'FAMILY' ? '👨‍👩‍👧 Family' : '👔 Professional'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Visitor Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Visitor Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={reportForm.name}
                                    onChange={(e) => setReportForm({ ...reportForm, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                                    placeholder="Enter visitor's name"
                                />
                            </div>

                            {/* Relationship (for Family) or Role (for Professional) */}
                            {reportForm.visitType === 'FAMILY' ? (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship</label>
                                    <input
                                        type="text"
                                        value={reportForm.relationship}
                                        onChange={(e) => setReportForm({ ...reportForm, relationship: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                                        placeholder="e.g., Son, Daughter, Friend"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                                    <select
                                        value={reportForm.role}
                                        onChange={(e) => setReportForm({ ...reportForm, role: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white"
                                    >
                                        <option value="">Select role...</option>
                                        {professionalRoles.map((role) => (
                                            <option key={role.value} value={role.value}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={reportForm.date}
                                        onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                                    <input
                                        type="time"
                                        value={reportForm.time}
                                        onChange={(e) => setReportForm({ ...reportForm, time: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Purpose */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose of Visit</label>
                                <input
                                    type="text"
                                    value={reportForm.purpose}
                                    onChange={(e) => setReportForm({ ...reportForm, purpose: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                                    placeholder="e.g., Social visit, Medical checkup"
                                />
                            </div>

                            {/* Summary */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Summary / Notes</label>
                                <textarea
                                    value={reportForm.summary}
                                    onChange={(e) => setReportForm({ ...reportForm, summary: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent resize-none"
                                    placeholder="Add any relevant notes about the visit..."
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !reportForm.name.trim()}
                                className="w-full py-3 rounded-xl bg-[#224fa6] text-white font-bold hover:bg-[#1e438f] shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Report Visit
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Visit Details Modal */}
            {showDetailsModal && selectedVisit && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-start p-6 border-b border-gray-100">
                            <div className="flex items-start gap-4">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedVisit.entryType === 'FAMILY_VISIT'
                                    ? 'bg-pink-100 text-pink-600'
                                    : 'bg-purple-100 text-purple-600'
                                    }`}>
                                    {selectedVisit.entryType === 'FAMILY_VISIT' ? (
                                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedVisit.name || 'Visitor'}</h2>
                                    <p className="text-sm text-gray-500">
                                        {getVisitTypeLabel(selectedVisit.entryType)}
                                        {selectedVisit.relationship && ` • ${selectedVisit.relationship}`}
                                        {selectedVisit.role && ` • ${selectedVisit.role.replace(/_/g, ' ')}`}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {/* Status */}
                            <div className="flex items-center gap-2">
                                {getStatusBadge(selectedVisit)}
                                {selectedVisit.announced === 'NO' && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700 border border-yellow-200">Unannounced</span>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Date</p>
                                    <p className="text-sm font-semibold text-gray-900">{formatDate(selectedVisit.date)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Time</p>
                                    <p className="text-sm font-semibold text-gray-900">{formatTime(selectedVisit.time) || 'Not set'}</p>
                                </div>
                            </div>

                            {selectedVisit.purpose && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Purpose</p>
                                    <p className="text-sm text-gray-900">{selectedVisit.purpose}</p>
                                </div>
                            )}

                            {selectedVisit.summary && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Summary</p>
                                    <p className="text-sm text-gray-900">{selectedVisit.summary}</p>
                                </div>
                            )}

                            {selectedVisit.createdBy && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Created By</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {selectedVisit.createdBy.firstName} {selectedVisit.createdBy.lastName}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {!selectedVisit.completed && (
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleMarkVisit(selectedVisit.id, 'YES')}
                                        disabled={isSubmitting}
                                        className="py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Completed
                                    </button>
                                    <button
                                        onClick={() => handleMarkVisit(selectedVisit.id, 'NO')}
                                        disabled={isSubmitting}
                                        className="py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Missed
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="p-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="w-full py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
