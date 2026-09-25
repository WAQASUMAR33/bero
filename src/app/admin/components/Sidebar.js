'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { getAllUserPermissions } from '@/lib/permissions';

export default function Sidebar({ user }) {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [expandedItems, setExpandedItems] = useState({});
  const [showLogoutDropdown, setShowLogoutDropdown] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLogoutDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Listen for beforeinstallprompt event for PWA installation
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Set active item based on current pathname
  useEffect(() => {
    const currentPath = pathname;

    // Check main menu items (exact match or starts with for sub-pages)
    const mainItem = allMenuItems.find(item =>
      item.path && (item.path === currentPath || currentPath.startsWith(item.path + '/'))
    );
    if (mainItem) {
      setActiveItem(mainItem.name);
      return;
    }

    // Check submenu items
    for (const item of allMenuItems) {
      if (item.subItems) {
        const subItem = item.subItems.find(sub => {
          const basePath = sub.path ? sub.path.split('?')[0] : '';
          return basePath && (basePath === currentPath || currentPath.startsWith(basePath + '/'));
        });
        if (subItem) {
          setActiveItem(subItem.name);
          setExpandedItems(prev => ({ ...prev, [item.id]: true }));
          return;
        }
      }
    }

    // Default to Dashboard if no match found
    if (currentPath === '/admin') {
      setActiveItem('Dashboard');
    }
  }, [pathname]);

  // Role-based menu items
  const allMenuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      permission: 'dashboard.view',
      path: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      ),
      hasArrow: false,
    },
    {
      id: 'daily-task',
      name: 'Daily Task',
      permission: 'daily-tasks.manage',
      path: '/admin/daily-tasks',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      hasArrow: false,
    },
    {
      id: 'rota',
      name: 'Rota',
      permission: 'rota.manage',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      hasArrow: true,
      subItems: [
        {
          id: 'my-rota',
          name: 'My Rota',
          permission: 'rota.view',
          path: '/admin/my-rota',
        },
        {
          id: 'manage-rota',
          name: 'Manage Rota',
          permission: 'rota.manage',
          path: '/admin/manage-rota',
        },
      ],
    },
    {
      id: 'setup',
      name: 'Setup',
      permission: 'setup.manage',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
      hasArrow: true,
      subItems: [
        {
          id: 'funder-management',
          name: 'Funder Management',
          permission: 'setup.manage',
          path: '/admin/funder-management',
        },
        {
          id: 'region-management',
          name: 'Region Management',
          permission: 'setup.manage',
          path: '/admin/region-management',
        },
        {
          id: 'shift-run-management',
          name: 'Shift Run Management',
          permission: 'setup.manage',
          path: '/admin/shift-run-management',
        },
        {
          id: 'care-plan',
          name: 'Care Plan',
          permission: 'care-plan.manage',
          path: '/admin/care-plan',
        },
      ],
    },
    {
      id: 'staff',
      name: 'Staff',
      permission: 'users.view',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      ),
      hasArrow: true,
      subItems: [
        {
          id: 'staff-management',
          name: 'Staff Management',
          permission: 'users.view',
          path: '/admin/staff-management',
        },
        {
          id: 'staff-supervisions',
          name: 'Supervisions',
          permission: 'users.view',
          path: '/admin/staff/supervisions',
        },
        {
          id: 'staff-appraisals',
          name: 'Appraisals',
          permission: 'users.view',
          path: '/admin/staff/appraisals',
        },
        {
          id: 'staff-probation',
          name: 'Probation Reviews',
          permission: 'users.view',
          path: '/admin/staff/probation',
        },
        {
          id: 'staff-sponsorship',
          name: 'Sponsorship & Visa',
          permission: 'users.view',
          path: '/admin/staff/sponsorship',
        },
        {
          id: 'staff-pdp',
          name: 'PDP Tracker',
          permission: 'users.view',
          path: '/admin/staff/pdp',
        },
        {
          id: 'teams',
          name: 'Teams',
          permission: 'staff.manage',
          path: '/admin/teams',
        },
        {
          id: 'role-management',
          name: 'Roles',
          permission: 'roles.manage',
          path: '/admin/role-management',
        },
      ],
    },
    {
      id: 'clock-in-out',
      name: 'Clock In Out',
      permission: 'clock-in-out.manage',
      path: '/admin/clock-in-out',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'cqc-inspection',
      name: 'CQC Inspection',
      permission: 'cqc-inspection.manage',
      path: '/admin/cqc-inspection',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      hasArrow: false,
    },
    {
      id: 'enquiries',
      name: 'Enquiries',
      permission: 'enquiries.view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      hasArrow: true,
      subItems: [
        {
          id: 'all-enquiries',
          name: 'All Enquiries',
          permission: 'enquiries.view',
          path: '/admin/enquiries',
        },
        {
          id: 'live-enquiries',
          name: 'Live Pipeline',
          permission: 'enquiries.view',
          path: '/admin/enquiries?tab=LIVE',
        },
        {
          id: 'held-enquiries',
          name: 'Held Enquiries',
          permission: 'enquiries.view',
          path: '/admin/enquiries?tab=HELD',
        },
        {
          id: 'closed-enquiries',
          name: 'Closed & Admitted',
          permission: 'enquiries.view',
          path: '/admin/enquiries?tab=CLOSED',
        },
      ],
    },
    {
      id: 'investigations',
      name: 'Investigations',
      permission: 'investigations.view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      ),
      hasArrow: true,
      subItems: [
        {
          id: 'all-investigations',
          name: 'All Investigations',
          permission: 'investigations.view',
          path: '/admin/investigations',
        },
        {
          id: 'investigations-in-progress',
          name: 'In Progress',
          permission: 'investigations.view',
          path: '/admin/investigations?progress=In%20Progress',
        },
        {
          id: 'investigations-not-started',
          name: 'Not Started',
          permission: 'investigations.view',
          path: '/admin/investigations?progress=Not%20Started',
        },
        {
          id: 'investigations-completed',
          name: 'Completed',
          permission: 'investigations.view',
          path: '/admin/investigations?progress=Completed',
        },
      ],
    },
    {
      id: 'accidents-incidents',
      name: 'Accidents & Incidents',
      permission: 'daily-tasks.manage',
      path: '/admin/incidents',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      hasArrow: false,
    },
    {
      id: 'quality-assurance',
      name: 'Quality Assurance',
      permission: 'quality-assurance.view',
      path: '/admin/quality-assurance',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      hasArrow: false,
    },
    {
      id: 'kpi',
      name: 'KPI & Evaluations',
      permission: 'kpi.view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      hasArrow: true,
      subItems: [
        {
          id: 'all-kpis',
          name: 'KPI Dashboard',
          permission: 'kpi.view',
          path: '/admin/kpi',
        },
        {
          id: 'kpi-monthly-evaluations',
          name: 'Monthly Evaluations',
          permission: 'kpi.view',
          path: '/admin/kpi?tab=monthly',
        },
        {
          id: 'kpi-action-plan',
          name: 'Action Plan Tracker',
          permission: 'kpi.view',
          path: '/admin/kpi?tab=action-plan',
        },
        {
          id: 'kpi-data-collation',
          name: 'Data Collation Hub',
          permission: 'kpi.view',
          path: '/admin/kpi?tab=collation',
        },
        {
          id: 'kpi-performance-analytics',
          name: 'Performance Trends',
          permission: 'kpi.view',
          path: '/admin/kpi?tab=analytics',
        },
      ],
    },
    {
      id: 'finances',
      name: 'Finances & P&L',
      permission: 'finance.view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      hasArrow: true,
      subItems: [
        {
          id: 'finances-hub',
          name: 'Finances Dashboard',
          permission: 'finance.view',
          path: '/admin/finances',
        },
        {
          id: 'finances-pnl',
          name: 'P&L Statement',
          permission: 'finance.view',
          path: '/admin/finances?tab=pnl',
        },
        {
          id: 'finances-service-users',
          name: 'Service User Finances',
          permission: 'finance.view',
          path: '/admin/finances?tab=service-users',
        },
        {
          id: 'finances-transactions',
          name: 'Manual Journal & Entries',
          permission: 'finance.view',
          path: '/admin/finances?tab=transactions',
        },
        {
          id: 'finances-analytics',
          name: 'Performance Trends',
          permission: 'finance.view',
          path: '/admin/finances?tab=analytics',
        },
      ],
    },
    {
      id: 'wages',
      name: 'Wages & Timesheets',
      permission: 'wages.view_all',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      hasArrow: true,
      subItems: [
        {
          id: 'wages-hub',
          name: 'Payroll Overview',
          permission: 'wages.view_all',
          path: '/admin/wages',
        },
        {
          id: 'wages-clock-in',
          name: 'Clock-In Hours',
          permission: 'wages.view_all',
          path: '/admin/wages?tab=clock-in',
        },
        {
          id: 'wages-manual',
          name: 'Manual Adjustments',
          permission: 'wages.view_all',
          path: '/admin/wages?tab=manual',
        },
        {
          id: 'wages-amendments',
          name: 'Amendment Requests',
          permission: 'wages.view_all',
          path: '/admin/wages?tab=amendments',
        },
      ],
    },
    {
      id: 'governance',
      name: 'Governance & Trackers',
      permission: 'governance.view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      hasArrow: true,
      subItems: [
        {
          id: 'governance-hub',
          name: 'All Trackers Hub',
          permission: 'governance.view',
          path: '/admin/governance',
        },
        {
          id: 'cqc-tracker',
          name: 'CQC Notifications',
          permission: 'governance.view',
          path: '/admin/governance/cqc-notifications',
        },
        {
          id: 'safeguarding-tracker',
          name: 'Safeguarding Tracker',
          permission: 'governance.view',
          path: '/admin/governance/safeguarding',
        },
        {
          id: 'riddor-tracker',
          name: 'RIDDOR Tracker',
          permission: 'governance.view',
          path: '/admin/governance/riddor',
        },
        {
          id: 'sar-tracker',
          name: 'SAR Tracker',
          permission: 'governance.view',
          path: '/admin/governance/subject-access-requests',
        },
        {
          id: 'accidents-tracker',
          name: 'Accidents & Falls Log',
          permission: 'governance.view',
          path: '/admin/incidents',
        },
      ],
    },
    {
      id: 'holidays',
      name: 'Holidays',
      permission: 'holidays.manage',
      path: '/admin/holidays',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      hasArrow: false,
    },
    {
      id: 'calendar',
      name: 'Calendar',
      permission: 'calendar.manage',
      path: '/admin/calendar',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      hasArrow: false,
    },
    {
      id: 'maintenance',
      name: 'Maintenance',
      permission: 'maintenance.manage',
      path: '/admin/maintenance',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
      hasArrow: false,
    },
    {
      id: 'handovers',
      name: 'Handovers',
      permission: 'handovers.manage',
      path: '/admin/handovers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      hasArrow: false,
    },
    {
      id: 'policy-procedures',
      name: 'Policy and Procedures',
      permission: 'policy-procedures.manage',
      path: '/admin/policy-procedures',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      ),
      hasArrow: false,
    },
    {
      id: 'profile',
      name: 'Profile',
      permission: 'profile.view',
      path: '/admin/profile',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      ),
      hasArrow: false,
    },
    {
      id: 'service-users',
      name: 'Service Users',
      permission: 'service-users.manage',
      path: '/admin/service-users',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      ),
      hasArrow: false,
    },
    {
      id: 'emergency-reports',
      name: 'Emergency Reports',
      permission: 'emergency.view',
      path: '/admin/emergency-reports',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      hasArrow: false,
    },
  ];

  // Filter menu items based on user permissions (with permission inheritance)
  const allPermissions = getAllUserPermissions(user);
  const adminRoles = ['ADMIN', 'DIRECTOR', 'HR', 'REGISTER_MANAGER', 'DEPUTY_MANAGER', 'BUSINESS_DEVELOPMENT_MANAGER', 'SERVICE_LEAD'];
  const isAdminRole = adminRoles.includes(user?.role?.name);

  const menuItems = allMenuItems.filter(item => {
    // Only management and Admin will need to be able to see Finances and Wages oversight
    if (item.id === 'finances' || item.id === 'wages') {
      return isAdminRole || user?.role?.name === 'ADMIN';
    }
    // Emergency reports visible to admin roles
    if (item.id === 'emergency-reports') {
      return isAdminRole || allPermissions.includes(item.permission);
    }
    return allPermissions.includes(item.permission) || user?.role?.name === 'ADMIN';
  });

  // Don't render sidebar if user is not loaded
  if (!user) {
    return null;
  }

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleInstallApp = async () => {
    setShowLogoutDropdown(false);

    // Check if we have a deferred prompt (PWA install prompt)
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      // Clear the deferredPrompt so it can only be used once
      setDeferredPrompt(null);
      return;
    }

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      alert('This app is already installed on your device.');
      return;
    }

    // Try to detect if it's iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      alert('To install this app on iOS:\n1. Tap the Share button (square with arrow)\n2. Tap "Add to Home Screen"\n3. Tap "Add"');
    } else if (/Android/.test(navigator.userAgent)) {
      alert('To install this app on Android:\n1. Tap the menu (three dots) in your browser\n2. Tap "Install app" or "Add to Home Screen"');
    } else {
      alert('To install this app:\nLook for the install icon (⊕) in your browser\'s address bar or menu.\n\nIf it doesn\'t appear, this app may not support installation on your device.');
    }
  };

  return (
    <aside className="fixed left-0 top-0 w-64 bg-white border-r border-gray-200/90 shadow-xs h-screen flex flex-col z-30 hidden lg:flex select-none">
      {/* Logo Section */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <Image
            src="/assets/logo2.png"
            alt="BEERU Logo"
            width={125}
            height={55}
            className="object-contain"
            priority
          />
        </div>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#224fa6] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
          Admin
        </span>
      </div>

      {/* Menu Items with Sleek Scrollbar */}
      <div className="flex-1 overflow-y-auto sleek-scrollbar px-3 py-3">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.id} className="relative">
              <button
                type="button"
                onClick={() => {
                  setActiveItem(item.name);
                  if (item.path) {
                    router.push(item.path);
                  } else if (item.hasArrow) {
                    toggleExpanded(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between py-2 px-2.5 rounded-xl text-left text-xs sm:text-[13px] tracking-tight transition-all duration-150 group cursor-pointer ${
                  activeItem === item.name
                    ? 'bg-blue-50/90 text-[#224fa6] font-semibold shadow-2xs'
                    : 'text-gray-700 hover:text-gray-950 hover:bg-gray-100/70 font-medium'
                }`}
              >
                <div className="flex items-center min-w-0">
                  <span
                    className={`mr-2.5 shrink-0 transition-colors ${
                      activeItem === item.name
                        ? 'text-[#224fa6]'
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.name}</span>
                </div>
                {item.hasArrow && (
                  <svg
                    className={`w-3.5 h-3.5 shrink-0 ml-2 transition-transform duration-200 text-gray-400 group-hover:text-gray-600 ${
                      expandedItems[item.id] ? 'rotate-90 text-[#224fa6]' : ''
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {/* Submenu Items with Connecting Guide Line */}
              {item.subItems && expandedItems[item.id] && (
                <div className="ml-5 pl-2.5 border-l-2 border-gray-100 space-y-0.5 my-1">
                  {item.subItems
                    .filter(
                      (subItem) =>
                        allPermissions.includes(subItem.permission) ||
                        user?.role?.name === 'ADMIN'
                    )
                    .map((subItem) => (
                      <button
                        key={subItem.id}
                        type="button"
                        onClick={() => {
                          setActiveItem(subItem.name);
                          router.push(subItem.path);
                        }}
                        className={`w-full flex items-center py-1.5 px-2.5 rounded-lg text-left text-xs tracking-tight transition-colors cursor-pointer ${
                          activeItem === subItem.name
                            ? 'bg-blue-50 text-[#224fa6] font-semibold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 font-medium'
                        }`}
                      >
                        <span className="truncate">{subItem.name}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50 relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowLogoutDropdown(!showLogoutDropdown)}
          className="w-full flex items-center p-2 rounded-xl transition-all duration-150 hover:bg-white hover:shadow-xs border border-transparent hover:border-gray-200/80 cursor-pointer"
        >
          <div className="w-8 h-8 bg-[#224fa6] rounded-full flex items-center justify-center text-white text-xs font-bold mr-2.5 shadow-xs shrink-0">
            {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] text-gray-500 truncate">
              {user?.role?.displayName || user?.role?.name || 'User'}
            </p>
          </div>
          <svg
            className={`w-3.5 h-3.5 text-gray-400 shrink-0 ml-1 transition-transform duration-200 ${
              showLogoutDropdown ? 'rotate-180 text-gray-600' : ''
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* User Dropdown */}
        {showLogoutDropdown && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-xl shadow-xl overflow-hidden p-1 z-50">
            <button
              type="button"
              onClick={handleInstallApp}
              className="w-full flex items-center px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Install App
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}