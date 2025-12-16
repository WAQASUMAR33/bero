'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function CQCInspectionPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
    setIsLoading(false);
  }, [router]);

  const inspectionOptions = [
    {
      id: 'staff-overworked',
      title: 'Are staff overworked?',
      description: 'Monitor staff workload, working hours, and identify potential overwork situations',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-blue-600',
      path: '/admin/cqc-inspection/staff-overworked'
    },
    {
      id: 'care-plans',
      title: 'How person centered are your care plans?',
      description: 'Evaluate the person-centered approach in care planning and delivery',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gradient: 'from-green-500 to-green-600',
      path: '/admin/cqc-inspection/care-plans'
    },
    {
      id: 'care-plans-reading',
      title: 'Are carers reading care plans at the start or before a shift?',
      description: 'Track care plan access and reading compliance by carers',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      gradient: 'from-purple-500 to-purple-600',
      path: '/admin/cqc-inspection/care-plans-reading'
    },
    {
      id: 'medicine-refusal',
      title: 'How do you ensure medicines are not being refused?',
      description: 'Monitor medicine administration and refusal patterns',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      gradient: 'from-red-500 to-red-600',
      path: '/admin/cqc-inspection/medicine-refusal'
    },
    {
      id: 'air-filter',
      title: 'For house keeping tasks do you check the air filter on the clothes dryer on a weekly basis?',
      description: 'Track weekly air filter checks for clothes dryers',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      gradient: 'from-indigo-500 to-indigo-600',
      path: '/admin/cqc-inspection/air-filter'
    },
    {
      id: 'late-arrivals',
      title: 'How do you monitor carers turning up late?',
      description: 'Track and analyze carer punctuality and late arrivals',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-pink-500 to-pink-600',
      path: '/admin/cqc-inspection/late-arrivals'
    }
  ];

  const handleOptionClick = (path) => {
    router.push(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">CQC Inspection</h1>
                <p className="text-gray-600">Inspection team dashboard for quality assurance checks</p>
              </div>
            </div>
          </div>

          {/* Inspection Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inspectionOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.path)}
                className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200 text-left group hover:-translate-y-1"
              >
                <div className="flex items-start space-x-4">
                  <div className={`bg-gradient-to-r ${option.gradient} p-3 rounded-lg text-white flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#224fa6] transition-colors duration-200">
                      {option.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {option.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-[#224fa6] group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Info Card */}
          <div className="mt-8 bg-gradient-to-r from-[#224fa6] to-[#3270e9] rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">About CQC Inspection</h3>
                <p className="text-sm opacity-90">
                  This dashboard provides comprehensive inspection tools for the Care Quality Commission (CQC) inspection team. 
                  Each inspection area can be accessed by clicking on the respective card above. Use these tools to evaluate 
                  compliance, quality of care, and operational standards.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

