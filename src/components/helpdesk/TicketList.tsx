import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetTicketId = searchParams.get('ticketId') || searchParams.get('ticket');
  const targetToken = searchParams.get('token');

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
  const [readTicketsMap, setReadTicketsMap] = useState<Record<string, number>>({});
  const [managerCommentInput, setManagerCommentInput] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const isManagementUser = ['ZARZAD', 'ZARZĄD', 'DIRECTOR', 'MANAGER', 'ADMIN'].includes(currentUserRole.toUpperCase());

  useEffect(() => {
    fetchTickets();
  }, []);

  // Automatyczne otwieranie okna szczegółów zgłoszenia (modal) po wejściu z linku
  useEffect(() => {
    if (!targetTicketId) return;

    const openTargetTicket = async () => {
      const existingTicket = tickets.find(t => t.id === targetTicketId);
      if (existingTicket) {
        handleEditTicket(existingTicket);
        return;
      }

      try {
        const url = targetToken
          ? `/api/helpdesk/tickets/${targetTicketId}?token=${encodeURIComponent(targetToken)}`
          : `/api/helpdesk/tickets/${targetTicketId}`;

        const res = await fetch(url, { credentials: 'include' });
        if (res.ok) {
          const ticketData = await res.json();
          setSelectedTicket({
            ...ticketData,
            readByHelpDesk: true,
          });
          setEditForm({
            status: ticketData.status,
            estimatedDueDate: ticketData.estimatedDueDate ? new Date(ticketData.estimatedDueDate).toISOString().split('T')[0] : '',
            resolutionNotes: ticketData.resolutionNotes || '',
            readByHelpDesk: true,
            realizationStartedAt: ticketData.realizationStartedAt ? new Date(ticketData.realizationStartedAt).toISOString().split('T')[0] : '',
            realizedAt: ticketData.realizedAt ? new Date(ticketData.realizedAt).toISOString().split('T')[0] : '',
          });
          setManagerCommentInput(ticketData.managerComment || '');
          setChatMessage('');
          setShowEditModal(true);
        }
      } catch (err) {
        console.error('Error opening target ticket modal:', err);
      }
    };

    openTargetTicket();
  }, [targetTicketId, targetToken, tickets.length]);

  const handleCloseModal = () => {
    setShowEditModal(false);
    setSelectedTicket(null);
    if (targetTicketId) {
      router.replace('/helpdesk', { scroll: false });
    }
  };

  useEffect(() => {
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`helpdesk_read_tickets_${user.id}`);
        if (saved) {
          setReadTicketsMap(JSON.parse(saved));
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, [user?.id]);

  const markTicketAsReadLocal = (ticketId: string) => {
    const now = Date.now();
    setReadTicketsMap(prev => {
      const updated = { ...prev, [ticketId]: now };
      if (user?.id) {
        try {
          localStorage.setItem(`helpdesk_read_tickets_${user.id}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

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

    markTicketAsReadLocal(ticket.id);

    const shouldMarkRead = canManageTickets && !ticket.readByHelpDesk;

    setSelectedTicket({
      ...ticket,
      readByHelpDesk: true,
    });
    setEditForm({
      status: ticket.status,
      estimatedDueDate: ticket.estimatedDueDate ? new Date(ticket.estimatedDueDate).toISOString().split('T')[0] : '',
      resolutionNotes: ticket.resolutionNotes || '',
      readByHelpDesk: true,
      realizationStartedAt: ticket.realizationStartedAt ? new Date(ticket.realizationStartedAt).toISOString().split('T')[0] : '',
      realizedAt: ticket.realizedAt ? new Date(ticket.realizedAt).toISOString().split('T')[0] : '',
    });
    setManagerCommentInput(ticket.managerComment || '');
    setChatMessage('');
    setShowEditModal(true);

    if (shouldMarkRead) {
      fetch(`/api/helpdesk/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ readByHelpDesk: true }),
      }).then(res => {
        if (res.ok) {
          setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, readByHelpDesk: true, readByHelpDeskAt: new Date() } : t));
        }
      }).catch(err => console.error('Error marking read:', err));
    }
  };

  const handleManagementApproval = async (approved: boolean) => {
    if (!selectedTicket) return;
    setIsSubmittingDecision(true);

    try {
      const url = targetToken
        ? `/api/helpdesk/tickets/${selectedTicket.id}/approve?token=${encodeURIComponent(targetToken)}`
        : `/api/helpdesk/tickets/${selectedTicket.id}/approve`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          approved,
          managerComment: managerCommentInput.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Nie udało się zapisać decyzji.');
      }

      const getUrl = targetToken
        ? `/api/helpdesk/tickets/${selectedTicket.id}?token=${encodeURIComponent(targetToken)}`
        : `/api/helpdesk/tickets/${selectedTicket.id}`;
      const refreshedRes = await fetch(getUrl, { credentials: 'include' });
      const updatedTicket = refreshedRes.ok ? await refreshedRes.json() : null;

      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
        setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      } else {
        fetchTickets();
      }

      showToast(
        approved ? '✅ Wniosek został zatwierdzony przez Zarząd!' : '❌ Wniosek został odrzucony przez Zarząd.',
        approved ? 'success' : 'info'
      );
      handleCloseModal();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleSaveChanges = async (messageOverride?: string) => {
    if (!selectedTicket) return;

    const isStatusChanging = editForm.status !== selectedTicket.status;
    if (canManageTicketFields && isStatusChanging && !editForm.estimatedDueDate && !messageOverride) {
      showToast('Podanie terminu realizacji (kalendarz) jest wymagane przy zmianie statusu.', 'error');
      return;
    }

    const messageToSend = messageOverride ?? chatMessage.trim();
    if (messageOverride === undefined && !messageToSend && !isStatusChanging && editForm.resolutionNotes === (selectedTicket.resolutionNotes || '')) {
      handleCloseModal();
      return;
    }

    // Natychmiastowe (0ms) czyszczenie pola tekstowego dla super-płynnego odczucia UI
    setChatMessage('');

    try {
      const currentUserId = user?.id;

      const payload = {
        ...editForm,
        message: messageToSend,
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

      const response = await fetch(`/api/helpdesk/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Nie udało się zaktualizować zgłoszenia');

      const updatedTicket = await response.json();
      setSelectedTicket(updatedTicket);
      setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      showToast(messageOverride ? 'Wiadomość została wysłana do czatu.' : 'Zgłoszenie zostało zaktualizowane!', 'success');

      if (!messageOverride) {
        handleCloseModal();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const pendingApprovalTickets = useMemo(() => {
    let result = tickets.filter(ticket => ticket.type === 'PURCHASE' && ticket.status === 'PENDING_APPROVAL' && ticket.isApprovedByManager !== true);
    if (statusFilter !== 'ALL') {
      result = result.filter(ticket => ticket.status === statusFilter);
    }
    return result;
  }, [tickets, statusFilter]);

  const visibleTickets = useMemo(() => {
    let result = tickets;

    if (filter === 'PURCHASE') {
      result = result.filter(ticket => ticket.type === 'PURCHASE');
    } else if (filter === 'PROBLEM') {
      result = result.filter(ticket => ticket.type === 'PROBLEM');
    } else if (filter === 'PENDING_APPROVAL') {
      result = result.filter(ticket => ticket.type === 'PURCHASE' && ticket.status === 'PENDING_APPROVAL' && ticket.isApprovedByManager !== true);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(ticket => ticket.status === statusFilter);
    }

    if (dateFilter) {
      const selectedDate = new Date(dateFilter);
      if (!Number.isNaN(selectedDate.getTime())) {
        result = result.filter(ticket => {
          const createdAt = new Date(ticket.createdAt);
          return createdAt.getFullYear() === selectedDate.getFullYear()
            && createdAt.getMonth() === selectedDate.getMonth()
            && createdAt.getDate() === selectedDate.getDate();
        });
      }
    }

    return result.filter(ticket => !pendingApprovalTickets.some(pending => pending.id === ticket.id) || filter === 'PENDING_APPROVAL');
  }, [tickets, filter, statusFilter, dateFilter, pendingApprovalTickets]);

  const otherTickets = visibleTickets.filter(ticket => !pendingApprovalTickets.some(pending => pending.id === ticket.id));
  const isRestrictedHelpDeskUser = ['IT', 'IT HELP DESK', 'HELPDESK'].includes(currentUserRole);
  const statusChangeBlockedForHelpDesk = Boolean(
    selectedTicket &&
    isRestrictedHelpDeskUser &&
    selectedTicket.type === 'PURCHASE' &&
    selectedTicket.status === 'PENDING_APPROVAL' &&
    selectedTicket.isApprovedByManager !== true
  );

  const isPendingApprovalTicket = Boolean(
    selectedTicket &&
    selectedTicket.type === 'PURCHASE' &&
    selectedTicket.status === 'PENDING_APPROVAL' &&
    selectedTicket.isApprovedByManager !== true
  );

  const isTicketClosed = selectedTicket?.status === 'CLOSED';

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

  const checkUnreadMessage = (ticket: TicketWithUser) => {
    const messages = ticket.history?.filter((entry: any) => entry.field === 'message') || [];
    if (messages.length === 0) return false;

    const latestMsg = messages[0];
    const isFromOtherUser = latestMsg.user?.id !== user?.id && latestMsg.changedBy !== user?.id;
    if (!isFromOtherUser) return false;

    const latestMsgTime = new Date(latestMsg.createdAt).getTime();
    const localReadTime = readTicketsMap[ticket.id] || 0;

    const roleUpper = String(currentUserRole).toUpperCase();
    const isHelpDesk = ['IT', 'IT HELP DESK', 'HELPDESK'].includes(roleUpper);
    
    if (isHelpDesk) {
      const helpDeskReadTime = ticket.readByHelpDeskAt ? new Date(ticket.readByHelpDeskAt).getTime() : 0;
      const effectiveReadTime = Math.max(localReadTime, helpDeskReadTime);
      return latestMsgTime > effectiveReadTime;
    }

    return latestMsgTime > localReadTime;
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
            {checkUnreadMessage(ticket) && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800 inline-flex items-center gap-1 animate-pulse">
                <span>💬</span> Nowa wiadomość
              </span>
            )}
            {ticket.type === 'PURCHASE' && ticket.status === 'PENDING_APPROVAL' && ticket.isApprovedByManager !== true && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 inline-flex items-center gap-1">
                <span>⏳</span> Oczekuje na zarząd
              </span>
            )}
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {canManageTicketFields ? 'Zarządzaj zgłoszeniem' : 'Szczegóły zgłoszenia'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-2 flex-1">
              {/* Lewa kolumna: Informacje i Zarządzanie statusami / datami */}
              <div className="space-y-6">
                {/* Tytuł i typ */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{selectedTicket.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 whitespace-pre-wrap">{selectedTicket.description}</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md">
                      {TYPE_LABELS[selectedTicket.type]}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Utworzono: {new Date(selectedTicket.createdAt).toLocaleDateString('pl-PL')}
                    </span>
                  </div>
                </div>

                {/* Informacja o zamknięciu zgłoszenia */}
                {isTicketClosed && (
                  <div className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-3">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Zgłoszenie zostało zamknięte</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Zgłoszenie jest w stanie zamkniętym. Wszelka edycja pól oraz dodawanie wiadomości na czacie zostały zablokowane.
                      </p>
                    </div>
                  </div>
                )}

                {isPendingApprovalTicket ? (
                  <div className="bg-amber-50 dark:bg-amber-950/60 p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-700 space-y-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">⚠️</span>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">Wniosek Zakupowy oczekuje na decyzję Zarządu</h4>
                        <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                          Zgłoszenie wymaga weryfikacji i akceptacji przez Zarząd przed przekazaniem do realizacji.
                        </p>
                      </div>
                    </div>

                    {isManagementUser ? (
                      <div className="space-y-4 pt-3 border-t border-amber-200 dark:border-amber-800">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            💬 Komentarz / Uzasadnienie decyzji (opcjonalnie)
                          </label>
                          <input
                            type="text"
                            value={managerCommentInput}
                            onChange={(e) => setManagerCommentInput(e.target.value)}
                            placeholder="Wpisz uwagi lub uzasadnienie decyzji..."
                            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <button
                            onClick={() => handleManagementApproval(true)}
                            disabled={isSubmittingDecision}
                            className="px-5 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>✅</span> Zatwierdź wniosek
                          </button>
                          <button
                            onClick={() => handleManagementApproval(false)}
                            disabled={isSubmittingDecision}
                            className="px-5 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>❌</span> Odrzuć wniosek
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800 font-medium">
                        ⏳ Zgłoszenie oczekuje na decyzję Zarządu. Opcje realizacji zostaną odblokowane dla zespołu Help Desk po zatwierdzeniu.
                      </p>
                    )}
                  </div>
                ) : (
                  canManageTicketFields && (
                    <div className="space-y-4 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-base">⚙️ Ustawienia realizacji</h4>
                      
                      {/* Status */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status zgłoszenia</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            const today = new Date().toISOString().split('T')[0];
                            const autoSetStartDate = (newStatus === 'OPEN' || newStatus === 'IN_PROGRESS') && !editForm.realizationStartedAt;
                            const autoSetRealizedDate = newStatus === 'CLOSED' && !editForm.realizedAt;
                            setEditForm({
                              ...editForm,
                              status: newStatus,
                              realizationStartedAt: autoSetStartDate ? today : editForm.realizationStartedAt,
                              realizedAt: autoSetRealizedDate ? today : editForm.realizedAt,
                            });
                          }}
                          disabled={statusChangeBlockedForHelpDesk || isTicketClosed}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                        >
                          {Object.entries(STATUS_LABELS)
                            .filter(([key]) => {
                              if (isRestrictedHelpDeskUser && key === 'APPROVED') return false;
                              if (key === 'PENDING_APPROVAL' && (selectedTicket?.status !== 'PENDING_APPROVAL' || editForm.status !== 'PENDING_APPROVAL')) return false;
                              return true;
                            })
                            .map(([key, { label }]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                        </select>
                        {statusChangeBlockedForHelpDesk && !isTicketClosed && (
                          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
                            ⚠️ Zmiana statusu oraz przypisywanie dat są zablokowane do czasu zatwierdzenia przez zarząd. Możesz jednak dopisywać notatki i prowadzić rozmowę w tym zgłoszeniu.
                          </p>
                        )}
                      </div>

                      {/* Czas realizacji */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          📅 Szacowany termin realizacji (Kalendarz)
                        </label>
                        <input
                          type="date"
                          value={editForm.estimatedDueDate}
                          onChange={(e) => setEditForm({ ...editForm, estimatedDueDate: e.target.value })}
                          disabled={statusChangeBlockedForHelpDesk || isTicketClosed}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Daty realizacji */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            🚀 Realizacja rozpoczęta
                          </label>
                          <input
                            type="date"
                            value={editForm.realizationStartedAt}
                            onChange={(e) => setEditForm({ ...editForm, realizationStartedAt: e.target.value })}
                            disabled={statusChangeBlockedForHelpDesk || isTicketClosed}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            ✔️ Realizacja zakończona
                          </label>
                          <input
                            type="date"
                            value={editForm.realizedAt}
                            onChange={(e) => setEditForm({ ...editForm, realizedAt: e.target.value })}
                            disabled={statusChangeBlockedForHelpDesk || isTicketClosed}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                          />
                        </div>
                      </div>

                      {/* Status odczytania */}
                      <div className="pt-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.readByHelpDesk}
                            onChange={(e) => setEditForm({ ...editForm, readByHelpDesk: e.target.checked })}
                            disabled={isTicketClosed}
                            className="w-4 h-4 cursor-pointer disabled:opacity-60"
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
                    </div>
                  )
                )}

                {/* Informacja o zgodzie zarządu */}
                {selectedTicket?.type === 'PURCHASE' && (
                  <div className={`p-3.5 rounded-xl border ${selectedTicket.isApprovedByManager === true
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
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-xl">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      🎯 Przypisane do: <strong>{selectedTicket.assignedTo.name}</strong>
                      {selectedTicket.assignedAt && (
                        <>, {new Date(selectedTicket.assignedAt).toLocaleDateString('pl-PL')}</>
                      )}
                    </p>
                  </div>
                )}

                {selectedTicket?.assignedBy && (
                  <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 p-3 rounded-xl">
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      👤 Przypisane przez: <strong>{selectedTicket.assignedBy.name}</strong>
                    </p>
                  </div>
                )}

                {editForm.status === 'CLOSED' && selectedTicket.closedAt && (
                  <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      ✅ Zgłoszenie zostało zamknięte: {new Date(selectedTicket.closedAt).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                )}
              </div>

              {/* Prawa kolumna: Czat i Historia zmian */}
              <div className="space-y-6 flex flex-col justify-between">
                {/* Chat w zgłoszeniu */}
                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    💬 Czat w zgłoszeniu
                  </label>

                  <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 flex-1 flex flex-col justify-between">
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1 flex-1">
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

                    <div className="pt-2 space-y-2">
                      <textarea
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        disabled={isTicketClosed}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (chatMessage.trim() && !isTicketClosed) {
                              handleSaveChanges(chatMessage.trim());
                            }
                          }
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder={isTicketClosed ? "🔒 Zgłoszenie zostało zamknięte. Czat jest zablokowany." : "Napisz wiadomość w czacie..."}
                      />

                      <button
                        onClick={() => handleSaveChanges(chatMessage.trim())}
                        disabled={!chatMessage.trim() || isTicketClosed}
                        className="w-full px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <span>💬</span> Wyślij wiadomość czatu
                      </button>
                    </div>
                  </div>
                </div>

                {/* Historia zmian */}
                {selectedTicket?.history && selectedTicket.history.filter((entry: any) => entry.field !== 'message').length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">📋 Historia zmian statusów i pól</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedTicket.history
                        .filter((entry: any) => entry.field !== 'message')
                        .map((entry: any) => {
                          const fieldLabel = formatHistoryFieldLabel(entry.field);
                          const oldValue = formatHistoryValue(entry.field, entry.oldValue);
                          const newValue = formatHistoryValue(entry.field, entry.newValue);

                          return (
                            <div
                              key={entry.id}
                              className="text-xs bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700"
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
              </div>
            </div>

            {/* Stopka z przyciskami głównymi */}
            <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-xl transition-colors"
              >
                Zamknij
              </button>
              {!isTicketClosed && canManageTicketFields && (
                <button
                  type="button"
                  onClick={() => handleSaveChanges()}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-md flex items-center gap-2"
                >
                  <span>💾</span>
                  <span>Zapisz zmiany</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
