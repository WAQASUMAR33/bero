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
    const [subscriptionInfo, setSubscriptionInfo] = useState(null);
    const [sendingTest, setSendingTest] = useState(false);

    const addLog = (msg) => {
        console.log('[TestPush]', msg);
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
        if (result) {
            checkSubscriptionStatus();
        }
    };

    const handleUnsubscribe = async () => {
        addLog('Attemping to unsubscribe...');
        const result = await unsubscribe();
        addLog(`Unsubscribe result: ${result}`);
        setSubscriptionInfo(null);
    };

    const checkSubscriptionStatus = async () => {
        addLog('Checking subscription status on server...');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                addLog('ERROR: Not logged in. Please login first.');
                return;
            }

            const res = await fetch('/api/test-push', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                setSubscriptionInfo(data);
                addLog(`Found ${data.subscriptions.length} subscription(s) for user ${data.userId}`);
                data.subscriptions.forEach((sub, i) => {
                    addLog(`  [${i + 1}] ${sub.deviceType} - Active: ${sub.isActive}`);
                });
            } else {
                addLog(`ERROR: ${data.error}`);
            }
        } catch (e) {
            addLog(`Error checking status: ${e.message}`);
        }
    };

    const handleTestNotification = async () => {
        addLog('Sending test notification...');
        setSendingTest(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                addLog('ERROR: Not logged in. Please login first.');
                setSendingTest(false);
                return;
            }

            const res = await fetch('/api/test-push', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();

            if (data.success) {
                addLog(`✅ Test notification sent!`);
                addLog(`   Sent: ${data.result?.sent || 0}, Failed: ${data.result?.failed || 0}`);
                addLog('   Check your notifications!');
            } else {
                addLog(`❌ Failed: ${data.error}`);
                if (data.debug) {
                    addLog(`   Debug: ${JSON.stringify(data.debug)}`);
                }
            }
        } catch (e) {
            addLog(`Error: ${e.message}`);
        }

        setSendingTest(false);
    };

    // Check subscription status on mount
    useEffect(() => {
        if (isSubscribed) {
            checkSubscriptionStatus();
        }
    }, [isSubscribed]);

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">🔔 Push Notification Debugger</h1>

            <div className="space-y-4 mb-8">
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p><strong>Status:</strong> {isLoading ? 'Loading...' : 'Ready'}</p>
                    <p><strong>Supported:</strong> {isSupported ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Subscribed:</strong> {isSubscribed ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Permission:</strong> {permission}</p>
                    <p><strong>Error:</strong> {error || 'None'}</p>
                </div>

                {subscriptionInfo && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-bold text-green-800">Server Subscription Status</p>
                        <p>User ID: {subscriptionInfo.userId}</p>
                        <p>Subscriptions: {subscriptionInfo.subscriptions?.length || 0}</p>
                    </div>
                )}

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={checkSupport}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Check Support
                    </button>

                    <button
                        onClick={handleSubscribe}
                        disabled={isSubscribed || isLoading}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        Subscribe
                    </button>

                    <button
                        onClick={handleUnsubscribe}
                        disabled={!isSubscribed || isLoading}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                        Unsubscribe
                    </button>

                    <button
                        onClick={checkSubscriptionStatus}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Check Server Status
                    </button>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                    <button
                        onClick={handleTestNotification}
                        disabled={!isSubscribed || sendingTest}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-bold"
                    >
                        {sendingTest ? 'Sending...' : '📨 Send Test Notification'}
                    </button>
                </div>
            </div>

            <div className="border border-gray-300 rounded p-4 h-64 overflow-y-auto font-mono text-sm bg-black text-green-400">
                {logs.length === 0 ? <div className="text-gray-500">Logs will appear here...</div> : logs.map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
            </div>

            <div className="mt-4 text-sm text-gray-500">
                <p><strong>Note:</strong> Service Workers require <strong>HTTPS</strong> or <strong>localhost</strong>.</p>
                <p>If you are accessing via IP address (e.g. 192.168.x.x), push notifications will NOT work.</p>
                <p className="mt-2"><strong>Steps:</strong></p>
                <ol className="list-decimal ml-5">
                    <li>Login to the app first</li>
                    <li>Click "Check Support" to verify browser compatibility</li>
                    <li>Click "Subscribe" to enable push notifications</li>
                    <li>Click "Send Test Notification" to test</li>
                </ol>
            </div>
        </div>
    );
}
