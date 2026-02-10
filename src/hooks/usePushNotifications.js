'use client';

import { useState, useEffect, useCallback } from 'react';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [permission, setPermission] = useState('default');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);
        if (supported) {
            setPermission(Notification.permission);
            // Check if already subscribed
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    if (sub) setIsSubscribed(true);
                });
            }).catch(() => { });
        }
    }, []);

    const subscribe = useCallback(async () => {
        if (!isSupported) { setError('Push not supported'); return false; }
        setIsLoading(true);
        setError(null);

        try {
            // 1. Request permission
            if (Notification.permission === 'denied') {
                setError('Notifications blocked. Enable in browser settings.');
                setIsLoading(false);
                return false;
            }
            if (Notification.permission !== 'granted') {
                const result = await Notification.requestPermission();
                setPermission(result);
                if (result !== 'granted') {
                    setError('Permission denied');
                    setIsLoading(false);
                    return false;
                }
            }

            // 2. Register service worker (will update if already registered)
            const registration = await navigator.serviceWorker.register('/sw.js');
            // Force update to get latest version
            await registration.update();

            // Wait for the SW to be active
            let activeWorker = registration.active;
            if (!activeWorker) {
                // Wait for it to activate
                const worker = registration.installing || registration.waiting;
                if (worker) {
                    await new Promise((resolve) => {
                        worker.addEventListener('statechange', function handler() {
                            if (worker.state === 'activated' || worker.state === 'redundant') {
                                worker.removeEventListener('statechange', handler);
                                resolve();
                            }
                        });
                        // Check immediately in case already activated
                        if (worker.state === 'activated') resolve();
                    });
                }
                activeWorker = registration.active;
            }

            // 3. Unsubscribe any old push subscription on this registration
            const existingSub = await registration.pushManager.getSubscription();
            if (existingSub) {
                await existingSub.unsubscribe();
            }

            // 4. Get VAPID key
            const token = localStorage.getItem('token');
            const vapidRes = await fetch('/api/push-subscribe', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const vapidData = await vapidRes.json();
            if (!vapidData.success || !vapidData.vapidPublicKey) {
                throw new Error('Server push not configured');
            }

            // 5. Subscribe to push
            const pushSub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidData.vapidPublicKey)
            });

            // 6. Save to server
            const saveRes = await fetch('/api/push-subscribe', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: pushSub.toJSON(),
                    deviceType: /mobile|android|iphone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
                    userAgent: navigator.userAgent
                })
            });

            if (!saveRes.ok) throw new Error('Failed to save subscription to server');

            console.log('[Push] Subscribed successfully!');
            setIsSubscribed(true);
            setPermission('granted');
            setIsLoading(false);
            return true;
        } catch (err) {
            console.error('[Push] Subscribe error:', err);
            setError(err.message);
            setIsLoading(false);
            return false;
        }
    }, [isSupported]);

    const unsubscribe = useCallback(async () => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
                const token = localStorage.getItem('token');
                await fetch(`/api/push-subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                await sub.unsubscribe();
            }
            setIsSubscribed(false);
            setIsLoading(false);
            return true;
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
            return false;
        }
    }, []);

    return { isSupported, isSubscribed, isLoading, error, permission, subscribe, unsubscribe };
}

export default usePushNotifications;
