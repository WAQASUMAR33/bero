'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HolidaysPage() {
    const router = useRouter();
    const [holidays, setHolidays] = useState([]);
    const [holidayTypes, setHolidayTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED

    // Request Modal State
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        holidayTypeId: '',
        startDate: '',
        endDate: '',
        description: '',
        includeWeekends: false
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHolidays();
        fetchHolidayTypes();
    }, []);

    const fetchHolidays = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/holidays/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Sort by newest first
                    setHolidays((data.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
                }
            }
        } catch (err) {
            console.error('Error fetching holidays', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHolidayTypes = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/holiday-types', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setHolidayTypes(data.data || []);
                    if (data.data.length > 0) {
                        setFormData(prev => ({ ...prev, holidayTypeId: data.data[0].id }));
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching holiday types', err);
        }
    };

    const handleFilterChange = (status) => {
        setFilterStatus(status);
    };

    const filteredHolidays = holidays.filter(h => {
        if (filterStatus === 'ALL') return true;
        return h.status === filterStatus;
    });

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            if (!user || !token) {
                setError("Authentication failed");
                return;
            }

            const payload = {
                userId: user.id,
                holidayTypeId: parseInt(formData.holidayTypeId),
                startDate: formData.startDate,
                endDate: formData.endDate,
                description: formData.description,
                includeWeekends: formData.includeWeekends
            };

            const response = await fetch('/api/holidays', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setShowRequestModal(false);
                setFormData({
                    holidayTypeId: holidayTypes[0]?.id || '',
                    startDate: '',
                    endDate: '',
                    description: '',
                    includeWeekends: false
                });
                fetchHolidays(); // Refresh list
            } else {
                setError(result.error || 'Failed to submit request');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
            case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Holiday & Leave</h1>
                    <p className="text-sm text-gray-500">Manage your time off requests</p>
                </div>
                <button
                    onClick={() => setShowRequestModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#224fa6] text-white rounded-xl shadow-lg shadow-blue-900/10 hover:bg-[#1b3d82] hover:shadow-blue-900/20 transition-all active:scale-[0.98] font-semibold"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Request
                </button>
            </div>

            {/* Stats / Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => handleFilterChange(status)}
                        className={`p-4 rounded-xl border transition-all text-left group ${filterStatus === status
                                ? 'bg-blue-50 border-[#224fa6] ring-1 ring-[#224fa6]'
                                : 'bg-white border-gray-100 hover:border-blue-100 hover:shadow-sm'
                            }`}
                    >
                        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${filterStatus === status ? 'text-[#224fa6]' : 'text-gray-400 group-hover:text-[#224fa6]'
                            }`}>
                            {status === 'ALL' ? 'Total Requests' : status}
                        </p>
                        <p className={`text-2xl font-bold ${filterStatus === status ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                            {status === 'ALL' ? holidays.length : holidays.filter(h => h.status === status).length}
                        </p>
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]" />
                    </div>
                ) : filteredHolidays.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No requests found</h3>
                        <p className="text-gray-500 text-sm mt-1 mb-6">You haven't made any holiday requests with this status yet.</p>
                        {filterStatus !== 'ALL' && (
                            <button onClick={() => setFilterStatus('ALL')} className="text-[#224fa6] font-semibold hover:underline">
                                View all requests
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredHolidays.map((holiday) => (
                            <div key={holiday.id} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl shadow-sm ${holiday.holidayType?.color ? '' : 'bg-blue-100 text-blue-600'
                                        }`} style={{
                                            backgroundColor: holiday.holidayType?.color ? `${holiday.holidayType.color}15` : undefined,
                                            color: holiday.holidayType?.color
                                        }}>
                                        {/* Icon based on type maybe, or just calendar */}
                                        📅
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900">{holiday.holidayType?.name || 'Leave'}</h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(holiday.status)}`}>
                                                {holiday.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {formatDate(holiday.startDate)} - {formatDate(holiday.endDate)}
                                            </span>
                                            {holiday.holidayHours > 0 && (
                                                <span className="flex items-center gap-1 text-gray-500">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {holiday.holidayHours} hrs
                                                </span>
                                            )}
                                        </div>
                                        {holiday.description && (
                                            <p className="text-sm text-gray-500 mt-2 italic">"{holiday.description}"</p>
                                        )}
                                        {holiday.status === 'REJECTED' && holiday.rejectionReason && (
                                            <div className="mt-2 text-xs bg-red-50 text-red-700 p-2 rounded border border-red-100">
                                                <span className="font-bold">Reason:</span> {holiday.rejectionReason}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right text-xs text-gray-400 flex flex-col items-end gap-1">
                                    <span>Requested on {formatDate(holiday.createdAt)}</span>
                                    {holiday.approvedBy && (
                                        <span>
                                            {holiday.status === 'APPROVED' ? 'Approved' : 'Rejected'} by {holiday.approvedBy.name || holiday.approvedBy.firstName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 scale-in-95 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Request Time Off</h2>
                            <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-100">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleRequestSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Leave Type</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none bg-gray-50"
                                    value={formData.holidayTypeId}
                                    onChange={e => setFormData({ ...formData, holidayTypeId: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select Type</option>
                                    {holidayTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none bg-gray-50"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none bg-gray-50"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        required
                                        min={formData.startDate}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="weekends"
                                    className="w-4 h-4 text-[#224fa6] rounded border-gray-300 focus:ring-[#224fa6]"
                                    checked={formData.includeWeekends}
                                    onChange={e => setFormData({ ...formData, includeWeekends: e.target.checked })}
                                />
                                <label htmlFor="weekends" className="text-sm text-gray-700 font-medium">Include Weekends in calculation?</label>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Reason / Notes</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none bg-gray-50 min-h-[100px]"
                                    placeholder="e.g. Family vacation, Medical appointment..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRequestModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 rounded-xl bg-[#224fa6] text-white font-bold hover:bg-[#1e438f] shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Submit Request'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
