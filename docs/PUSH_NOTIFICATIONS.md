# Push Notifications System

This document describes the push notification system implemented for the Beeru Care application.

## Overview

The system enables real-time push notifications to:
- **Admin Dashboard (Desktop/Laptop)** - For managers, HR, directors
- **Care Worker App (Mobile)** - For care workers on mobile devices

## How It Works

1. When a user logs in, they can enable push notifications by clicking the bell icon in the header
2. The browser requests permission to show notifications
3. A service worker is registered to handle push events
4. The push subscription is saved to the database
5. When notifications are created, push messages are sent to all subscribed devices

## Setup Requirements

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Generate new keys with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key-here"
VAPID_PRIVATE_KEY="your-private-key-here"
```

### 2. Database Migration

The `PushSubscription` table is added to store subscriptions:

```bash
npx prisma db push
```

### 3. HTTPS Required

Push notifications **require HTTPS** in production. They work on:
- `localhost` (development)
- Any HTTPS domain (production)

## Files Created

| File | Purpose |
|------|---------|
| `public/sw.js` | Service worker for handling push events |
| `src/lib/push-notifications.js` | Server utility for sending push |
| `src/lib/send-push.js` | Helper functions for sending push |
| `src/hooks/usePushNotifications.js` | React hook for managing subscriptions |
| `src/components/PushNotificationToggle.js` | UI toggle button |
| `src/app/api/push-subscribe/route.js` | API for managing subscriptions |
| `src/app/api/push-send/route.js` | API for manually sending push |

## Usage

### In API Routes (Sending Push)

```javascript
import { sendPushToRoles, sendPushToUser, sendPushForNotifications } from '@/lib/send-push';

// Send to specific roles
await sendPushToRoles(['ADMIN', 'DIRECTOR'], {
  title: 'Alert!',
  message: 'Something happened',
  type: 'WARNING',
  link: '/admin/alerts'
});

// Send to specific user
await sendPushToUser(userId, {
  title: 'New Message',
  message: 'You have a new message',
  type: 'INFO',
  link: '/messages'
});

// Send for created notifications
await sendPushForNotifications([
  { userId: 1, title: 'Hello', message: 'World', type: 'INFO', link: '/' }
]);
```

### In React Components

```javascript
import usePushNotifications from '@/hooks/usePushNotifications';

function MyComponent() {
  const { 
    isSupported, 
    isSubscribed, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  return (
    <button onClick={isSubscribed ? unsubscribe : subscribe}>
      {isSubscribed ? 'Disable' : 'Enable'} Notifications
    </button>
  );
}
```

### Using the Toggle Component

```javascript
import PushNotificationToggle from '@/components/PushNotificationToggle';

function Header() {
  return (
    <div>
      <PushNotificationToggle />
    </div>
  );
}
```

## Notification Types

| Type | Visual | Use Case |
|------|--------|----------|
| `INFO` | Standard | General notifications |
| `WARNING` | Attention | Important updates |
| `ERROR` | Critical | Emergencies, urgent |
| `SUCCESS` | Positive | Confirmations |

## Push Notification Flow

```
1. User clicks "Enable Notifications"
   ↓
2. Browser requests permission
   ↓
3. Service worker registers (sw.js)
   ↓
4. Browser creates push subscription
   ↓
5. Subscription saved to database (POST /api/push-subscribe)
   ↓
6. Server sends push when notification created
   ↓
7. Service worker receives push (sw.js)
   ↓
8. Native notification shown to user
   ↓
9. User clicks notification → opens app at specific URL
```

## Emergency Alert Push

Emergency alerts automatically trigger push notifications to all admin roles:

- ADMIN
- DIRECTOR
- HR
- REGISTER_MANAGER

This happens in `src/app/api/emergency/route.js`:

```javascript
// Send push notification to admin devices
sendPushToRoles(['ADMIN', 'DIRECTOR', 'HR', 'REGISTER_MANAGER'], {
  title: '🚨 EMERGENCY ALERT',
  message: notificationMessage,
  type: 'ERROR',
  link: '/admin/emergency-reports'
});
```

## Browser Support

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ (16.4+) | ✅ (16.4+) |
| Edge | ✅ | ✅ |

## Troubleshooting

### Notifications not showing

1. Check if VAPID keys are configured in `.env`
2. Verify HTTPS is enabled (or localhost)
3. Check browser notification permissions
4. Ensure service worker is registered: `navigator.serviceWorker.getRegistrations()`

### Permission denied

- User must manually enable in browser settings
- Cannot be re-prompted after denial

### Subscription not saving

- Check database connection
- Verify `PushSubscription` table exists
- Check API endpoint `/api/push-subscribe` is working

## Future Improvements

1. **Silent Push** - Background data sync
2. **Notification Groups** - Group related notifications
3. **Rich Notifications** - Images, action buttons
4. **Topic Subscriptions** - Subscribe to specific notification types
5. **Push Analytics** - Track delivery and click rates
