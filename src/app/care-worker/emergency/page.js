'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EmergencyPage() {
    const router = useRouter();
    const [location, setLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState('fetching'); // fetching, success, error
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [successData, setSuccessData] = useState(null);

    const fetchLocation = () => {
        setLocationStatus('fetching');
        if (!navigator.geolocation) {
            setLocationStatus('error');
            console.error("Geolocation is not supported by this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc = `${position.coords.latitude}, ${position.coords.longitude}`;
                setLocation(loc);
                setLocationStatus('success');
            },
            (error) => {
                console.error("Error getting location:", {
                    code: error.code,
                    message: error.message,
                });
                setLocationStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        fetchLocation();
    }, []);

    const handleTrigger = async () => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("You are not logged in.");
                router.push('/care-worker-login');
                return;
            }

            const response = await fetch('/api/emergency', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    location: location || "Unknown Location",
                    message: message || "Emergency Button Triggered"
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccessData(data.data);
                setShowConfirm(false);
            } else {
                alert(data.error || "Failed to trigger emergency alert.");
            }
        } catch (error) {
            console.error("Emergency trigger error:", error);
            alert("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (successData) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Emergency Alert Sent</h2>
                <p className="text-slate-600 mb-8 max-w-xs">
                    Your team has been notified. Location and details have been shared securely.
                </p>
                <Link href="/care-worker" className="w-full max-w-xs bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-colors">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <Link href="/care-worker" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="text-xl font-bold text-slate-800">Emergency Trigger</h1>
            </div>

            <div className="p-6 max-w-lg mx-auto flex flex-col h-[calc(100vh-80px)]">

                <div className="flex-1 flex flex-col justify-center items-center py-6">
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="w-64 h-64 rounded-full bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] flex flex-col items-center justify-center text-white hover:bg-red-600 active:scale-95 transition-all duration-300 border-8 border-red-400 animate-pulse relative group"
                    >
                        <div className="absolute inset-0 rounded-full border-[3px] border-white/20 scale-90"></div>
                        <div className="absolute inset-0 rounded-full border-[1px] border-white/40 scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500"></div>

                        <svg className="w-20 h-20 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-3xl font-black tracking-wider">SMS</span>
                        <span className="text-xs font-semibold opacity-80 uppercase tracking-widest mt-1">Tap for Emergency</span>
                    </button>

                    <div className="mt-10 w-full text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200">
                            {locationStatus === 'fetching' && (
                                <>
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                    <span className="text-xs font-medium text-slate-500">Locating...</span>
                                </>
                            )}
                            {locationStatus === 'success' && (
                                <>
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    <span className="text-xs font-medium text-slate-600">Location Active</span>
                                </>
                            )}
                            {locationStatus === 'error' && (
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    <span className="text-xs font-medium text-slate-500">Location Unavailable</span>
                                    <button
                                        onClick={fetchLocation}
                                        className="text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-200 text-slate-600 font-bold transition-colors"
                                    >
                                        RETRY
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Additional Information (Optional)</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="E.g., Client fell, unresponsive..."
                        className="w-full p-4 bg-slate-50 rounded-xl border-none text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-red-100 min-h-[100px] resize-none"
                    ></textarea>
                </div>

            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl scale-in-95 animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-3 uppercase tracking-tight">Active Alert?</h3>
                        <p className="text-slate-500 mb-8 font-medium">
                            This will notify all managers immediately. Are you sure you want to proceed?
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleTrigger}
                                disabled={isSubmitting}
                                className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition-all text-lg"
                            >
                                {isSubmitting ? 'Sending Alert...' : 'CONFIRM EMERGENCY'}
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isSubmitting}
                                className="w-full bg-white text-slate-500 font-bold py-4 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
