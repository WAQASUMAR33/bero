'use client';

import { Suspense } from 'react';
import InvestigationManager from './components/InvestigationManager';

export default function InvestigationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#224fa6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <InvestigationManager title="Internal Investigations & Audits" />
    </Suspense>
  );
}
