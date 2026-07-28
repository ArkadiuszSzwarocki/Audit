'use client';

import { useState, useEffect } from 'react';
import { useLeaveApprovals, LeaveRequest } from '@/hooks/useLeaveApprovals';
import { useToast } from '@/context/ToastContext';

interface LeaveApprovalListProps {
  managerId: string;
  onSelectLeave?: (leave: LeaveRequest) => void;
}

export function LeaveApprovalList({ managerId, onSelectLeave }: LeaveApprovalListProps) {
  const { leaveRequests, loading, error, fetchPendingRequests } = useLeaveApprovals();
  const { showToast } = useToast();
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    fetchPendingRequests(managerId);
    const interval = setInterval(() => fetchPendingRequests(managerId), 30000); // Refresh co 30 sekund
    return () => clearInterval(interval);
  }, [managerId, fetchPendingRequests]);

  const handleSelect = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    if (onSelectLeave) {
      onSelectLeave(leave);
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case 'VACATION':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">🏖️ Urlop</span>;
      case 'SICK_LEAVE':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">🏥 Choroba</span>;
      case 'OTHER':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">📋 Inne</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">{type}</span>;
    }
  };

  const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">⏳ Wczytywanie wniosków...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">❌ {error}</div>;
  }

  if (leaveRequests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-4xl mb-2">✅</div>
        <p className="text-gray-600">Brak wniosków oczekujących na zatwierdzenie</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <h3 className="text-lg font-bold">📨 Wnioskami Oczekujące ({leaveRequests.length})</h3>
      </div>

      <div className="divide-y max-h-96 overflow-y-auto">
        {leaveRequests.map(leave => (
          <div
            key={leave.id}
            onClick={() => handleSelect(leave)}
            className={`p-4 cursor-pointer transition-colors ${
              selectedLeave?.id === leave.id
                ? 'bg-blue-50 border-l-4 border-blue-600'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  👤 {leave.user?.name || 'Brak danych'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  📅 {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                </div>
                {leave.user?.department && (
                  <div className="text-xs text-gray-500 mt-1">
                    🏢 {leave.user.department.name}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                {getLeaveTypeBadge(leave.type)}
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                  ⏳ Oczekuje
                </span>
              </div>
            </div>

            {leave.reason && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                💬 {leave.reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

