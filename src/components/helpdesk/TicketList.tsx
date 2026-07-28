'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HelpDeskTicket } from '@/generated/prisma';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';

type TicketWithUser = HelpDeskTicket & {
  createdBy?: any;
  assignedTo?: any;
  assignedBy?: any;
  approvedBy?: any;
  managerComment?: string | null;
  approvalDate?: Date | string | null;
  history?: any[];
};

const STATUS_LABELS: Record<string, { label: string; cls: string; icon: string }> = {
  OPEN: { label: 'Otwarte', cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300', icon: '🔓' },
  IN_PROGRESS: { label: 'W trakcie', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', icon: '⚙️' },
  PENDING_APPROVAL: { label: 'Oczekuje', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300', icon: '⏳' },
  APPROVED: { label: 'Zatwierdzono', cls: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300', icon: '✅' },
  REJECTED: { label: 'Odrzucono', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: '❌' },
  CLOSED: { label: 'Zamknięte', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: '🔒' },
};

const PRIORITY_LABELS: Record<string, { label: string; cls: string; icon: string }> = {
  LOW: { label: 'Niski', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300', icon: '🟢' },
  MEDIUM: { label: 'Średni', cls: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300', icon: '🟡' },
  HIGH: { label: 'Wysoki', cls: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300', icon: '🟠' },
  CRITICAL: { label: 'Krytyczny', cls: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300', icon: '🔴' },
};

const TYPE_LABELS: Record<string, string> = {
  PROBLEM: '🔧 Problem techniczny',
  PURCHASE: '🛒 Zapotrzebowanie',
};

const formatHistoryFieldLabel = (field: string) => {
  switch (field) {
    case 'status':
      return 'Status';
    case 'estimatedDueDate':
      return 'Termin szacowany';
    case 'resolutionNotes':
      return 'Notatki rozwiązania';
    case 'assignedTo':
      return 'Przypisanie';
    case 'readByHelpDesk':
      return 'Przeczytane przez Help Desk';
    case 'realizationStartedAt':
      return 'Data rozpoczęcia realizacji';
    case 'realizedAt':
      return 'Data zakończenia realizacji';
    case 'approval':
      return 'Zgoda zarządu';
    default:
      return field;
  }
};

const formatHistoryValue = (field: string, value: any) => {
  if (value === null || value === undefined || value === '') {
    return '(brak)';
  }

  if (field === 'status') {
    const normalized = String(value).toUpperCase();
    return STATUS_LABELS[normalized]?.label || String(value);
  }

  if (field === 'readByHelpDesk') {
    return value === true || value === 'true' ? 'Tak' : 'Nie';
  }

  if (['estimatedDueDate', 'realizationStartedAt', 'realizedAt'].includes(field)) {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? '(brak)' : date.toLocaleDateString('pl-PL');
  }

  return String(value);
};

export function TicketList() {
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [canManageTickets, setCanManageTickets] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const canManageTicketFields = canManageTickets;
  const [filter, setFilter] = useState<'ALL' | 'PURCHASE' | 'PROBLEM' | 'PENDING_APPROVAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [editForm, setEditForm] = useState({
    status: '',
    estimatedDueDate: '',
    resolutionNotes: '',
    readByHelpDesk: false,
    realizationStartedAt: '',
    realizedAt: '',
  });
  const [chatMessage, setChatMessage] = useState('');
  const { user } = useAuth();
  const { showToast } = useToast();
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.history, showEditModal]);

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/helpdesk/tickets');
      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();
      setTickets(data);

      const meResponse = await fetch('/api/auth/check');
      if (meResponse.ok) {
        const meData = await meResponse.json();
        const role = String(meData?.user?.role || '').toUpperCase();
        const canManage = role === 'ADMIN' || role === 'DIRECTOR' || role === 'MANAGER' || role === 'ZARZAD' || role === 'ZARZĄD' || role === 'IT' || role === 'IT HELP DESK' || role === 'HELPDESK';
        setCanManageTickets(canManage);
        setCurrentUserRole(role);
      }
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTicket = (ticket: TicketWithUser) => {
    const isOwner = user?.id && (ticket.createdById === user.id || ticket.assignedToId === user.id);
    if (!user || (!canManageTickets && !isOwner)) {
      showToast('Nie masz uprawnień do otwarcia tego zgłoszenia.', 'error');
      return;
    }

    setSelectedTicket(ticket);
    setEditForm({
      status: ticket.status,
      estimatedDueDate: ticket.estimatedDueDate ? new Date(ticket.estimatedDueDate).toISOString().split('T')[0] : '',
      resolutionNotes: ticket.resolutionNotes || '',
      readByHelpDesk: ticket.readByHelpDesk || false,
      realizationStartedAt: ticket.realizationStartedAt ? new Date(ticket.realizationStartedAt).toISOString().split('T')[0] : '',
      realizedAt: ticket.realizedAt ? new Date(ticket.realizedAt).toISOString().split('T')[0] : '',
    });
    setChatMessage('');
    setShowEditModal(true);
  };

  const handleSaveChanges = async (messageOverride?: string) => {
    if (!selectedTicket) return;

    try {
      const meResponse = await fetch('/api/auth/check', { credentials: 'include' });
      const meData = meResponse.ok ? await meResponse.json() : null;
      const currentUserId = meData?.user?.id || user?.id;

      const payload = {
        ...editForm,
        message: messageOverride ?? chatMessage.trim(),
        currentUserId,
      };

      if (!canManageTicketFields) {
        delete (payload as any).status;
        delete (payload as any).estimatedDueDate;
        delete (payload as any).realizationStartedAt;
        delete (payload as any).realizedAt;
        delete (payload as any).readByHelpDesk;
        delete (payload as any).resolutionNotes;
      }

      console.log('Sending PATCH request with:', {
        ticketId: selectedTicket.id,
        payload,
      });

      const response = await fetch(`/api/helpdesk/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to update ticket');

      const updatedTicket = await response.json();
      setSelectedTicket(updatedTicket);
      setChatMessage('');
      showToast(messageOverride ? 'Wiadomość została wysłana do czatu.' : 'Zgłoszenie zostało zaktualizowane!', 'success');
      fetchTickets();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filterTicketsByStatus = (source: TicketWithUser[]) => {
    if (statusFilter === 'ALL') {
      return source;
    }

    return source.filter(ticket => ticket.status === statusFilter);
  };

  const filterTicketsByDate = (source: TicketWithUser[]) => {
    if (!dateFilter) {
      return source;
    }

    const selectedDate = new Date(dateFilter);
    if (Number.isNaN(selectedDate.getTime())) {
      return source;
    }

    return source.filter(ticket => {
      const createdAt = new Date(ticket.createdAt);
      return createdAt.getFullYear() === selectedDate.getFullYear()
        && createdAt.getMonth() === selectedDate.getMonth()
        && createdAt.getDate() === selectedDate.getDate();
    });
  };

  const pendingApprovalTickets = filterTicketsByStatus(
    tickets.filter(ticket => ticket.type === 'PURCHASE' && ticket.status === 'PENDING_APPROVAL' && ticket.isApprovedByManager !== true)
  );

  const getFilteredTickets = () => {
    let result = tickets;

    if (filter === 'PURCHASE') {
      result = result.filter(ticket => ticket.type === 'PURCHASE');
    } else if (filter === 'PROBLEM') {
      result = result.filter(ticket => ticket.type === 'PROBLEM');
    } else if (filter === 'PENDING_APPROVAL') {
      result = result.filter(ticket => ticket.type === 'PURCHASE' && ticket.status === 'PENDING_APPROVAL' && ticket.isApprovedByManager !== true);
    }

    result = filterTicketsByStatus(result);
    result = filterTicketsByDate(result);

    return result.filter(ticket => !pendingApprovalTickets.some(pending => pending.id === ticket.id) || filter === 'PENDING_APPROVAL');
  };

  const visibleTickets = getFilteredTickets();
  const otherTickets = visibleTickets.filter(ticket => !pendingApprovalTickets.some(pending => pending.id === ticket.id));
  const isRestrictedHelpDeskUser = ['IT', 'IT HELP DESK', 'HELPDESK'].includes(currentUserRole);
  const statusChangeBlockedForHelpDesk = Boolean(
    selectedTicket &&
    isRestrictedHelpDeskUser &&
    selectedTicket.type === 'PURCHASE' &&
    selectedTicket.status === 'PENDING_APPROVAL' &&
    selectedTicket.isApprovedByManager !== true
  );
  const listForCurrentFilter = filter === 'PENDING_APPROVAL'
    ? pendingApprovalTickets
    : filter === 'ALL'
      ? otherTickets
      : visibleTickets;

  const activeFilterLabels = [
    filter !== 'ALL' ? { key: 'type', label: filter === 'PURCHASE' ? 'Zapotrzebowania' : filter === 'PROBLEM' ? 'Problemy' : 'Do zatwierdzenia' } : null,
    statusFilter !== 'ALL' ? { key: 'status', label: STATUS_LABELS[statusFilter]?.label || statusFilter } : null,
    dateFilter ? { key: 'date', label: `Data: ${new Date(dateFilter).toLocaleDateString('pl-PL')}` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const clearFilter = (key: string) => {
    if (key === 'type') {
      setFilter('ALL');
    } else if (key === 'status') {
      setStatusFilter('ALL');
    } else if (key === 'date') {
      setDateFilter('');
    }
  };

  const renderTicketCard = (ticket: TicketWithUser) => (
    <div
      key={ticket.id}
      className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md dark:hover:shadow-lg transition-all cursor-pointer"
      onClick={() => handleEditTicket(ticket)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">
              {ticket.title}
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
            {ticket.description}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">
              {TYPE_LABELS[ticket.type] || ticket.type}
            </span>
            {ticket.estimatedDueDate && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                📅 {new Date(ticket.estimatedDueDate).toLocaleDateString('pl-PL')}
              </span>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(ticket.createdAt).toLocaleString('pl-PL', {
                dateStyle: 'short',
                timeStyle: 'short'
              })}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              STATUS_LABELS[ticket.status]?.cls || 'bg-slate-100'
            }`}
          >
            {STATUS_LABELS[ticket.status]?.icon} {STATUS_LABELS[ticket.status]?.label}
          </span>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              PRIORITY_LABELS[ticket.priority]?.cls || 'bg-slate-100'
            }`}
          >
            {PRIORITY_LABELS[ticket.priority]?.icon} {PRIORITY_LABELS[ticket.priority]?.label}
          </span>
        </div>
      </div>
    </div>
  );

  if (isLoading) return <div className="text-slate-600 dark:text-slate-400">Ładowanie...</div>;
  if (error) return <div className="text-red-500">Błąd: {error}</div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {[
          { value: 'ALL', label: 'Wszystkie' },
          { value: 'PURCHASE', label: 'Zapotrzebowania' },
          { value: 'PROBLEM', label: 'Problemy' },
          { value: 'PENDING_APPROVAL', label: 'Do zatwierdzenia' },
        ].map(option => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value as 'ALL' | 'PURCHASE' | 'PROBLEM' | 'PENDING_APPROVAL')}
            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {option.label}
          </button>
        ))}

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-full border border-slate-200 bg-white text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="ALL">Wszystkie statusy</option>
          {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 rounded-full border border-slate-200 bg-white text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        />
      </div>

      {activeFilterLabels.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilterLabels.map(activeFilter => (
            <span
              key={activeFilter.key}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <span>{activeFilter.label}</span>
              <button
                type="button"
                onClick={() => clearFilter(activeFilter.key)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white"
                aria-label={`Usuń filtr ${activeFilter.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          Nie masz jeszcze żadnych zgłoszeń.
        </div>
      ) : (
        <div className="space-y-4">
          {filter === 'ALL' && canManageTickets && pendingApprovalTickets.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  ⏳ Do zatwierdzenia – zapotrzebowania
                </h3>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                  {pendingApprovalTickets.length}
                </span>
              </div>
              <div className="space-y-2">
                {pendingApprovalTickets.map(ticket => renderTicketCard(ticket))}
              </div>
            </div>
          )}

          {filter === 'PENDING_APPROVAL' ? (
            <div className="space-y-2">
              {listForCurrentFilter.map(ticket => renderTicketCard(ticket))}
            </div>
          ) : (
            <div className="space-y-2">
              {filter === 'ALL' && canManageTickets && pendingApprovalTickets.length > 0 && (
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Pozostałe zgłoszenia
                </div>
              )}
              {listForCurrentFilter.map(ticket => renderTicketCard(ticket))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {canManageTicketFields ? 'Zarządzaj zgłoszeniem' : 'Szczegóły zgłoszenia'}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Tytuł i typ */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{selectedTicket.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{selectedTicket.description}</p>
                <div className="flex gap-2">
                  <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">
                    {TYPE_LABELS[selectedTicket.type]}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(selectedTicket.createdAt).toLocaleDateString('pl-PL')}
                  </span>
                </div>
              </div>

              {canManageTicketFields && (
                <>
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      disabled={statusChangeBlockedForHelpDesk}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {statusChangeBlockedForHelpDesk && (
                      <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                        Status jest zablokowany do czasu zatwierdzenia przez zarząd. Możesz jednak dopisywać notatki i prowadzić rozmowę w tym zgłoszeniu.
                      </p>
                    )}
                  </div>

                  {/* Czas realizacji */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      📅 Kalendarz
                    </label>
                    <input
                      type="date"
                      value={editForm.estimatedDueDate}
                      onChange={(e) => setEditForm({ ...editForm, estimatedDueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {/* Chat w zgłoszeniu */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  💬 Czat w zgłoszeniu
                </label>

                <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {selectedTicket?.history?.filter((entry: any) => entry.field === 'message').length ? (
                      selectedTicket.history
                        .filter((entry: any) => entry.field === 'message')
                        .slice()
                        .reverse()
                        .map((entry: any) => {
                          const isOwnMessage = entry.user?.id === user?.id;
                          return (
                            <div
                              key={entry.id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl border px-3 py-2 ${isOwnMessage
                                  ? 'bg-brand-600 text-white border-brand-600'
                                  : 'bg-white dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                              >
                                <div className={`flex items-center justify-between gap-2 text-[11px] mb-1 ${isOwnMessage ? 'text-brand-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                  <span className="font-semibold">
                                    {isOwnMessage
                                      ? (user?.login || user?.name || 'Ty')
                                      : ((entry.user?.login || entry.user?.name || '').trim() || 'Nieznany')}
                                  </span>
                                  <span>
                                    {new Date(entry.createdAt).toLocaleString('pl-PL', {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">
                                  {entry.newValue}
                                </p>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Brak wiadomości w czacie. Napisz pierwszą wiadomość do współpracowników lub zarządu.
                      </p>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (chatMessage.trim()) {
                          handleSaveChanges(chatMessage.trim());
                        }
                      }
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Napisz wiadomość do zespołu lub zarządu..."
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveChanges(chatMessage.trim())}
                      disabled={!chatMessage.trim()}
                      className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                    >
                      Wyślij wiadomość
                    </button>
                    <button
                      onClick={() => handleSaveChanges()}
                      className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors"
                    >
                      Zapisz inne zmiany
                    </button>
                  </div>
                </div>
              </div>

              {canManageTicketFields && (
                <>
                  {/* Realizacja */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        🚀 Realizacja rozpoczęta
                      </label>
                      <input
                        type="date"
                        value={editForm.realizationStartedAt}
                        onChange={(e) => setEditForm({ ...editForm, realizationStartedAt: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        ✔️ Realizacja zakończona
                      </label>
                      <input
                        type="date"
                        value={editForm.realizedAt}
                        onChange={(e) => setEditForm({ ...editForm, realizedAt: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Status odczytania */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.readByHelpDesk}
                        onChange={(e) => setEditForm({ ...editForm, readByHelpDesk: e.target.checked })}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        👀 Przeczytane przez Help Desk
                      </span>
                    </label>
                    {selectedTicket?.readByHelpDeskAt && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Przeczytano: {new Date(selectedTicket.readByHelpDeskAt).toLocaleDateString('pl-PL', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Historia zmian */}
              {selectedTicket?.history && selectedTicket.history.filter((entry: any) => entry.field !== 'message').length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">📋 Historia zmian statusów i pól</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedTicket.history
                      .filter((entry: any) => entry.field !== 'message')
                      .map((entry: any) => {
                        const fieldLabel = formatHistoryFieldLabel(entry.field);
                        const oldValue = formatHistoryValue(entry.field, entry.oldValue);
                        const newValue = formatHistoryValue(entry.field, entry.newValue);

                        return (
                          <div
                            key={entry.id}
                            className="text-xs bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700"
                          >
                            <div className="font-semibold text-slate-700 dark:text-slate-300">
                              {entry.user?.name || 'Nieznany'} • {new Date(entry.createdAt).toLocaleDateString('pl-PL')}
                            </div>
                            <div className="text-slate-600 dark:text-slate-400 mt-1">
                              <strong>{fieldLabel}:</strong>{' '}
                              <span className="line-through text-red-600 dark:text-red-400">
                                {oldValue}
                              </span>
                              {' → '}
                              <span className="text-green-600 dark:text-green-400">
                                {newValue}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Informacja o zgodzie zarządu */}
              {selectedTicket?.type === 'PURCHASE' && (
                <div className={`p-3 rounded-lg border ${selectedTicket.isApprovedByManager === true
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                  : selectedTicket.isApprovedByManager === false
                    ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                    : 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'}`}>
                  <p className="text-sm font-semibold">
                    {selectedTicket.isApprovedByManager === true
                      ? '✅ Zgoda zarządu na realizację: przyznana'
                      : selectedTicket.isApprovedByManager === false
                        ? '❌ Zgoda zarządu na realizację: odrzucona'
                        : '⏳ Zgoda zarządu na realizację: oczekuje'}
                  </p>
                  {selectedTicket.approvedBy && (
                    <p className="text-xs mt-1">
                      Osoba decydująca: <strong>{selectedTicket.approvedBy.name}</strong>
                      {selectedTicket.approvalDate && (
                        <> • {new Date(selectedTicket.approvalDate).toLocaleDateString('pl-PL')}</>
                      )}
                    </p>
                  )}
                  {selectedTicket.managerComment && (
                    <p className="text-xs mt-1">
                      Komentarz: <strong>{selectedTicket.managerComment}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Przypisanie */}
              {selectedTicket?.assignedTo && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    🎯 Przypisane do: <strong>{selectedTicket.assignedTo.name}</strong>
                    {selectedTicket.assignedAt && (
                      <>, {new Date(selectedTicket.assignedAt).toLocaleDateString('pl-PL')}</>
                    )}
                  </p>
                </div>
              )}

              {selectedTicket?.assignedBy && (
                <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 p-3 rounded-lg">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    👤 Przypisane przez: <strong>{selectedTicket.assignedBy.name}</strong>
                  </p>
                </div>
              )}

              {/* Przycisk zamknięcia */}
              {editForm.status === 'CLOSED' && selectedTicket.closedAt && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✅ Zgłoszenie zostało zamknięte: {new Date(selectedTicket.closedAt).toLocaleDateString('pl-PL')}
                  </p>
                </div>
              )}

              {/* Przyciski akcji */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
