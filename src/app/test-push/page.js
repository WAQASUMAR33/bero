'use client';

import { useState, useEffect } from 'react';
import usePushNotifications from '@/hooks/usePushNotifications';

export default function TestPushPage() {
    const {
        isSupported,
        isSubscribed,
        isLoading,
        error,
        permission,
        subscribe,
        unsubscribe,
        requestPermission
    } = usePushNotifications();

    const [logs, setLogs] = useState([]);

    const addLog = (msg) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    const checkSupport = () => {
        addLog(`Is Secure Context: ${window.isSecureContext}`);
        addLog(`Service Worker in navigator: ${'serviceWorker' in navigator}`);
        addLog(`PushManager in window: ${'PushManager' in window}`);
        addLog(`Notification permission: ${Notification.permission}`);
    };

    const handleSubscribe = async () => {
        addLog('Attemping to subscribe...');
        const result = await subscribe();
        addLog(`Subscribe result: ${result}`);
    };

    const handleUnsubscribe = async () => {
        addLog('Attemping to unsubscribe...');
        const result = await unsubscribe();
        addLog(`Unsubscribe result: ${result}`);
    };

    const handleTestNotification = async () => {
        // This assumes you would implement a self-test API
        addLog('Sending test notification request...');
        try {
            const token = localStorage.getItem('token');
            // Retrieve userId from token if possible, or just use a hardcoded test endpoint
            // For now, we will just log that we would send it.
            // In a real test, we'd need the userId.
            addLog('To test actual sending, we need to trigger it from the server side.');
        } catch (e) {
            addLog(`Error: ${e.message}`);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Push Notification Debugger</h1>

            <div className="space-y-4 mb-8">
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p><strong>Status:</strong> {isLoading ? 'Loading...' : 'Ready'}</p>
                    <p><strong>Supported:</strong> {isSupported ? 'Yes' : 'No'}</p>
                    <p><strong>Subscribed:</strong> {isSubscribed ? 'Yes' : 'No'}</p>
                    <p><strong>Permission:</strong> {permission}</p>
                    <p><strong>Error:</strong> {error || 'None'}</p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={checkSupport}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Check Support
                    </button>

                    <button
                        onClick={handleSubscribe}
                        disabled={isSubscribed}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        Subscribe
                    </button>

                    <button
                        onClick={handleUnsubscribe}
                        disabled={!isSubscribed}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                        Unsubscribe
                    </button>
                </div>
            </div>

            <div className="border border-gray-300 rounded p-4 h-64 overflow-y-auto font-mono text-sm bg-black text-green-400">
                {logs.length === 0 ? <div className="text-gray-500">Logs will appear here...</div> : logs.map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
            </div>

            <div className="mt-4 text-sm text-gray-500">
                <p>Note: Service Workers require <strong>HTTPS</strong> or <strong>localhost</strong>.</p>
                <p>If you are accessing via IP address (e.g. 192.168.x.x), push notifications will NOT work.</p>
            </div>
        </div>
    );
}
