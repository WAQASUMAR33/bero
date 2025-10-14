'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Header({ user }) {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef(null);

  return (
    <header className="sticky top-0 bg-white shadow-sm border-b border-gray-200 px-6 py-4 z-30">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search type of keywords"
              className="pl-4 pr-12 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#224fa6] focus:border-transparent w-64"
            />
            <button className="absolute right-0 top-0 h-full px-3 bg-white border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Notification dot */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings with Dropdown */}
            <div 
              className="relative" 
              ref={dropdownRef}
              onMouseEnter={() => setShowSettingsDropdown(true)}
              onMouseLeave={() => setShowSettingsDropdown(false)}
            >
              <button 
                className="p-2 text-gray-400 hover:text-[#224fa6] transition-all duration-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 rounded-lg group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#224fa6]/5 to-[#3270e9]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Settings Dropdown */}
              <div className={`absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-xl shadow-2xl z-50 transition-all duration-300 ease-out ${
                showSettingsDropdown 
                  ? 'opacity-100 visible translate-y-0' 
                  : 'opacity-0 invisible -translate-y-2'
              }`}>
                <div className="py-3">
                  {/* Header */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Quick Access</h3>
                    <p className="text-xs text-gray-500">Management & Settings</p>
                  </div>
                  
                  {/* Management Links */}
                  <div className="px-2 py-1">
                    <button
                      onClick={() => {
                        router.push('/admin/funder-management');
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 rounded-lg transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V3m0 9v3m0 0V9m0 3a2 2 0 110 4 2 2 0 010-4zm-7 4h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Funder Management</div>
                        <div className="text-xs text-gray-500">Manage funding sources</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => {
                        router.push('/admin/region-management');
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-700 rounded-lg transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Region Management</div>
                        <div className="text-xs text-gray-500">Manage locations</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => {
                        router.push('/admin/shift-run-management');
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-700 rounded-lg transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10h8m-8 0a2 2 0 002 2h2a2 2 0 002-2M9 7h6a2 2 0 012 2v5a2 2 0 01-2 2H9m10 0a2 2 0 002-2V9a2 2 0 00-2-2h-2a2 2 0 00-2 2v5a2 2 0 002 2h2z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Shift Run Management</div>
                        <div className="text-xs text-gray-500">Manage schedules</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => {
                        router.push('/admin/staff-management');
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:text-orange-700 rounded-lg transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Users Management</div>
                        <div className="text-xs text-gray-500">Manage permissions</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => {
                        router.push('/admin/profile');
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 hover:text-indigo-700 rounded-lg transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Profile</div>
                        <div className="text-xs text-gray-500">Personal settings</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Divider */}
                  <div className="mx-3 my-2">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                  </div>
                  
                  {/* Settings Link */}
                  <div className="px-2 py-1">
                    <button
                      onClick={() => {
                        router.push('/admin/settings');
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-[#224fa6]/10 hover:to-[#3270e9]/10 hover:text-[#224fa6] rounded-lg transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-[#224fa6] to-[#3270e9] rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Settings</div>
                        <div className="text-xs text-gray-500">System configuration</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-[#224fa6] group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {/* Message count */}
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">2</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}