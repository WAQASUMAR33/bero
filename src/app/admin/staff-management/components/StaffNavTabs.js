'use client';

import { useRouter } from 'next/navigation';
import { 
  Users, 
  ClipboardCheck, 
  Award, 
  Clock, 
  Globe, 
  Target 
} from 'lucide-react';

const TABS = [
  { id: 'staff', label: 'Staff Overview', icon: Users, path: '/admin/staff-management' },
  { id: 'supervisions', label: 'Supervisions', icon: ClipboardCheck, path: '/admin/staff/supervisions' },
  { id: 'appraisals', label: 'Appraisals', icon: Award, path: '/admin/staff/appraisals' },
  { id: 'probation', label: 'Probation Reviews', icon: Clock, path: '/admin/staff/probation' },
  { id: 'sponsorship', label: 'Sponsorship & Compliance', icon: Globe, path: '/admin/staff/sponsorship' },
  { id: 'pdp', label: 'PDP Goals', icon: Target, path: '/admin/staff/pdp' }
];

export default function StaffNavTabs({ activeTab, onTabChange }) {
  const router = useRouter();

  const handleSelect = (tab) => {
    if (onTabChange) {
      onTabChange(tab.id);
    } else {
      router.push(tab.path);
    }
  };

  return (
    <div className="mb-6 bg-white p-1.5 sm:p-2 rounded-2xl border border-gray-200/90 shadow-sm w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2 w-full">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab)}
              className={`group w-full py-2.5 px-2.5 sm:px-3 rounded-xl font-semibold text-xs sm:text-[13px] tracking-tight transition-all duration-200 flex items-center justify-center gap-2 text-center select-none cursor-pointer ${
                isActive
                  ? 'bg-[#224fa6] text-white shadow-sm shadow-[#224fa6]/30 font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 font-medium border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#224fa6]'
              }`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
