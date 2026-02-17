import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Verifies the JWT token from the request and returns the decoded user payload.
 * Returns null if token is missing or invalid.
 */
export async function verifyToken(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return null;
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return null;
    }
}

/**
 * Gets the current authenticated user from the database.
 * Returns the full user object with role and permissions, or null if not authenticated.
 */
export async function getCurrentUser(request) {
    try {
        const decoded = await verifyToken(request);

        if (!decoded || !decoded.userId) {
            return null;
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                role: true,
                permissions: true
            }
        });

        return user;
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
}
