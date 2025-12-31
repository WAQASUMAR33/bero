'use client';

import Image from 'next/image';
import { useEffect } from 'react';

export default function UseAppPage() {
  useEffect(() => {
    // Clear any stored login data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/assets/logo2.png"
            alt="Logo"
            width={120}
            height={120}
            className="object-contain"
          />
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Please Use the Mobile App
        </h1>

        {/* Message */}
        <div className="space-y-4 mb-8">
          <p className="text-gray-600 leading-relaxed">
            The web portal is only available for Administrators, Managers, and HR staff.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Please download and use the mobile app to access your account.
          </p>
        </div>

        {/* App Store Buttons (Optional - you can add links when available) */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
          >
            Go Back to Login
          </button>
        </div>

        {/* Additional Info */}
        <div className="text-sm text-gray-500 border-t border-gray-200 pt-6">
          <p>Need help? Contact your administrator</p>
        </div>
      </div>
    </div>
  );
}

