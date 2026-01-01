'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TEAM_MEMBER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
};

async function getTeamById(teamId) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        select: TEAM_MEMBER_SELECT,
      },
    },
  });
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const teamId = parseInt(id, 10);
    if (Number.isNaN(teamId)) {
      return NextResponse.json({ success: false, error: 'Invalid team id' }, { status: 400 });
    }

    const team = await getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: team });
  } catch (error) {
    console.error('GET /api/teams/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const teamId = parseInt(id, 10);
    if (Number.isNaN(teamId)) {
      return NextResponse.json({ success: false, error: 'Invalid team id' }, { status: 400 });
    }

    const team = await getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, memberIds } = body || {};

    const trimmedName = typeof name === 'string' && name.trim().length > 0 ? name.trim() : team.name;
    const requestedMemberIds = Array.isArray(memberIds)
      ? [...new Set(memberIds.map((id) => parseInt(id, 10)).filter((id) => Number.isInteger(id)))]
      : team.members.map((member) => member.id);

    const currentMemberIds = new Set(team.members.map((member) => member.id));
    const requestedMemberIdSet = new Set(requestedMemberIds);

    const membersToRemove = [...currentMemberIds].filter((id) => !requestedMemberIdSet.has(id));
    const potentialAdditions = requestedMemberIds.filter((id) => !currentMemberIds.has(id));

    if (potentialAdditions.length > 0) {
      const conflicts = await prisma.user.findMany({
        where: {
          id: { in: potentialAdditions },
          NOT: { teamId: null },
          teamId: { not: teamId },
        },
        select: { id: true, firstName: true, lastName: true },
      });

      if (conflicts.length > 0) {
        const names = conflicts.map((user) => `${user.firstName} ${user.lastName}`).join(', ');
        return NextResponse.json(
          { success: false, error: `Already assigned to another team: ${names}` },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.team.update({ where: { id: teamId }, data: { name: trimmedName } });

      if (membersToRemove.length) {
        await tx.user.updateMany({ where: { id: { in: membersToRemove } }, data: { teamId: null } });
      }

      if (potentialAdditions.length) {
        await tx.user.updateMany({ where: { id: { in: potentialAdditions } }, data: { teamId } });
      }
    });

    const updatedTeam = await getTeamById(teamId);
    return NextResponse.json({ success: true, data: updatedTeam });
  } catch (error) {
    console.error('PUT /api/teams/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const teamId = parseInt(id, 10);
    if (Number.isNaN(teamId)) {
      return NextResponse.json({ success: false, error: 'Invalid team id' }, { status: 400 });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } });
    if (!team) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.user.updateMany({ where: { teamId }, data: { teamId: null } }),
      prisma.team.delete({ where: { id: teamId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/teams/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete team' }, { status: 500 });
  }
}
