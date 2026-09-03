'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const APP_PAGES = [
  { name: 'Dashboard', path: '/admin', description: 'Overview and analytics', keywords: ['dashboard', 'home', 'stats', 'analytics', 'overview'] },
  { name: 'Manage Rota', path: '/admin/manage-rota', description: 'Create and manage shifts schedule', keywords: ['rota', 'shifts', 'schedule', 'manage rota', 'roster', 'calendar'] },
  { name: 'My Rota', path: '/admin/my-rota', description: 'View your assigned shifts', keywords: ['my rota', 'my shifts', 'assigned'] },
  { name: 'Service Users', path: '/admin/service-users', description: 'List of residents and service users', keywords: ['service users', 'residents', 'clients', 'patients', 'admission', 'service seekers'] },
  { name: 'Care Plan', path: '/admin/care-plan', description: 'Care plans and assessments', keywords: ['care plan', 'assessment', 'support plan', 'outcomes', 'risk'] },
  { name: 'Daily Tasks', path: '/admin/daily-tasks', description: 'Monitor daily caretaker tasks', keywords: ['daily tasks', 'tasks', 'medication', 'fluid', 'food', 'bathing'] },
  { name: 'Handovers', path: '/admin/handovers', description: 'Shift handover logs and notes', keywords: ['handovers', 'handover notes', 'shift handover'] },
  { name: 'Staff Management', path: '/admin/staff-management', description: 'Employees, care workers and admins', keywords: ['staff', 'employees', 'carers', 'care workers', 'users', 'team members'] },
  { name: 'Teams', path: '/admin/teams', description: 'Manage teams and team assignments', keywords: ['teams', 'groups', 'units'] },
  { name: 'Shift Run Management', path: '/admin/shift-run-management', description: 'Configure shift runs and routes', keywords: ['shift runs', 'runs', 'routes'] },
  { name: 'Calendar', path: '/admin/calendar', description: 'Events, visits, and meetings calendar', keywords: ['calendar', 'events', 'meetings', 'visits', 'appointments'] },
  { name: 'Holidays', path: '/admin/holidays', description: 'Leave requests and holiday approvals', keywords: ['holidays', 'leave', 'vacation', 'time off', 'sick leave'] },
  { name: 'CQC Inspection', path: '/admin/cqc-inspection', description: 'CQC compliance and inspection reports', keywords: ['cqc', 'inspection', 'compliance', 'audit', 'hours'] },
  { name: 'CQC Late Arrivals', path: '/admin/cqc-inspection/late-arrivals', description: 'Monitor late clock-ins', keywords: ['late', 'late arrivals', 'punctuality', 'cqc'] },
  { name: 'CQC Staff Overworked', path: '/admin/cqc-inspection/staff-overworked', description: 'Monitor overworked staff hours', keywords: ['overworked', 'overtime', 'fatigue', 'cqc'] },
  { name: 'Policy & Procedures', path: '/admin/policy-procedures', description: 'Company policies and signatures', keywords: ['policies', 'policy', 'procedures', 'documents', 'sign'] },
  { name: 'Quality Assurance', path: '/admin/quality-assurance', description: 'Feedback, complaints, and suggestions', keywords: ['quality assurance', 'qa', 'feedback', 'complaints', 'suggestions', 'compliments'] },
  { name: 'Maintenance Issues', path: '/admin/maintenance', description: 'Property and equipment maintenance tickets', keywords: ['maintenance', 'repairs', 'issues', 'facilities'] },
  { name: 'Emergency Reports', path: '/admin/emergency-reports', description: 'View logged emergency alerts', keywords: ['emergency', 'panic', 'alerts', 'sos'] },
  { name: 'Clock In / Out Records', path: '/admin/clock-in-out', description: 'Real-time attendance logs', keywords: ['clock in', 'clock out', 'attendance', 'timesheets'] },
  { name: 'Role Management', path: '/admin/role-management', description: 'System permissions and access roles', keywords: ['roles', 'permissions', 'access control', 'privileges'] },
  { name: 'Region Management', path: '/admin/region-management', description: 'Geographical regions and branches', keywords: ['regions', 'areas', 'locations', 'branches'] },
  { name: 'Funder Management', path: '/admin/funder-management', description: 'Local authorities and funding sources', keywords: ['funders', 'funding', 'contracts', 'billing', 'council'] },
  { name: 'Notifications', path: '/admin/notifications', description: 'System notifications center', keywords: ['notifications', 'alerts', 'inbox', 'messages'] },
  { name: 'Settings', path: '/admin/settings', description: 'General system settings', keywords: ['settings', 'configuration', 'preferences'] }
];

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q) {
      return NextResponse.json({
        pages: [],
        serviceUsers: [],
        staff: [],
        teams: [],
        policies: [],
        maintenance: [],
        qualityAssurance: []
      });
    }

    const queryLower = q.toLowerCase();

    // 1. Filter matching app pages
    const matchingPages = APP_PAGES.filter(p =>
      p.name.toLowerCase().includes(queryLower) ||
      p.description.toLowerCase().includes(queryLower) ||
      p.keywords.some(k => k.toLowerCase().includes(queryLower))
    ).slice(0, 6);

    // 2. Fetch database results in parallel
    const [
      serviceUsers,
      staff,
      teams,
      policies,
      maintenance,
      qualityAssurance
    ] = await Promise.all([
      // Service Users
      prisma.serviceSeeker ? prisma.serviceSeeker.findMany({
        where: {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { preferredName: { contains: q } },
            { roomNumber: { contains: q } },
          ],
        },
        take: 6,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          preferredName: true,
          roomNumber: true,
          photoUrl: true,
          status: true,
        },
        orderBy: { firstName: 'asc' },
      }).catch(err => {
        console.error('Search service seekers error:', err);
        return [];
      }) : [],

      // Staff / Users
      prisma.user ? prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { username: { contains: q } },
            { email: { contains: q } },
            { phoneNo: { contains: q } },
          ],
        },
        take: 6,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          phoneNo: true,
          profilePic: true,
          status: true,
          role: {
            select: {
              displayName: true,
              name: true,
            },
          },
        },
        orderBy: { firstName: 'asc' },
      }).catch(err => {
        console.error('Search users error:', err);
        return [];
      }) : [],

      // Teams
      prisma.team ? prisma.team.findMany({
        where: {
          name: { contains: q },
        },
        take: 4,
        select: {
          id: true,
          name: true,
          _count: {
            select: { members: true },
          },
        },
        orderBy: { name: 'asc' },
      }).catch(err => {
        console.error('Search teams error:', err);
        return [];
      }) : [],

      // Policies
      prisma.policy ? prisma.policy.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { fileName: { contains: q } },
          ],
        },
        take: 4,
        select: {
          id: true,
          name: true,
          fileName: true,
        },
        orderBy: { name: 'asc' },
      }).catch(err => {
        console.error('Search policies error:', err);
        return [];
      }) : [],

      // Maintenance Issues
      prisma.maintenanceIssue ? prisma.maintenanceIssue.findMany({
        where: {
          OR: [
            { issue: { contains: q } },
            { for: { contains: q } },
          ],
        },
        take: 4,
        select: {
          id: true,
          issueType: true,
          for: true,
          issue: true,
          completed: true,
        },
        orderBy: { createdAt: 'desc' },
      }).catch(err => {
        console.error('Search maintenance error:', err);
        return [];
      }) : [],

      // Quality Assurance
      prisma.qualityAssurance ? prisma.qualityAssurance.findMany({
        where: {
          OR: [
            { from: { contains: q } },
            { youSaid: { contains: q } },
            { weDid: { contains: q } },
          ],
        },
        take: 4,
        select: {
          id: true,
          type: true,
          from: true,
          status: true,
          youSaid: true,
        },
        orderBy: { date: 'desc' },
      }).catch(err => {
        console.error('Search QA error:', err);
        return [];
      }) : [],
    ]);

    const totalCount =
      matchingPages.length +
      serviceUsers.length +
      staff.length +
      teams.length +
      policies.length +
      maintenance.length +
      qualityAssurance.length;

    return NextResponse.json({
      query: q,
      totalCount,
      pages: matchingPages,
      serviceUsers,
      staff,
      teams,
      policies,
      maintenance,
      qualityAssurance,
    });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
