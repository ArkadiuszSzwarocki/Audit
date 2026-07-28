'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

interface Ticket {
  id: string;
  title: string;
  description: string;
  type: 'PROBLEM' | 'PURCHASE';
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdBy: { id: string; name: string; login: string };
  assignedTo?: { id: string; name: string; login: string };
  createdAt: string;
  updatedAt: string;
  resolutionNotes?: string;
  closedAt?: string;
  estimatedDueDate?: string;
}

const statusOptions = ['OPEN', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CLOSED'];
const statusLabels: Record<string, string> = {
  OPEN: 'Otwarte',
  IN_PROGRESS: 'W trakcie',
  PENDING_APPROVAL: 'Oczekuje zatwierdzenia',
  APPROVED: 'Zatwierdzone',
  REJECTED: 'Odrzucone',
  CLOSED: 'Zamknięte'
};

const statusColors: Record<string, string> = {
  OPEN: '#ef4444',
  IN_PROGRESS: '#f59e0b',
  PENDING_APPROVAL: '#3b82f6',
  APPROVED: '#10b981',
  REJECTED: '#8b5cf6',
  CLOSED: '#6b7280'
};

// IT Help Desk user - always assigned
const IT_HELPDESK_ID = 'e28e526c-6d52-44b6-9513-f55a05d94c1e';
const IT_HELPDESK_NAME = 'IT Help Desk';
const IT_HELPDESK_LOGIN = 'helpdesk';

const priorityLabels: Record<string, string> = {
  LOW: 'Niska',
  MEDIUM: 'Średnia',
  HIGH: 'Wysoka',
  CRITICAL: 'Krytyczna'
};

const typeLabels: Record<string, string> = {
  PROBLEM: 'Problem',
  PURCHASE: 'Zakup'
};

export default function TicketDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const ticketId = params.id as string;
  const token = searchParams.get('token');

  // Color scheme based on theme
  const colors = resolvedTheme === 'dark' ? {
    bg: '#1e293b',
    bgDarker: '#0f172a',
    bgHover: '#334155',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#475569',
    accent: '#3b82f6',
    accentLight: '#cbd5e1',
  } : {
    bg: '#f1f5f9',
    bgDarker: '#e2e8f0',
    bgHover: '#cbd5e1',
    text: '#0f172a',
    textSecondary: '#475569',
    border: '#cbd5e1',
    accent: '#3b82f6',
    accentLight: '#1e293b',
  };

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    status: '',
    resolutionNotes: '',
    estimatedDueDate: '',
  });

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const baseUrl = '/api/helpdesk/tickets/' + ticketId;
        const url = new URL(baseUrl, window.location.origin);
        if (token) {
          url.searchParams.set('token', token);
        }
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Nie udało się załadować');
        const data = await response.json();
        setTicket(data);
        setFormData({
          status: data.status,
          resolutionNotes: data.resolutionNotes || '',
          estimatedDueDate: data.estimatedDueDate?.split('T')[0] || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Błąd');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId, token]);

  const handleSave = async () => {
    if (!ticket) return;
    setSaving(true);
    try {
      const baseUrl = '/api/helpdesk/tickets/' + ticketId;
      const url = new URL(baseUrl, window.location.origin);
      if (token) {
        url.searchParams.set('token', token);
      }
      const response = await fetch(url.toString(), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: formData.status,
          resolutionNotes: formData.resolutionNotes,
          estimatedDueDate: formData.estimatedDueDate ? new Date(formData.estimatedDueDate).toISOString() : null,
        }),
      });
      if (!response.ok) throw new Error('Nie udało się zapisać');
      const updated = await response.json();
      setTicket(updated);
      setFormData({
        status: updated.status,
        resolutionNotes: updated.resolutionNotes || '',
        estimatedDueDate: updated.estimatedDueDate?.split('T')[0] || '',
      });
      showToast('success', '✅ Zmiany zapisane');
    } catch (err) {
      showToast('error', '❌ ' + (err instanceof Error ? err.message : 'Błąd'));
    } finally {
      setSaving(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: colors.text }}>
        ⏳ Ładowanie...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ padding: '2rem', color: '#ef4444' }}>
        ❌ {error || 'Nie znaleziono'}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem', color: colors.text }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            padding: '1rem 1.5rem',
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            borderRadius: '0.5rem',
            zIndex: 1000,
          }}
        >
          {toast.message}
        </div>
      )}

      <button
        onClick={() => router.back()}
        style={{
          background: 'none',
          border: 'none',
          color: colors.accent,
          cursor: 'pointer',
          marginBottom: '1rem',
        }}
      >
        ← Wróć
      </button>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎫 Ticket #{ticket.id.substring(0, 8)}</h1>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: statusColors[ticket.status],
            color: 'white',
            borderRadius: '0.375rem',
          }}
        >
          {statusLabels[ticket.status]}
        </div>
        <div style={{ color: colors.textSecondary }}>
          {typeLabels[ticket.type]} • ⚡ {priorityLabels[ticket.priority]}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* LEFT COLUMN - Info Display */}
        <div>
          <div style={{ backgroundColor: colors.bg, padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: `1px solid ${colors.border}` }}>
            <div style={{ color: colors.textSecondary, marginBottom: '0.5rem' }}>Tytuł</div>
            <h2 style={{ margin: 0, color: colors.text }}>{ticket.title}</h2>
          </div>

          <div style={{ backgroundColor: colors.bg, padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: `1px solid ${colors.border}` }}>
            <div style={{ color: colors.textSecondary, marginBottom: '0.5rem' }}>📋 Opis</div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: colors.text }}>{ticket.description}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ backgroundColor: colors.bg, padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: '0.75rem', color: colors.textSecondary, textTransform: 'uppercase' }}>👤 Zgłaszający</div>
              <div style={{ fontWeight: 500, color: colors.text }}>{ticket.createdBy.name}</div>
              <div style={{ color: colors.textSecondary }}>@{ticket.createdBy.login}</div>
            </div>
            <div style={{ backgroundColor: colors.bg, padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: '0.75rem', color: colors.textSecondary, textTransform: 'uppercase' }}>🔧 Przydzielony</div>
              <div style={{ color: colors.text, fontWeight: 500 }}>{IT_HELPDESK_NAME}</div>
              <div style={{ color: colors.textSecondary }}>@{IT_HELPDESK_LOGIN}</div>
            </div>
            <div style={{ backgroundColor: colors.bg, padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: '0.75rem', color: colors.textSecondary, textTransform: 'uppercase' }}>📅 Utworzono</div>
              <div style={{ color: colors.text }}>{new Date(ticket.createdAt).toLocaleDateString('pl-PL')}</div>
            </div>
            <div style={{ backgroundColor: colors.bg, padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: '0.75rem', color: colors.textSecondary, textTransform: 'uppercase' }}>🕐 Zmieniono</div>
              <div style={{ color: colors.text }}>{new Date(ticket.updatedAt).toLocaleDateString('pl-PL')}</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Edit Form */}
        <div>
          <div style={{ backgroundColor: colors.bg, padding: '1.5rem', borderRadius: '0.5rem', border: `2px solid ${colors.accent}` }}>
            <h3 style={{ color: colors.accent, marginBottom: '1.5rem' }}>✏️ ZARZĄDZANIE TICKETEM</h3>

            {/* Special message for PURCHASE tickets pending approval */}
            {ticket.type === 'PURCHASE' && ticket.status === 'PENDING_APPROVAL' && (
              <div style={{
                backgroundColor: '#fef3c7',
                borderLeft: '4px solid #d97706',
                padding: '1rem',
                borderRadius: '0.375rem',
                marginBottom: '1.5rem',
                color: '#78350f'
              }}>
                <p style={{ margin: 0, fontWeight: 600 }}>⚠️ OCZEKUJE ZATWIERDZENIA ZARZĄDU</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                  Ten ticket wymaga zakupu i jest wysłany do Zarządu w celu zatwierdzenia. Po zatwierdzeniu będzie możliwa realizacja.
                </p>
              </div>
            )}

            {/* Status Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: colors.textSecondary, marginBottom: '0.5rem', fontWeight: 500 }}>
                📊 Status
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {statusOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFormData({ ...formData, status: s })}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: formData.status === s ? statusColors[s] : colors.bgHover,
                      color: formData.status === s ? 'white' : colors.text,
                      border: formData.status === s ? '2px solid white' : `1px solid ${colors.border}`,
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontWeight: formData.status === s ? 600 : 400,
                      fontSize: '0.875rem',
                    }}
                  >
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: colors.textSecondary, marginBottom: '0.5rem', fontWeight: 500 }}>
                📅 Termin rozwiązania
              </label>
              <input
                type="date"
                value={formData.estimatedDueDate}
                onChange={(e) => setFormData({ ...formData, estimatedDueDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: colors.bgDarker,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                }}
              />
            </div>

            {/* Resolution Notes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: colors.textSecondary, marginBottom: '0.5rem', fontWeight: 500 }}>
                📝 Notatki rozwiązania
              </label>
              <textarea
                value={formData.resolutionNotes}
                onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
                placeholder="Opisz co zostało zrobione, jak rozwiązano problem..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.75rem',
                  backgroundColor: colors.bgDarker,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.375rem',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: saving ? colors.bgHover : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              {saving ? '💾 Zapisywanie...' : '💾 Zapisz zmiany'}
            </button>
          </div>

          {ticket.closedAt && (
            <div
              style={{
                marginTop: '1.5rem',
                backgroundColor: colors.bg,
                padding: '1rem',
                borderRadius: '0.5rem',
                color: colors.textSecondary,
                fontSize: '0.875rem',
                textAlign: 'center',
                border: `1px solid ${colors.border}`,
              }}
            >
              ✓ Ticket zamknięty {new Date(ticket.closedAt).toLocaleString('pl-PL')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}