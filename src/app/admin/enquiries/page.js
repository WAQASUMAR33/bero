'use client';

import { Suspense } from 'react';
import EnquiryManager from './components/EnquiryManager';

export default function EnquiriesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#224fa6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <EnquiryManager title="Enquiries & Referrals Management" />
    </Suspense>
  );
}
