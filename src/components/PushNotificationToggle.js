'use client';

import { useState, useEffect } from 'react';
import usePushNotifications from '@/hooks/usePushNotifications';

/**
 * Push notification toggle component
 * Shows a bell icon with settings to enable/disable push notifications
 */
export default function PushNotificationToggle({ className = '' }) {
    const {
        isSupported,
        isSubscribed,
        isLoading,
        error,
        permission,
        subscribe,
        unsubscribe
    } = usePushNotifications();

    const [showTooltip, setShowTooltip] = useState(false);

    // Don't render if not supported
    if (!isSupported) {
        return null;
    }

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            const success = await subscribe();
            if (success) {
                // Show success feedback
                setShowTooltip(true);
                setTimeout(() => setShowTooltip(false), 3000);
            }
        }
    };

    const getStatusColor = () => {
        if (isSubscribed) return 'text-green-500';
        if (permission === 'denied') return 'text-red-500';
        return 'text-gray-400';
    };

    const getTooltipText = () => {
        if (isLoading) return 'Loading...';
        if (permission === 'denied') return 'Notifications blocked. Enable in browser settings.';
        if (isSubscribed) return 'Push notifications enabled. Click to disable.';
        return 'Enable push notifications';
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={handleToggle}
                disabled={isLoading || permission === 'denied'}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative ${getStatusColor()}`}
                title={getTooltipText()}
                aria-label={getTooltipText()}
            >
                {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : isSubscribed ? (
                    // Bell with checkmark - enabled
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        <circle cx="18" cy="5" r="3" fill="currentColor" />
                    </svg>
                ) : permission === 'denied' ? (
                    // Bell with X - blocked
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-2.828 2.828m0-2.828l2.828 2.828" />
                    </svg>
                ) : (
                    // Bell outline - not enabled
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                )}
            </button>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 animate-in fade-in slide-in-from-top-2">
                    Push notifications enabled! 🔔
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-green-600 rotate-45"></div>
                </div>
            )}

            {/* Error tooltip */}
            {error && (
                <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg shadow-lg max-w-xs z-50 animate-in fade-in slide-in-from-top-2">
                    {error}
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-red-600 rotate-45"></div>
                </div>
            )}
        </div>
    );
}
