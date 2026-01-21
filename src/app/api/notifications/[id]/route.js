import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PATCH(request, { params }) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { id } = params;
        const { userId } = decoded;

        // Verify ownership
        const notification = await prisma.notification.findUnique({
            where: { id: parseInt(id) }
        });

        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        if (notification.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { isRead } = body;

        const updated = await prisma.notification.update({
            where: { id: parseInt(id) },
            data: { isRead }
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { id } = params;
        const { userId } = decoded;

        const notification = await prisma.notification.findUnique({
            where: { id: parseInt(id) }
        });

        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        if (notification.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await prisma.notification.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true, message: 'Deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
