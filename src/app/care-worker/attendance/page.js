'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AttendanceHistoryPage() {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, COMPLETED, LATE

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [records, dateRange, statusFilter, currentPage]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Fetch all records (or reasonably large set if not paginated on backend API yet)
            // The API supports date filtering, but let's fetch 'all' and filter client side 
            // OR use API properly. For user ease, let's fetch last 90 days by default maybe,
            // or if no date param returns all. Let's try to get all.
            const response = await fetch(`/api/clock-in-out?view=my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Sort descending by clockInTime
                    const sorted = (data.data || []).sort((a, b) => new Date(b.clockInTime) - new Date(a.clockInTime));
                    setRecords(sorted);
                }
            }
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...records];

        // Date Range
        if (dateRange.start) {
            const start = new Date(dateRange.start);
            start.setHours(0, 0, 0, 0);
            result = result.filter(r => new Date(r.clockInTime) >= start);
        }
        if (dateRange.end) {
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);
            result = result.filter(r => new Date(r.clockInTime) <= end);
        }

        // Status
        if (statusFilter === 'ACTIVE') {
            result = result.filter(r => !r.clockOutTime);
        } else if (statusFilter === 'COMPLETED') {
            result = result.filter(r => r.clockOutTime);
        } else if (statusFilter === 'LATE') {
            result = result.filter(r => r.isLate);
        }

        setFilteredRecords(result);

        // Reset to page 1 if just filtered and page count changes drastically
        // But better to just handle pagination slice in render
    };

    // Pagination Logic
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleDateString();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
                    <p className="text-sm text-gray-500">View and manage your clock-in records</p>
                </div>
                <div className="flex gap-2">
                    {/* Could add export button here */}
                </div>
            </div>

            {/* Filters Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-end sm:items-center flex-wrap">
                <div className="w-full sm:w-auto">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full sm:w-40 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                    >
                        <option value="ALL">All Records</option>
                        <option value="ACTIVE">Active Shifts</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="LATE">Late Clock-ins</option>
                    </select>
                </div>
                <div className="w-full sm:w-auto">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">From Date</label>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setCurrentPage(1); }}
                        className="w-full sm:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">To Date</label>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setCurrentPage(1); }}
                        className="w-full sm:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                    />
                </div>
                {/* Reset Filter Button */}
                <button
                    onClick={() => { setStatusFilter('ALL'); setDateRange({ start: '', end: '' }); setCurrentPage(1); }}
                    className="mt-4 sm:mt-0 text-sm font-medium text-gray-500 hover:text-[#224fa6] underline"
                >
                    Reset
                </button>
            </div>

            {/* Table / List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]" />
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <p className="text-lg font-medium">No records found</p>
                        <p className="text-sm">Try adjusting your filters.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table Header */}
                        <div className="hidden md:grid grid-cols-6 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <div className="col-span-2">Service User</div>
                            <div className="col-span-1">Date</div>
                            <div className="col-span-1">Schedule</div>
                            <div className="col-span-1">Clock In/Out</div>
                            <div className="col-span-1 text-right">Status</div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {paginatedRecords.map((record) => (
                                <div key={record.id} className="p-4 md:px-6 md:py-4 hover:bg-blue-50/30 transition-colors flex flex-col md:grid md:grid-cols-6 md:gap-4 md:items-center">
                                    {/* Mobile: Top Row */}
                                    <div className="flex justify-between items-start md:hidden mb-2">
                                        <div className="font-bold text-gray-900">
                                            {record.serviceSeeker?.firstName} {record.serviceSeeker?.lastName}
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${record.clockOutTime ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {record.clockOutTime ? 'Completed' : 'Active'}
                                        </span>
                                    </div>

                                    {/* Desktop: User Name */}
                                    <div className="hidden md:block col-span-2 font-medium text-gray-900">
                                        {record.serviceSeeker?.firstName} {record.serviceSeeker?.lastName}
                                    </div>

                                    {/* Date */}
                                    <div className="col-span-1 text-sm text-gray-600 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        {formatDate(record.date)}
                                    </div>

                                    {/* Schedule Time (from assignment) */}
                                    <div className="col-span-1 text-sm text-gray-500 mt-1 md:mt-0">
                                        {record.shiftAssignment?.shift?.startTime ? (
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                {record.shiftAssignment.shift.startTime.slice(0, 5)} - {record.shiftAssignment.shift.endTime.slice(0, 5)}
                                            </span>
                                        ) : '--:--'}
                                    </div>

                                    {/* Actual Time */}
                                    <div className="col-span-1 text-sm font-medium text-gray-700 mt-1 md:mt-0 flex flex-col">
                                        <div className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                            {formatTime(record.clockInTime)}
                                        </div>
                                        {record.clockOutTime && (
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                                {formatTime(record.clockOutTime)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Desktop Status */}
                                    <div className="hidden md:flex col-span-1 justify-end items-center gap-2">
                                        {record.isLate && (
                                            <span className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded font-bold border border-red-100">LATE</span>
                                        )}
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${record.clockOutTime ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {record.clockOutTime ? 'Done' : 'Active'}
                                        </span>
                                    </div>

                                    {/* Mobile bottom row extra info */}
                                    <div className="md:hidden mt-2 flex justify-between items-center text-xs text-gray-500">
                                        {record.isLate && <span className="text-red-500 font-bold">⚠️ Late Clock-in</span>}
                                        {!record.clockOutTime && <span className="text-blue-500 font-medium">Currently clocked in</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600 font-medium">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
