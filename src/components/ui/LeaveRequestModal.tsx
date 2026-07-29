'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLeaves } from '@/hooks/useLeaves';
import { useAuth } from '@/hooks/useAuth';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate?: Date;
  endDate?: Date;
  onLeaveRequestCreated?: () => void;
}

const LEAVE_TYPES = [
  { value: 'VACATION', label: '🏖️ Urlop zwykły', color: '#10b981' },
  { value: 'SICK_LEAVE', label: '🏥 Zwolnienie lekarskie (L4)', color: '#ef4444' },
  { value: 'ON_DEMAND', label: '📋 Urlop na żądanie', color: '#8b5cf6' },
  { value: 'UNPAID', label: '⚠️ Urlop bezpłatny', color: '#f59e0b' },
  { value: 'SPECIAL', label: '⭐ Urlop specjalny', color: '#06b6d4' }
];

export function LeaveRequestModal({
  isOpen,
  onClose,
  startDate,
  endDate,
  onLeaveRequestCreated
}: LeaveRequestModalProps) {
  const { user } = useAuth();
  const { createLeaveRequest, loading, error } = useLeaves();

  const [mounted, setMounted] = useState(false);
  const [leaveType, setLeaveType] = useState<string>('VACATION');
  const [reason, setReason] = useState('');
  const [managerId, setManagerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      setToastMessage({ text: 'Wybierz daty', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      await createLeaveRequest({
        startDate,
        endDate,
        type: leaveType as 'VACATION' | 'SICK_LEAVE' | 'ON_DEMAND' | 'UNPAID' | 'SPECIAL',
        reason: reason || undefined,
        managerId: managerId || undefined
      });

      setToastMessage({ text: 'Wniosek urlopowy został złożony!', type: 'success' });
      setLeaveType('VACATION');
      setReason('');
      setManagerId('');

      if (onLeaveRequestCreated) {
        setTimeout(() => {
          onLeaveRequestCreated();
          onClose();
        }, 1500);
      } else {
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd przy tworzeniu wniosku';
      setToastMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setToastMessage(null);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Nagłówek */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">📅 Nowy wniosek urlopowy</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Zawartość */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Wybrane daty */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">📆 Wybrany okres</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Data początkowa</label>
                <input
                  type="text"
                  value={startDate?.toLocaleDateString('pl-PL') || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Data końcowa</label>
                <input
                  type="text"
                  value={endDate?.toLocaleDateString('pl-PL') || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <strong>Liczba dni:</strong>{' '}
              {startDate && endDate
                ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                : 0}
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <span>⚡</span>
            <span>Wniosek urlopowy rozliczany jest w pierwszej kolejności z <strong>Urlopu Zaległego z 2025 r.</strong></span>
          </div>

          {/* Typ urlopu */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Typ urlopu
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {LEAVE_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setLeaveType(type.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    leaveType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Powód */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              📝 Powód (opcjonalnie)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Opisz powód swojego wniosku..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              rows={3}
            />
          </div>

          {/* Manager */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              👔 Manager (opcjonalnie)
            </label>
            <input
              type="text"
              value={managerId}
              onChange={e => setManagerId(e.target.value)}
              placeholder="ID lub nazwa managera do zatwierdzenia"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {/* Błąd */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Przyciski */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !startDate || !endDate}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '⏳ Wysyłanie...' : '✓ Złóż wniosek'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold transition-colors disabled:opacity-50"
            >
              Anuluj
            </button>
          </div>
        </form>

        {/* Toast */}
        {toastMessage && (
          <div
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${
              toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toastMessage.text}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
