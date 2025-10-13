import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const unread = searchParams.get('unread');

    // Mock notifications data
    const notifications = [
      {
        id: 1,
        title: 'New Staff Member Added',
        message: 'John Doe has been added to the team',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        title: 'Shift Assignment',
        message: 'You have been assigned to a new shift',
        type: 'warning',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        title: 'System Update',
        message: 'System maintenance scheduled for tonight',
        type: 'info',
        read: true,
        createdAt: new Date().toISOString(),
      },
    ];

    let filteredNotifications = notifications;

    if (unread === 'true') {
      filteredNotifications = notifications.filter(n => !n.read);
    }

    return NextResponse.json({
      notifications: filteredNotifications,
      unreadCount: notifications.filter(n => !n.read).length,
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
