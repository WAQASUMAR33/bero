'use client';

import { useState, useEffect } from 'react';
import usePushNotifications from '@/hooks/usePushNotifications';

export default function TestPushPage() {
    const { isSupported, isSubscribed, isLoading, error, permission, subscribe, unsubscribe } = usePushNotifications();
    const [logs, setLogs] = useState([]);
    const [busy, setBusy] = useState(false);

    const log = (msg) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    useEffect(() => {
        log('Page loaded');
        log('Supported: ' + isSupported);
        log('Permission: ' + (typeof Notification !== 'undefined' ? Notification.permission : 'N/A'));
        log('Secure context: ' + (typeof window !== 'undefined' ? window.isSecureContext : 'N/A'));
    }, []);

    useEffect(() => {
        log('Subscribed: ' + isSubscribed);
    }, [isSubscribed]);

    useEffect(() => {
        if (error) log('❌ Error: ' + error);
    }, [error]);

    const handleSubscribe = async () => {
        log('Subscribing...');
        const ok = await subscribe();
        log(ok ? '✅ Subscribed!' : '❌ Subscribe failed');
    };

    const handleUnsubscribe = async () => {
        log('Unsubscribing...');
        const ok = await unsubscribe();
        log(ok ? '✅ Unsubscribed!' : '❌ Unsubscribe failed');
    };

    const handleLocalTest = async () => {
        log('Testing local notification...');
        try {
            const regs = await navigator.serviceWorker.getRegistrations();
            const reg = regs.find(r => r.active);
            if (!reg) {
                log('❌ No active service worker found. Try refreshing the page.');
                return;
            }
            await reg.showNotification('🔔 Local Test', {
                body: 'This is a local test notification from the service worker.',
                icon: '/assets/logo2.png',
                tag: 'local-test-' + Date.now(),
                requireInteraction: true
            });
            log('✅ Local notification triggered! Check your taskbar/notification area.');
        } catch (e) {
            log('❌ Local test failed: ' + e.message);
        }
    };

    const handleServerTest = async () => {
        log('Sending server push test...');
        setBusy(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/test-push', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                log(`✅ Server push sent! Sent: ${data.result?.sent || 0}, Failed: ${data.result?.failed || 0}`);
            } else {
                log('❌ Server push failed: ' + data.error);
            }
        } catch (e) {
            log('❌ Error: ' + e.message);
        }
        setBusy(false);
    };

    const handleEmergencyTest = async () => {
        log('🚨 Triggering emergency alert...');
        setBusy(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/emergency', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ location: 'Debug Page', message: 'Test emergency from debug page' })
            });
            const data = await res.json();
            if (res.ok) {
                log(`✅ Emergency created! ID: ${data.data?.id}. Push notification should arrive.`);
            } else {
                log('❌ Emergency failed: ' + data.error);
            }
        } catch (e) {
            log('❌ Error: ' + e.message);
        }
        setBusy(false);
    };

    const handleCleanup = async () => {
        log('Cleaning up old subscriptions...');
        setBusy(true);
        try {
            const token = localStorage.getItem('token');
            // Delete ALL subscriptions for this user from server
            await fetch('/api/push-subscribe', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Unsubscribe push on all registrations (but don't unregister SW)
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const reg of regs) {
                const sub = await reg.pushManager.getSubscription();
                if (sub) await sub.unsubscribe();
            }
            log('✅ Cleaned up! Now click Subscribe to start fresh.');
        } catch (e) {
            log('❌ Cleanup error: ' + e.message);
        }
        setBusy(false);
    };

    return (
        <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }}>
            <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>🔔 Push Notification Debugger</h1>

            {/* Status */}
            <div style={{ padding: 16, background: '#f3f4f6', borderRadius: 8, marginBottom: 16 }}>
                <p><strong>Supported:</strong> {isSupported ? '✅' : '❌'}</p>
                <p><strong>Subscribed:</strong> {isSubscribed ? '✅' : '❌'}</p>
                <p><strong>Permission:</strong> {permission}</p>
                <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
                {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
            </div>

            {/* Step 1: Subscribe */}
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Step 1: Manage Subscription</h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={handleSubscribe} disabled={isLoading || isSubscribed}
                        style={{ padding: '8px 16px', background: isSubscribed ? '#9ca3af' : '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                        {isLoading ? 'Working...' : isSubscribed ? 'Already Subscribed' : '✅ Subscribe'}
                    </button>
                    <button onClick={handleUnsubscribe} disabled={isLoading || !isSubscribed}
                        style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                        Unsubscribe
                    </button>
                    <button onClick={handleCleanup} disabled={busy}
                        style={{ padding: '8px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                        🧹 Clean All & Reset
                    </button>
                </div>
            </div>

            {/* Step 2: Test */}
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Step 2: Test Notifications</h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={handleLocalTest} disabled={!isSubscribed || busy}
                        style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                        🔔 Local Test (No Server)
                    </button>
                    <button onClick={handleServerTest} disabled={!isSubscribed || busy}
                        style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                        📨 Server Push Test
                    </button>
                    <button onClick={handleEmergencyTest} disabled={!isSubscribed || busy}
                        style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                        🚨 Trigger Emergency
                    </button>
                </div>
            </div>

            {/* Logs */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 'bold' }}>Logs</h2>
                    <button onClick={() => setLogs([])} style={{ padding: '4px 12px', background: '#e5e7eb', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                        Clear
                    </button>
                </div>
                <div style={{ background: '#1f2937', color: '#10b981', padding: 16, borderRadius: 8, height: 300, overflowY: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
                    {logs.map((l, i) => <div key={i}>{l}</div>)}
                    {logs.length === 0 && <span style={{ color: '#6b7280' }}>No logs yet...</span>}
                </div>
            </div>
        </div>
    );
}
