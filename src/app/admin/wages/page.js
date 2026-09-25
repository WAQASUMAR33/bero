'use client';

import { Suspense } from 'react';
import WageManager from './components/WageManager';

export default function WagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#224fa6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <WageManager title="Wages & Timesheet Management" />
    </Suspense>
  );
}
