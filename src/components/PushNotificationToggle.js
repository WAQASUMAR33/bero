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
    const [showError, setShowError] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');

    // Show error tooltip when error changes
    useEffect(() => {
        if (error) {
            setShowError(true);
            console.error('Push notification error:', error);
            setTimeout(() => setShowError(false), 5000);
        }
    }, [error]);

    // Log debug info on mount
    useEffect(() => {
        const info = {
            supported: isSupported,
            permission: typeof Notification !== 'undefined' ? Notification.permission : 'N/A',
            serviceWorker: 'serviceWorker' in navigator,
            pushManager: 'PushManager' in (typeof window !== 'undefined' ? window : {}),
            secure: typeof window !== 'undefined' ? window.isSecureContext : 'N/A'
        };
        console.log('Push notification support:', info);
        setDebugInfo(JSON.stringify(info, null, 2));
    }, [isSupported]);

    const handleToggle = async () => {
        console.log('Toggle clicked, isSubscribed:', isSubscribed);

        if (isSubscribed) {
            const success = await unsubscribe();
            console.log('Unsubscribe result:', success);
        } else {
            console.log('Starting subscription flow...');
            const success = await subscribe();
            console.log('Subscribe result:', success);

            if (success) {
                setShowTooltip(true);
                setTimeout(() => setShowTooltip(false), 3000);
            }
        }
    };

    // Don't render if not supported
    if (!isSupported) {
        console.log('Push notifications not supported');
        return (
            <div className={`relative ${className}`} title="Push notifications not supported in this browser">
                <button
                    disabled
                    className="p-2 rounded-full text-gray-300 cursor-not-allowed"
                    aria-label="Push notifications not supported"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>
            </div>
        );
    }

    const getStatusColor = () => {
        if (isSubscribed) return 'text-green-500';
        if (permission === 'denied') return 'text-red-500';
        return 'text-gray-400 hover:text-blue-500';
    };

    const getTooltipText = () => {
        if (isLoading) return 'Loading...';
        if (permission === 'denied') return 'Notifications blocked. Enable in browser settings.';
        if (isSubscribed) return 'Push notifications enabled. Click to disable.';
        return 'Click to enable push notifications';
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2 border border-gray-200 ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                title={getTooltipText()}
                aria-label={getTooltipText()}
            >
                {/* Status Indicator */}
                <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isSubscribed ? 'bg-green-500' : 'bg-gray-300'} ${permission === 'denied' ? 'bg-red-400' : ''}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${isSubscribed ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>

                {/* Icon / Label */}
                {isLoading ? (
                    <svg className="w-4 h-4 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <span className="text-xs font-medium text-gray-600">Push</span>
                )}
            </button>

            {/* Success tooltip */}
            {showTooltip && (
                <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50">
                    Push notifications enabled! 🔔
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-green-600 rotate-45"></div>
                </div>
            )}

            {/* Error tooltip */}
            {showError && error && (
                <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg shadow-lg max-w-xs z-50">
                    {error}
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-red-600 rotate-45"></div>
                </div>
            )}
        </div>
    );
}
