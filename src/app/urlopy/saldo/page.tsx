'use client';

import { LeaveBalanceAdmin } from '@/components/leave/LeaveBalanceAdmin';

export default function LeaveBalancePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <LeaveBalanceAdmin />
      </div>
    </div>
  );
}
