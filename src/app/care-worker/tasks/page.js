'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CareWorkerTasksPage() {
    // State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeShift, setActiveShift] = useState(null); // The currently clocked-in shift
    const [checkingStatus, setCheckingStatus] = useState(true);

    const [allData, setAllData] = useState(null); // { tasks: {...}, serviceUsers: [...], date: ... }
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [error, setError] = useState(null);

    // Filter State
    const [selectedTaskType, setSelectedTaskType] = useState('ALL');
    const [showCompleted, setShowCompleted] = useState(false); // To toggle completed tasks view

    // Modal State
    const [activeTask, setActiveTask] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateError, setUpdateError] = useState(null);

    // Initial Fetch: Check status first
    useEffect(() => {
        checkActiveShiftAndFetchTasks();
    }, [selectedDate]);

    const checkActiveShiftAndFetchTasks = async () => {
        setCheckingStatus(true);
        setLoadingTasks(true);
        setError(null);
        setAllData(null);
        setActiveShift(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // 1. Check if user is clocked in for TODAY (or selected date, usually today logic applies)
            // We use the same endpoint as dashboard to verify active status
            const shiftResponse = await fetch(`/api/clock-in-out/my-shifts?date=${selectedDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (shiftResponse.ok) {
                const shiftData = await shiftResponse.json();
                if (shiftData.success) {
                    const shifts = shiftData.data || [];
                    // Find the active shift (clockedIn = true, clockOutTime = null)
                    const currentActive = shifts.find(s => s.clockedIn && !s.clockOutTime);

                    if (currentActive) {
                        setActiveShift(currentActive);
                        // 2. Only if clocked in, fetch the tasks
                        await fetchTasks(token, currentActive);
                    } else {
                        // Not clocked in
                        setLoadingTasks(false);
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setError('Network error while checking status');
        } finally {
            setCheckingStatus(false);
            setLoadingTasks(false);
        }
    };

    const fetchTasks = async (token, currentShift) => {
        try {
            const response = await fetch(`/api/caretaker/tasks?date=${selectedDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setAllData(result.data);
                } else {
                    if (result.message) {
                        setAllData({ tasks: {}, serviceUsers: [], message: result.message });
                    } else {
                        setError('Failed to load tasks');
                    }
                }
            } else {
                if (response.status === 404) {
                    setAllData({ tasks: {}, serviceUsers: [], message: "No tasks found." });
                } else {
                    setError('Failed to fetch tasks');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Network error loading tasks');
        }
    };

    // Helper to flatten tasks for list view
    const getFlattenedTasks = () => {
        if (!allData || !allData.tasks || !activeShift) return [];

        let flatList = [];

        // Iterate over each task type key in the response
        Object.keys(allData.tasks).forEach(typeKey => {
            const tasksOfType = allData.tasks[typeKey] || [];
            tasksOfType.forEach(task => {
                flatList.push({
                    ...task,
                    taskTypeKey: typeKey,
                    startTime: task.time || task.startTime || '00:00',
                });
            });
        });

        // CRITICAL FILTER: Only show tasks for the service user of the ACTIVE shift
        // Use serviceSeekerId from the task and compare with activeShift.serviceSeekerId (or serviceSeeker.id)
        const activeClientId = activeShift.serviceSeeker?.id || activeShift.serviceSeekerId;

        flatList = flatList.filter(t => t.serviceSeekerId === activeClientId);

        // Filter by Task Category/Type if needed
        if (selectedTaskType !== 'ALL') {
            flatList = flatList.filter(t => t.taskTypeKey === selectedTaskType);
        }

        // Filter by completion status
        if (!showCompleted) {
            flatList = flatList.filter(t => t.completed !== 'YES');
        }

        // Sort by time
        flatList.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

        return flatList;
    };

    const tasksList = getFlattenedTasks();

    const handleTaskUpdate = async (e) => {
        e.preventDefault();
        if (!activeTask) return;
        setIsSubmitting(true);
        setUpdateError(null);

        const formData = new FormData(e.target);
        const payload = {};
        for (let [key, value] of formData.entries()) {
            payload[key] = value;
        }

        const kebabType = activeTask.taskTypeKey.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/${kebabType}-tasks/${activeTask.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                // Refresh data to keep clean state
                checkActiveShiftAndFetchTasks();
                setActiveTask(null);
            } else {
                setUpdateError(result.error || 'Failed to update task');
            }
        } catch (err) {
            setUpdateError('Network error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderTaskFormFields = (task) => {
        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700">Time</label>
                    <input type="time" name="time" defaultValue={task.time} className="w-full border p-2 rounded-lg" />
                </div>
                {renderSpecificFields(task)}
                <div>
                    <label className="block text-sm font-bold text-gray-700">Notes / Comments</label>
                    <textarea name="notes" defaultValue={task.notes || ''} className="w-full border p-2 rounded-lg" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Status</label>
                        <select name="completed" defaultValue={task.completed || 'NO'} className="w-full border p-2 rounded-lg">
                            <option value="NO">Pending / No</option>
                            <option value="YES">Completed</option>
                            <option value="ATTEMPTED">Attempted</option>
                            <option value="NOT_REQUIRED">Not Required</option>
                            <option value="DECLINED">Declined</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">User Emotion</label>
                        <select name="emotion" defaultValue={task.emotion || 'NEUTRAL'} className="w-full border p-2 rounded-lg">
                            <option value="HAPPY">Happy 🙂</option>
                            <option value="NEUTRAL">Neutral 😐</option>
                            <option value="SAD">Sad ☹️</option>
                        </select>
                    </div>
                </div>
            </div>
        );
    };

    const renderSpecificFields = (task) => {
        switch (task.taskTypeKey) {
            case 'bloodPressure':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Systolic</label>
                            <input type="number" name="systolicPressure" defaultValue={task.systolicPressure} className="w-full border p-2 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Diastolic</label>
                            <input type="number" name="diastolicPressure" defaultValue={task.diastolicPressure} className="w-full border p-2 rounded-lg" />
                        </div>
                    </div>
                );
            case 'temperature':
                return (
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Temp (°C)</label>
                        <input type="number" step="0.1" name="temperatureInC" defaultValue={task.temperatureInC} className="w-full border p-2 rounded-lg" />
                    </div>
                );
            case 'weight':
                return (
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Weight (kg)</label>
                        <input type="number" step="0.1" name="weightInKg" defaultValue={task.weightInKg} className="w-full border p-2 rounded-lg" />
                    </div>
                );
            case 'foodDrink':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Fluid Intake (ml)</label>
                            <input type="number" name="fluidIntake" defaultValue={task.fluidIntake} className="w-full border p-2 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Food Offered</label>
                            <input type="text" name="foodDrinkOffer" defaultValue={task.foodDrinkOffer} className="w-full border p-2 rounded-lg" />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const getTypeLabel = (key) => {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    if (checkingStatus) {
        return (
            <div className="flex justify-center p-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6]" />
            </div>
        );
    }

    // STATE: Not Clocked In
    if (!activeShift) {
        return (
            <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-3xl shadow-xl text-center border border-gray-100">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                    🛡️
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Restricted Access</h2>
                <p className="text-gray-500 mb-8">
                    To view and manage tasks for a service user, you must be <strong>Clocked In</strong> to their shift.
                </p>
                <Link
                    href="/care-worker"
                    className="inline-flex items-center justify-center gap-2 w-full py-4 bg-[#224fa6] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:bg-[#1b3d82] active:scale-95 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    // STATE: Clocked In (Show Tasks)
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Tasks for {activeShift.serviceSeeker?.firstName}
                    </h1>
                    <p className="text-sm text-green-600 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Currently Active Session
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="p-2 border border-gray-200 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />

                    {/* Toggle for Completed */}
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className={`px-3 py-2 rounded-lg font-bold text-sm transition-colors ${showCompleted ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {showCompleted ? 'Showing All' : 'Hide Completed'}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {allData?.message && (
                <div className="bg-blue-50 text-blue-700 p-6 rounded-2xl text-center">
                    <p className="font-semibold">{allData.message}</p>
                </div>
            )}

            {error && !allData?.message && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
                    {error}
                </div>
            )}

            {/* Tasks List */}
            {(!loadingTasks && !allData?.message) && (
                <div className="space-y-3">
                    {tasksList.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-gray-300">
                                ✓
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">All Caught Up!</h3>
                            <p className="text-gray-400">No pending tasks for this client.</p>
                        </div>
                    ) : (
                        tasksList.map((task, idx) => {
                            const isDone = task.completed === 'YES';

                            return (
                                <div
                                    key={`${task.taskTypeKey}-${task.id}`}
                                    className={`bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center ${isDone ? 'border-green-200 bg-green-50/10' : 'border-gray-100'
                                        }`}
                                >
                                    {/* Icon / Type */}
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${isDone ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-[#224fa6]'
                                        }`}>
                                        {isDone ? '✓' : '📝'}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap gap-2 items-center mb-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                                                {getTypeLabel(task.taskTypeKey)}
                                            </span>
                                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                                🕒 {task.time || '--:--'}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg">
                                            {task.title || getTypeLabel(task.taskTypeKey)}
                                        </h3>
                                        <p className="text-sm text-gray-500 truncate">
                                            {task.notes || 'No specific notes'}
                                        </p>
                                    </div>

                                    {/* Action */}
                                    <button
                                        onClick={() => setActiveTask(task)}
                                        className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm ${isDone
                                                ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                : 'bg-[#224fa6] text-white hover:bg-[#1b3d82] shadow-blue-900/10'
                                            }`}
                                    >
                                        {isDone ? 'Edit' : 'Fill In'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Task Edit Modal */}
            {activeTask && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 scale-in-95 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Update Task</h3>
                                <p className="text-sm text-gray-500">{getTypeLabel(activeTask.taskTypeKey)}</p>
                            </div>
                            <button onClick={() => setActiveTask(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
                        </div>

                        {updateError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
                                {updateError}
                            </div>
                        )}

                        <form onSubmit={handleTaskUpdate}>
                            {renderTaskFormFields(activeTask)}

                            <div className="mt-8 flex gap-3">
                                <button type="button" onClick={() => setActiveTask(null)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-[#224fa6] text-white font-bold rounded-xl hover:bg-[#1b3d82] shadow-lg shadow-blue-900/20 active:scale-95 transition-all">
                                    {isSubmitting ? 'Saving...' : 'Save Updates'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
