'use client';

import { Layers, Activity, PauseCircle, CheckCircle2 } from 'lucide-react';

const TABS = [
  { id: 'ALL', label: 'All Cases', icon: Layers },
  { id: 'LIVE', label: 'Live Pipeline', icon: Activity, countKey: 'live' },
  { id: 'HELD', label: 'Held / Pending', icon: PauseCircle, countKey: 'held' },
  { id: 'CLOSED', label: 'Closed & Admitted', icon: CheckCircle2, countKey: 'closed' }
];

export default function InvestigationNavTabs({ activeTab, onTabChange, counts = {} }) {
  return (
    <div className="mb-6 bg-white p-1.5 sm:p-2 rounded-2xl border border-gray-200/90 shadow-xs w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 w-full">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.countKey ? counts[tab.countKey] ?? 0 : counts.total ?? 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`group w-full py-2.5 px-3 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm tracking-tight transition-all duration-200 flex items-center justify-between gap-2 text-center select-none cursor-pointer border ${
                isActive
                  ? 'bg-[#224fa6] text-white border-[#224fa6] shadow-sm font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 font-medium border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#224fa6]'
                }`} />
                <span className="truncate">{tab.label}</span>
              </div>

              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
