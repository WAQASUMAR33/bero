'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing push notification subscriptions
 * Use this in layouts or main components to enable push notifications
 */
export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // Changed to false initially
    const [error, setError] = useState(null);
    const [permission, setPermission] = useState('default');

    // Check if push notifications are supported
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const supported = 'serviceWorker' in navigator && 'PushManager' in window;
        setIsSupported(supported);

        if (supported && typeof Notification !== 'undefined') {
            setPermission(Notification.permission);
        }

        console.log('[PushNotifications] Browser support check:', {
            serviceWorker: 'serviceWorker' in navigator,
            pushManager: 'PushManager' in window,
            notification: typeof Notification !== 'undefined',
            isSecureContext: window.isSecureContext,
            currentPermission: typeof Notification !== 'undefined' ? Notification.permission : 'N/A'
        });
    }, []);

    // Check existing subscription on mount (with timeout to prevent hanging)
    useEffect(() => {
        if (!isSupported) return;

        const checkSubscription = async () => {
            try {
                // Check if service worker is already registered
                const registrations = await navigator.serviceWorker.getRegistrations();

                if (registrations.length > 0) {
                    const registration = registrations[0];
                    const existingSubscription = await registration.pushManager.getSubscription();

                    if (existingSubscription) {
                        setSubscription(existingSubscription);
                        setIsSubscribed(true);
                        console.log('[PushNotifications] Found existing subscription');
                    }
                }
            } catch (err) {
                console.error('[PushNotifications] Error checking subscription:', err);
            }
        };

        checkSubscription();
    }, [isSupported]);

    // Register service worker
    const registerServiceWorker = useCallback(async () => {
        if (!isSupported) return null;

        try {
            console.log('[PushNotifications] Registering service worker...');
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('[PushNotifications] Service worker registered:', registration);

            // Wait for it to be ready
            await navigator.serviceWorker.ready;
            console.log('[PushNotifications] Service worker ready');

            return registration;
        } catch (err) {
            console.error('[PushNotifications] Service worker registration failed:', err);
            setError('Failed to register service worker: ' + err.message);
            return null;
        }
    }, [isSupported]);

    // Request notification permission
    const requestPermission = useCallback(async () => {
        if (!isSupported) return false;

        try {
            console.log('[PushNotifications] Requesting permission...');
            const result = await Notification.requestPermission();
            console.log('[PushNotifications] Permission result:', result);
            setPermission(result);
            return result === 'granted';
        } catch (err) {
            console.error('[PushNotifications] Error requesting permission:', err);
            setError('Failed to request notification permission: ' + err.message);
            return false;
        }
    }, [isSupported]);

    // Subscribe to push notifications
    const subscribe = useCallback(async () => {
        console.log('[PushNotifications] Subscribe called');

        if (!isSupported) {
            const msg = 'Push notifications not supported in this browser';
            console.error('[PushNotifications]', msg);
            setError(msg);
            return false;
        }

        if (!window.isSecureContext) {
            const msg = 'Push notifications require HTTPS or localhost';
            console.error('[PushNotifications]', msg);
            setError(msg);
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Request permission if not granted
            console.log('[PushNotifications] Current permission:', Notification.permission);

            if (Notification.permission === 'denied') {
                setError('Notifications are blocked. Please enable them in browser settings.');
                setIsLoading(false);
                return false;
            }

            if (Notification.permission !== 'granted') {
                console.log('[PushNotifications] Requesting permission...');
                const granted = await requestPermission();
                if (!granted) {
                    setError('Notification permission denied');
                    setIsLoading(false);
                    return false;
                }
            }

            // Register service worker
            console.log('[PushNotifications] Registering service worker...');
            const registration = await registerServiceWorker();
            if (!registration) {
                setIsLoading(false);
                return false;
            }

            // Get VAPID public key from server
            console.log('[PushNotifications] Fetching VAPID key...');
            const token = localStorage.getItem('token');
            const vapidResponse = await fetch('/api/push-subscribe', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (!vapidResponse.ok) {
                throw new Error('Failed to get VAPID key from server');
            }

            const vapidData = await vapidResponse.json();
            console.log('[PushNotifications] VAPID response:', vapidData);

            if (!vapidData.success || !vapidData.vapidPublicKey) {
                throw new Error('Push notifications not configured on server');
            }

            // Convert VAPID key to Uint8Array
            const vapidKey = urlBase64ToUint8Array(vapidData.vapidPublicKey);

            // Subscribe to push
            console.log('[PushNotifications] Subscribing to push manager...');
            const pushSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey
            });
            console.log('[PushNotifications] Push subscription created:', pushSubscription);

            // Detect device type
            const deviceType = getDeviceType();

            // Save subscription to server
            console.log('[PushNotifications] Saving subscription to server...');
            const saveResponse = await fetch('/api/push-subscribe', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: pushSubscription.toJSON(),
                    deviceType,
                    userAgent: navigator.userAgent
                })
            });

            if (!saveResponse.ok) {
                const errorData = await saveResponse.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to save subscription');
            }

            console.log('[PushNotifications] Subscription saved successfully!');
            setSubscription(pushSubscription);
            setIsSubscribed(true);
            setIsLoading(false);
            return true;
        } catch (err) {
            console.error('[PushNotifications] Subscription error:', err);
            setError(err.message || 'Failed to subscribe');
            setIsLoading(false);
            return false;
        }
    }, [isSupported, requestPermission, registerServiceWorker]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async () => {
        if (!subscription) return true;

        setIsLoading(true);
        setError(null);

        try {
            // Unsubscribe from browser
            await subscription.unsubscribe();

            // Remove from server
            const token = localStorage.getItem('token');
            const endpoint = encodeURIComponent(subscription.endpoint);
            await fetch(`/api/push-subscribe?endpoint=${endpoint}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setSubscription(null);
            setIsSubscribed(false);
            setIsLoading(false);
            return true;
        } catch (err) {
            console.error('[PushNotifications] Unsubscribe error:', err);
            setError(err.message || 'Failed to unsubscribe');
            setIsLoading(false);
            return false;
        }
    }, [subscription]);

    return {
        isSupported,
        isSubscribed,
        isLoading,
        error,
        permission,
        subscribe,
        unsubscribe,
        requestPermission
    };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Detect device type
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
        return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
        return 'mobile';
    }
    return 'desktop';
}

export default usePushNotifications;
