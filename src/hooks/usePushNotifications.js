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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [permission, setPermission] = useState('default');

    // Check if push notifications are supported
    useEffect(() => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window;
        setIsSupported(supported);

        if (supported && typeof Notification !== 'undefined') {
            setPermission(Notification.permission);
        }

        setIsLoading(false);
    }, []);

    // Check existing subscription on mount
    useEffect(() => {
        if (!isSupported) return;

        const checkSubscription = async () => {
            try {
                const registration = await navigator.serviceWorker.ready;
                const existingSubscription = await registration.pushManager.getSubscription();

                if (existingSubscription) {
                    setSubscription(existingSubscription);
                    setIsSubscribed(true);
                }
            } catch (err) {
                console.error('Error checking subscription:', err);
            }
        };

        checkSubscription();
    }, [isSupported]);

    // Register service worker
    const registerServiceWorker = useCallback(async () => {
        if (!isSupported) return null;

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;
            return registration;
        } catch (err) {
            console.error('Service worker registration failed:', err);
            setError('Failed to register service worker');
            return null;
        }
    }, [isSupported]);

    // Request notification permission
    const requestPermission = useCallback(async () => {
        if (!isSupported) return false;

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch (err) {
            console.error('Error requesting permission:', err);
            setError('Failed to request notification permission');
            return false;
        }
    }, [isSupported]);

    // Subscribe to push notifications
    const subscribe = useCallback(async () => {
        if (!isSupported) {
            setError('Push notifications not supported');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Request permission if not granted
            if (Notification.permission !== 'granted') {
                const granted = await requestPermission();
                if (!granted) {
                    setError('Notification permission denied');
                    setIsLoading(false);
                    return false;
                }
            }

            // Register service worker
            const registration = await registerServiceWorker();
            if (!registration) {
                setIsLoading(false);
                return false;
            }

            // Get VAPID public key from server
            const token = localStorage.getItem('token');
            const vapidResponse = await fetch('/api/push-subscribe', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!vapidResponse.ok) {
                throw new Error('Failed to get VAPID key');
            }

            const vapidData = await vapidResponse.json();
            if (!vapidData.success || !vapidData.vapidPublicKey) {
                throw new Error('Push notifications not configured on server');
            }

            // Convert VAPID key to Uint8Array
            const vapidKey = urlBase64ToUint8Array(vapidData.vapidPublicKey);

            // Subscribe to push
            const pushSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey
            });

            // Detect device type
            const deviceType = getDeviceType();

            // Save subscription to server
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
                throw new Error('Failed to save subscription');
            }

            setSubscription(pushSubscription);
            setIsSubscribed(true);
            setIsLoading(false);
            return true;
        } catch (err) {
            console.error('Subscription error:', err);
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
            console.error('Unsubscribe error:', err);
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
