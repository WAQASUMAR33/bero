import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/teams - list teams with members
export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
    return NextResponse.json({ success: true, data: teams });
  } catch (e) {
    console.error('GET /api/teams error:', e);
    return NextResponse.json({ success: false, error: 'Failed to fetch teams' }, { status: 500 });
  }
}

// POST /api/teams - create team, assign members (each user can belong to only one team)
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, memberIds } = body || {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Team name is required' }, { status: 400 });
    }

    const uniqueMemberIds = Array.isArray(memberIds)
      ? [...new Set(memberIds.map((v) => parseInt(v, 10)).filter((v) => Number.isInteger(v)))]
      : [];

    // Ensure selected users are not already in another team
    if (uniqueMemberIds.length > 0) {
      const existingAssignments = await prisma.user.findMany({
        where: { id: { in: uniqueMemberIds }, NOT: { teamId: null } },
        select: { id: true, firstName: true, lastName: true }
      });
      if (existingAssignments.length > 0) {
        const names = existingAssignments.map((u) => `${u.firstName} ${u.lastName}`).join(', ');
        return NextResponse.json({ success: false, error: `Already assigned to a team: ${names}` }, { status: 400 });
      }
    }

    const created = await prisma.team.create({
      data: { name: name.trim() }
    });

    if (uniqueMemberIds.length > 0) {
      await prisma.user.updateMany({ where: { id: { in: uniqueMemberIds } }, data: { teamId: created.id } });
    }

    const full = await prisma.team.findUnique({
      where: { id: created.id },
      include: { members: { select: { id: true, firstName: true, lastName: true, email: true } } }
    });

    return NextResponse.json({ success: true, data: full }, { status: 201 });
  } catch (e) {
    console.error('POST /api/teams error:', e);
    return NextResponse.json({ success: false, error: 'Failed to create team' }, { status: 500 });
  }
}


