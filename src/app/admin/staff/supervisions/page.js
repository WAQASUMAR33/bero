'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import SupervisionsTracker from '../../staff-management/components/SupervisionsTracker';
import StaffNavTabs from '../../staff-management/components/StaffNavTabs';
import StaffFileModal from '../../components/StaffFileModal';

export default function SupervisionsPage() {
  const [user, setUser] = useState(null);
  const [viewStaffId, setViewStaffId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <StaffNavTabs activeTab="supervisions" />
            <SupervisionsTracker
              currentUser={user}
              onViewStaff={(staffId) => setViewStaffId(staffId)}
            />
          </div>
        </main>
      </div>

      <StaffFileModal
        staffId={viewStaffId}
        isOpen={Boolean(viewStaffId)}
        onClose={() => setViewStaffId(null)}
        currentUser={user}
      />
    </div>
  );
}
