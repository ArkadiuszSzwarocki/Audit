'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaveApprovals, LeaveRequest } from '@/hooks/useLeaveApprovals';
import { LeaveApprovalList } from '@/components/leave/LeaveApprovalList';
import { LeaveApprovalDetail } from '@/components/leave/LeaveApprovalDetail';

export default function LeaveApprovalsPage() {
  const { user } = useAuth();
  const { getApprovalStats } = useLeaveApprovals();
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user?.id]);

  const loadStats = async () => {
    if (!user?.id) return;
    const result = await getApprovalStats(user.id);
    if (result.success) {
      setStats(result.data);
    }
  };

  const handleApprovalComplete = () => {
    setSelectedLeave(null);
    setRefreshKey(prev => prev + 1);
    loadStats();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center text-gray-600 text-lg">
          Zaloguj się, aby zarządzać wnioskami urlopowymi.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Nagłówek */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📨 Zarządzanie Wnioskami Urlopowymi
          </h1>
          <p className="text-gray-600">
            Przeglądaj i zatwierdzaj wnioski urlopowe od swoich pracowników
          </p>
        </div>

        {/* Statystyki */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.pending}</div>
            <div className="text-gray-600 text-sm">⏳ Oczekujące</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600 mb-1">{stats.approved}</div>
            <div className="text-gray-600 text-sm">✅ Zatwierdzone</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-600 mb-1">{stats.rejected}</div>
            <div className="text-gray-600 text-sm">❌ Odrzucone</div>
          </div>
        </div>

        {/* Layout: Lista + Szczegóły */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista wniosków */}
          <div key={refreshKey}>
            <LeaveApprovalList
              managerId={user.id}
              onSelectLeave={setSelectedLeave}
            />
          </div>

          {/* Szczegóły wniosku */}
          <LeaveApprovalDetail
            leave={selectedLeave}
            onApprovalComplete={handleApprovalComplete}
          />
        </div>

        {/* Informacje */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
          <h2 className="text-xl font-bold text-gray-900 mb-4">ℹ️ Jak to działa?</h2>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>✅ Pracownik składa wniosek urlopowy na stronie /urlopy</li>
            <li>✅ Wniosek trafia do Ciebie ze statusem "OCZEKUJE"</li>
            <li>✅ Przeanalizuj szczegóły: okres, typ urlopu, powód</li>
            <li>✅ Zatwierdź (dni zostaną doliczone do puli) lub odrzuć z powódem</li>
            <li>✅ Pracownik otrzyma powiadomienie o decyzji</li>
            <li>✅ W przypadku zatwierdzenia - urlop przechodzi do następnego poziomu hierarchii</li>
          </ul>
        </div>

        {/* Status legend */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-semibold text-yellow-700 mb-2">⏳ OCZEKUJE</div>
            <p className="text-xs text-gray-600">Wniosek czeka na Twoją decyzję</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-semibold text-green-700 mb-2">✅ ZATWIERDZONY</div>
            <p className="text-xs text-gray-600">Wniosek został zatwierdzony, dni policzone</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-semibold text-red-700 mb-2">❌ ODRZUCONY</div>
            <p className="text-xs text-gray-600">Wniosek został odrzucony z powodu</p>
          </div>
        </div>
      </div>
    </div>
  );
}
