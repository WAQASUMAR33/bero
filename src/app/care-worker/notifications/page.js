'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            // Fetch more notifications for the full page
            const res = await fetch('/api/notifications?limit=50', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setNotifications(data.data);
                }
            } else {
                setError('Failed to load notifications');
            }
        } catch (e) {
            console.error(e);
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const deleteNotification = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            // Optimistic update
            setNotifications(prev => prev.filter(n => n.id !== id));

            const token = localStorage.getItem('token');
            await fetch(`/api/notifications?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error(err);
            fetchNotifications(); // Revert on error
        }
    };

    const clearAllNotifications = async () => {
        try {
            if (!confirm('Are you sure you want to clear all notifications?')) return;

            setNotifications([]);
            const token = localStorage.getItem('token');
            await fetch(`/api/notifications`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-sm text-gray-500">Stay updated with your latest alerts</p>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={clearAllNotifications}
                        className="px-4 py-2 bg-white border border-gray-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors shadow-sm"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center">
                    {error}
                </div>
            ) : notifications.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
                    <p className="text-gray-500 mt-1 max-w-sm">
                        You have no notifications at the moment. When important updates happen, they'll appear here.
                    </p>
                    <Link href="/care-worker" className="mt-6 px-6 py-3 bg-[#224fa6] text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-[#1e438f] transition-all">
                        Back to Dashboard
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notif) => {
                        let iconColor = 'text-blue-500 bg-blue-50';
                        let borderColor = 'border-l-blue-500';
                        if (notif.type === 'SUCCESS') { iconColor = 'text-emerald-500 bg-emerald-50'; borderColor = 'border-l-emerald-500'; }
                        if (notif.type === 'WARNING') { iconColor = 'text-amber-500 bg-amber-50'; borderColor = 'border-l-amber-500'; }
                        if (notif.type === 'ERROR') { iconColor = 'text-red-500 bg-red-50'; borderColor = 'border-l-red-500'; }

                        return (
                            <div key={notif.id} className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 ${borderColor} relative group transition-all hover:shadow-md ${!notif.isRead ? 'bg-blue-50/20' : ''}`}>
                                <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${iconColor}`}>
                                        {notif.type === 'SUCCESS' ? (
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        ) : notif.type === 'ERROR' ? (
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        ) : (
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        )}
                                    </div>
                                    <div className="flex-1 pr-8">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-900 text-base">{notif.title}</h3>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                {new Date(notif.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
                                        {notif.link && (
                                            <Link href={notif.link} className="inline-flex items-center gap-1 text-sm text-[#224fa6] font-semibold mt-3 hover:underline">
                                                View Details
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => deleteNotification(notif.id, e)}
                                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    title="Delete"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
