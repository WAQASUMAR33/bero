'use client';

import { 
  Calendar, 
  ClipboardList, 
  TrendingUp, 
  Database,
  Layers
} from 'lucide-react';

const TABS = [
  { id: 'monthly', label: 'Monthly Evaluations', icon: Calendar, description: 'Evaluation sheets matching KPI tracker' },
  { id: 'action-plan', label: 'Action Plan Register', icon: ClipboardList, description: 'Escalated actions & ownership' },
  { id: 'analytics', label: 'Performance Analytics', icon: TrendingUp, description: 'Trends & compliance ratings' },
  { id: 'collation', label: 'Data Collation Hub', icon: Database, description: 'Live system metrics & sources' }
];

export default function KpiNavTabs({ activeTab, onTabChange, counts = {} }) {
  return (
    <div className="mb-6 bg-white p-1.5 sm:p-2 rounded-2xl border border-gray-200/90 shadow-xs w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 w-full">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts[tab.id];

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

              {count !== undefined && (
                <span
                  className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
