'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HandoverPage() {
    const router = useRouter();
    const [activeShift, setActiveShift] = useState(null);
    const [nearbyShifts, setNearbyShifts] = useState([]);
    const [handoverData, setHandoverData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Form State
    const [selectedToShiftId, setSelectedToShiftId] = useState('');
    const [notes, setNotes] = useState('');
    const [issues, setIssues] = useState('');

    // In a real implementation, we would fetch tasks and visits from API to populate checkboxes
    // keeping it simple for now based on requirement to "implement handover-api.md"

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // 1. Get current active shift
            const today = new Date().toISOString().split('T')[0];
            const shiftsResponse = await fetch(`/api/clock-in-out/my-shifts?date=${today}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (shiftsResponse.ok) {
                const shiftData = await shiftsResponse.json();
                const current = (shiftData.data || []).find(s => s.clockedIn && !s.clockOutTime);

                if (current) {
                    setActiveShift(current);

                    // 2. Fetch available shifts for handover
                    // Assuming we have this endpoint as per doc
                    const handoversResponse = await fetch(`/api/handovers/available?fromShiftAssignmentId=${current.shiftAssignmentId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (handoversResponse.ok) {
                        const availableData = await handoversResponse.json();
                        if (availableData.success && availableData.data.availableAssignments) {
                            setNearbyShifts(availableData.data.availableAssignments);
                        }
                    }

                    // 3. (Optional) Fetch tasks/visits helper data
                    // For now, we will trust the user to type notes, but we could fetch tasks here
                } else {
                    setError("You must be clocked in to an active shift to perform a handover.");
                }
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load handover data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedToShiftId) {
            alert("Please select a colleague to hand over to.");
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/handovers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fromShiftAssignmentId: activeShift.shiftAssignmentId,
                    toShiftAssignmentId: parseInt(selectedToShiftId),
                    handoverNotes: notes,
                    issues: issues,
                    // remainingTasks: ... // Implementation for tasks selection would go here
                    // visits: ... // Implementation for visits would go here
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setSuccess(true);
            } else {
                alert(data.error || "Failed to submit handover.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Handover Complete!</h2>
                <p className="text-slate-600 mb-8">
                    Your handover notes have been recorded successfully.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button
                        onClick={() => router.push('/care-worker')}
                        className="bg-[#224fa6] text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-[#1e438f] transition-all"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!activeShift) {
        return (
            <div className="max-w-lg mx-auto p-6 text-center mt-10">
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">No Active Shift</h3>
                    <p className="text-slate-600 mb-6">
                        {error || "You need to be clocked in to perform a handover."}
                    </p>
                    <Link href="/care-worker" className="text-[#224fa6] font-semibold hover:underline">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/care-worker" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Shift Handover</h1>
                    <p className="text-sm text-slate-500">Record notes for the next carer</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. To Whom */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">1</span>
                        Hand Over To
                    </h2>

                    {nearbyShifts.length > 0 ? (
                        <div className="space-y-3">
                            {nearbyShifts.map(shift => (
                                <label key={shift.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedToShiftId == shift.id ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-slate-200 hover:border-teal-200'}`}>
                                    <input
                                        type="radio"
                                        name="toAssignment"
                                        value={shift.id}
                                        checked={selectedToShiftId == shift.id}
                                        onChange={(e) => setSelectedToShiftId(e.target.value)}
                                        className="w-5 h-5 text-teal-600 border-gray-300 focus:ring-teal-500"
                                    />
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800">{shift.user.firstName} {shift.user.lastName}</p>
                                        <p className="text-xs text-slate-500">{shift.shift.shiftType?.name} • Starts {shift.shift.startTime}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                                        {shift.user.firstName[0]}
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-slate-500 text-sm">No scheduled colleagues found starting soon at this location.</p>
                            <p className="text-xs text-slate-400 mt-1">You may still submit a digital handover record.</p>
                            {/* In a real app we might allow selecting 'General Handover' or similar if no specific person is scheduled immediately */}
                        </div>
                    )}
                </div>

                {/* 2. Key Information */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">2</span>
                        Shift Summary
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Handover Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Summary of the shift, medication updates, mood, etc."
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all min-h-[120px]"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Issues / Concerns</label>
                            <textarea
                                value={issues}
                                onChange={(e) => setIssues(e.target.value)}
                                placeholder="Any incidents, health concerns, or issues to flag?"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all min-h-[80px]"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={submitting || nearbyShifts.length === 0} // Strictly require a target for now as per simple reqs
                        className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 hover:shadow-teal-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                Complete Handover
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                    {nearbyShifts.length === 0 && (
                        <p className="text-center text-xs text-slate-400 mt-3">
                            Cannot submit without a receiving colleague. Please contact your manager.
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}
