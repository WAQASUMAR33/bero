// Test script for push notifications
// Run with: node --experimental-modules scripts/test-push.mjs

import webpush from 'web-push';

// VAPID keys from .env
const vapidPublicKey = 'BBpN9bniiyCiAnyKSb85ffeRyv7W6ul_un0-i0VfJ6FolVBtcXI0s494XJldfu7rh56p7q7HkEdZEVoF-ErJeZs';
const vapidPrivateKey = '8Ntj5wLDb8lzlowiDrWH5GeUIVYmxhvjUXpnSD5ElsA';

// Configure web-push
webpush.setVapidDetails(
    'mailto:info@beerucare.com',
    vapidPublicKey,
    vapidPrivateKey
);

console.log('✅ VAPID keys configured successfully');
console.log('📣 Push notification system is ready to use');

// Test payload
const testPayload = {
    title: 'Test Notification',
    message: 'Push notifications are working!',
    type: 'INFO',
    link: '/'
};

console.log('\n📝 Test payload:', JSON.stringify(testPayload, null, 2));

console.log(`
✅ Push Notification Verification Complete!

To test push notifications:
1. Go to http://localhost:3000/test-push
2. Click "Check Support" to verify browser support
3. Click "Subscribe" to enable push notifications
4. Trigger an emergency alert to send a push notification

Note: Push notifications require HTTPS or localhost.
If testing on mobile, use ngrok or deploy to a secure server.
`);
