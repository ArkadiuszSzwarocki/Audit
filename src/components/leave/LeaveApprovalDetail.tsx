'use client';

import { useState } from 'react';
import { useLeaveApprovals, LeaveRequest } from '@/hooks/useLeaveApprovals';
import { useToast } from '@/context/ToastContext';

interface LeaveApprovalDetailProps {
  leave: LeaveRequest | null;
  onApprovalComplete?: () => void;
}

export function LeaveApprovalDetail({ leave, onApprovalComplete }: LeaveApprovalDetailProps) {
  const { approveLeaveRequest, rejectLeaveRequest } = useLeaveApprovals();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!leave) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Wybierz wniosek z listy, aby zobaczyć szczegóły
      </div>
    );
  }

  const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const calculateDays = (): number => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);

    let workDays = 0;
    const current = new Date(start);
    while (current <= end) {
      if (current.getDay() >= 1 && current.getDay() <= 5) {
        workDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return workDays === 0 ? 1 : workDays;
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      const result = await approveLeaveRequest(leave.id);
      if (result.success) {
        showToast('✅ Wniosek zatwierddzony!', 'success');
        if (onApprovalComplete) onApprovalComplete();
      } else {
        showToast(`❌ ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('❌ Błąd zatwierdzania wniosku', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const result = await rejectLeaveRequest(leave.id, rejectReason);
      if (result.success) {
        showToast('❌ Wniosek odrzucony', 'success');
        setShowRejectForm(false);
        setRejectReason('');
        if (onApprovalComplete) onApprovalComplete();
      } else {
        showToast(`❌ ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('❌ Błąd odrzucania wniosku', 'error');
    } finally {
      setLoading(false);
    }
  };

  const leaveTypeLabel = {
    VACATION: '🏖️ Urlop wypoczynkowy',
    SICK_LEAVE: '🏥 Zwolnienie lekarskie',
    OTHER: '📋 Inne'
  }[leave.type] || leave.type;

  const workDays = calculateDays();

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Szczegóły Wniosku</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 font-semibold">Pracownik</div>
              <div className="text-gray-900 font-semibold">
                {leave.user?.name || 'N/A'}
              </div>
              <div className="text-xs text-gray-500">
                ({leave.user?.login || 'N/A'})
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 font-semibold">Departament</div>
              <div className="text-gray-900 font-semibold">
                {(leave.user as any)?.department?.name || 'N/A'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 font-semibold">Typ urlopu</div>
              <div className="text-gray-900 font-semibold">{leaveTypeLabel}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600 font-semibold">Dni robocze</div>
              <div className="text-lg font-bold text-blue-600">{workDays} dni</div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 font-semibold">Okres urlopu</div>
            <div className="text-gray-900 font-semibold">
              📅 {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
            </div>
          </div>

          {leave.reason && (
            <div>
              <div className="text-sm text-gray-600 font-semibold">Uwagi</div>
              <div className="p-3 bg-gray-50 rounded text-gray-700">
                {leave.reason}
              </div>
            </div>
          )}

          <div>
            <div className="text-sm text-gray-600 font-semibold">Data złożenia</div>
            <div className="text-gray-900">
              {leave.createdAt ? formatDate(leave.createdAt) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Formularze akcji */}
      <div className="border-t pt-6">
        {!showRejectForm ? (
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold flex items-center justify-center gap-2"
            >
              {loading ? '⏳ Zatwierdzam...' : '✅ Zatwierdź Wniosek'}
            </button>

            <button
              onClick={() => setShowRejectForm(true)}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-semibold flex items-center justify-center gap-2"
            >
              ❌ Odrzuć Wniosek
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-3">Czy na pewno chcesz odrzucić wniosek?</h4>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                placeholder="Powód odrzucenia (opcjonalnie)..."
                rows={3}
                disabled={loading}
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason('');
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold disabled:bg-gray-200"
                >
                  Anuluj
                </button>

                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-semibold"
                >
                  {loading ? '⏳ Odrzucam...' : 'Potwierdź Odrzucenie'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
