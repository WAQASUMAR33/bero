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
        const subItem = item.subItems.find(sub => 
          sub.path && (sub.path === currentPath || currentPath.startsWith(sub.path + '/'))
        );
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
      id: 'handover',
      name: 'Handover',
      permission: 'handover.manage',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
        </svg>
      ),
      hasArrow: true,
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
      permission: 'staff.manage',
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
          permission: 'staff.manage',
          path: '/admin/staff-management',
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
      id: 'quality-assurance',
      name: 'Quality Assurance',
      permission: 'quality-assurance.manage',
      path: '/admin/quality-assurance',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      hasArrow: true,
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
      hasArrow: true,
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
      hasArrow: true,
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
  ];

  // Filter menu items based on user permissions (with permission inheritance)
  const allPermissions = getAllUserPermissions(user);
  const menuItems = allMenuItems.filter(item => 
    allPermissions.includes(item.permission) || user?.role?.name === 'ADMIN'
  );

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
    <div className="fixed left-0 top-0 w-64 bg-white shadow-lg h-screen flex flex-col z-10 hidden lg:flex">
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <Image
            src="/assets/logo2.png"
            alt="BEERU Logo"
            width={140}
            height={70}
            className="object-contain"
          />
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto">
        <nav className="px-4 pb-4">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  setActiveItem(item.name);
                  if (item.path) {
                    router.push(item.path);
                  } else if (item.hasArrow) {
                    toggleExpanded(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between py-3 px-3 rounded-lg text-left transition-colors ${
                  activeItem === item.name
                    ? 'bg-blue-50 text-[#224fa6]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <span className={`mr-3 ${activeItem === item.name ? 'text-[#224fa6]' : 'text-gray-400'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.name}</span>
                </div>
                {item.hasArrow && (
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      expandedItems[item.id] ? 'rotate-90' : ''
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              {/* Submenu Items */}
              {item.subItems && expandedItems[item.id] && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.subItems
                    .filter(subItem => 
                      allPermissions.includes(subItem.permission) || user?.role?.name === 'ADMIN'
                    )
                    .map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => {
                        setActiveItem(subItem.name);
                        router.push(subItem.path);
                      }}
                      className={`w-full flex items-center py-2 px-3 rounded-lg text-left text-sm transition-colors ${
                        activeItem === subItem.name
                          ? 'bg-blue-50 text-[#224fa6]'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="ml-6">{subItem.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200 relative" ref={dropdownRef}>
        <button 
          onClick={() => setShowLogoutDropdown(!showLogoutDropdown)}
          className="w-full flex items-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
        >
          <div className="w-10 h-10 bg-[#224fa6] rounded-full flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500">{user?.role?.displayName || user?.role?.name || 'User'}</p>
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${showLogoutDropdown ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* User Dropdown */}
        {showLogoutDropdown && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg">
            <button
              onClick={handleInstallApp}
              className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Install App
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}