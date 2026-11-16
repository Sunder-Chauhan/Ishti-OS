import React from 'react';
import Link from 'next/link';
import { IshtiLogo } from './components/brand';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F4ED] text-[#302B2A] flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-6 max-w-md">
        <div className="flex justify-center">
          <IshtiLogo variant="secondary" width={180} decorative />
        </div>
        <h1 className="text-3xl font-serif text-[#711B16] font-bold">Sacred Path Not Found</h1>
        <p className="text-sm text-[#8B6846] leading-relaxed">
          The sanctuary page or ritual guide you are seeking is not located at this coordinate.
        </p>
        <div>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#711B16] text-[#F8F4ED] font-medium text-sm hover:bg-[#8E2018] transition-colors"
          >
            Return to Sanctuary
          </Link>
        </div>
      </div>
    </div>
  );
}
