import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

function authenticate(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (err) {
    return null;
  }
}

// DELETE /api/staff-area/newsletters/[id]
export async function DELETE(request, { params }) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const newsletterId = parseInt(id, 10);
    if (isNaN(newsletterId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.staffNewsletter.delete({
      where: { id: newsletterId },
    });

    return NextResponse.json({ success: true, message: 'Newsletter deleted successfully' });
  } catch (error) {
    console.error('Error deleting newsletter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete newsletter', details: error.message },
      { status: 500 }
    );
  }
}
