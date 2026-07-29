'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaves } from '@/hooks/useLeaves';
import { useToast } from '@/context/ToastContext';

interface LeaveRequestHistoryItem {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason?: string;
  createdAt: string;
  approver?: { name: string };
  approvedAt?: string;
  approverNote?: string;
}

interface LeaveRequestHistoryProps {
  userId: string;
}

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  WYPOCZYNKOWY: { label: 'Urlop wypoczynkowy', icon: '🏖️', color: '#10b981' },
  VACATION: { label: 'Urlop wypoczynkowy', icon: '🏖️', color: '#10b981' },
  CHOROBOWY: { label: 'Zwolnienie lekarskie (L4)', icon: '🏥', color: '#ef4444' },
  SICK_LEAVE: { label: 'Zwolnienie lekarskie (L4)', icon: '🏥', color: '#ef4444' },
  NA_ZADANIE: { label: 'Urlop na żądanie', icon: '📋', color: '#8b5cf6' },
  ON_DEMAND: { label: 'Urlop na żądanie', icon: '📋', color: '#8b5cf6' },
  BEZPLATNY: { label: 'Urlop bezpłatny', icon: '⚠️', color: '#f59e0b' },
  UNPAID: { label: 'Urlop bezpłatny', icon: '⚠️', color: '#f59e0b' },
  SPECJALNY: { label: 'Urlop specjalny', icon: '⭐', color: '#06b6d4' },
  SPECIAL: { label: 'Urlop specjalny', icon: '⭐', color: '#06b6d4' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  PENDING: { label: 'Oczekujący', bg: 'bg-amber-100', text: 'text-amber-800', icon: '⏳' },
  APPROVED: { label: 'Zatwierdzony', bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
  REJECTED: { label: 'Odrzucony', bg: 'bg-red-100', text: 'text-red-800', icon: '❌' },
};

export function LeaveRequestHistory({ userId }: LeaveRequestHistoryProps) {
  const { isAdmin } = useAuth();
  const { showToast, showConfirm } = useToast();
  const { deleteLeaveRequest, fetchLeaveBalance } = useLeaves();

  const [requests, setRequests] = useState<LeaveRequestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/urlopy?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Błąd pobierania historii wniosków:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchRequests();
    }
  }, [userId, fetchRequests]);

  // Nasłuchiwanie na zdarzenie custom odświeżenia (po złożeniu/usunięciu wniosku)
  useEffect(() => {
    const handler = () => fetchRequests();
    window.addEventListener('leave-request-created', handler);
    return () => window.removeEventListener('leave-request-created', handler);
  }, [fetchRequests]);

  const handleDeleteRequest = (req: LeaveRequestHistoryItem) => {
    const typeLabel = TYPE_LABELS[req.type]?.label || req.type;
    const isApproved = req.status === 'APPROVED';

    const message = isApproved
      ? `Czy na pewno chcesz usunąć ten ZATWIERDZONY wniosek urlopowy (${typeLabel}, ${req.daysCount ?? 1} dni)? Dni z tego wniosku automatycznie powrócą do puli urlopowej użytkownika!`
      : `Czy na pewno chcesz usunąć ten wniosek urlopowy (${typeLabel})?`;

    showConfirm({
      title: 'Usuwanie wniosku urlopowego',
      message,
      confirmText: 'Usuń wniosek',
      isDanger: true,
      onConfirm: async () => {
        try {
          const result = await deleteLeaveRequest(req.id);
          showToast(
            result.message || 'Wniosek urlopowy został usunięty.',
            'success'
          );
          fetchRequests();
          fetchLeaveBalance(userId);
          // Powiadom inne komponenty o konieczności odświeżenia
          window.dispatchEvent(new CustomEvent('leave-request-created'));
        } catch (err: any) {
          showToast(err.message || 'Błąd podczas usuwania wniosku', 'error');
        }
      },
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filtered = filter === 'ALL' ? requests : requests.filter((r) => r.status === filter);

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📋 Historia Wniosków Urlopowych</h2>
          <p className="text-sm text-gray-500 mt-1">
            Łącznie: {requests.length} wniosków
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium cursor-pointer"
        >
          🔄 Odśwież
        </button>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => setFilter(filter === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`p-3 rounded-lg border-2 transition-all text-center cursor-pointer ${
            filter === 'PENDING'
              ? 'border-amber-400 bg-amber-50'
              : 'border-gray-200 bg-gray-50 hover:border-amber-300'
          }`}
        >
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-xs text-gray-600 font-medium">⏳ Oczekujące</div>
        </button>
        <button
          onClick={() => setFilter(filter === 'APPROVED' ? 'ALL' : 'APPROVED')}
          className={`p-3 rounded-lg border-2 transition-all text-center cursor-pointer ${
            filter === 'APPROVED'
              ? 'border-green-400 bg-green-50'
              : 'border-gray-200 bg-gray-50 hover:border-green-300'
          }`}
        >
          <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          <div className="text-xs text-gray-600 font-medium">✅ Zatwierdzone</div>
        </button>
        <button
          onClick={() => setFilter(filter === 'REJECTED' ? 'ALL' : 'REJECTED')}
          className={`p-3 rounded-lg border-2 transition-all text-center cursor-pointer ${
            filter === 'REJECTED'
              ? 'border-red-400 bg-red-50'
              : 'border-gray-200 bg-gray-50 hover:border-red-300'
          }`}
        >
          <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          <div className="text-xs text-gray-600 font-medium">❌ Odrzucone</div>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Ładowanie historii...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-gray-500 font-medium">Brak wniosków urlopowych</p>
          <p className="text-gray-400 text-sm mt-1">
            Kliknij na dni w kalendarzu powyżej, aby złożyć nowy wniosek
          </p>
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((req) => {
            const typeInfo = TYPE_LABELS[req.type] || {
              label: req.type,
              icon: '📋',
              color: '#6b7280',
            };
            const statusInfo = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;

            return (
              <div
                key={req.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Left: type + dates */}
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: `${typeInfo.color}20` }}
                    >
                      {typeInfo.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{typeInfo.label}</div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        {formatDate(req.startDate)} — {formatDate(req.endDate)}
                        <span className="ml-2 font-bold text-gray-800">
                          ({req.daysCount ?? 1} {(req.daysCount ?? 1) === 1 ? 'dzień' : 'dni'})
                        </span>
                      </div>
                      {req.reason && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          Powód: {req.reason}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Złożono: {formatDateTime(req.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Right: status & actions */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusInfo.bg} ${statusInfo.text}`}
                    >
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                    {req.approver && (
                      <span className="text-xs text-gray-500">
                        Przez: {req.approver.name}
                      </span>
                    )}
                    {req.approvedAt && (
                      <span className="text-xs text-gray-400">
                        {formatDateTime(req.approvedAt)}
                      </span>
                    )}
                    {req.approverNote && (
                      <span className="text-xs text-gray-500 italic max-w-[200px] text-right">
                        „{req.approverNote}"
                      </span>
                    )}

                    {/* Przycisk usuwania dla Admina */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteRequest(req)}
                        className="mt-1 text-xs px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-md border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Usuń wniosek (zwraca dni do puli jeśli zatwierdzony)"
                      >
                        <span>🗑️</span> Usuń wniosek
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
