'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReportId?: string | null;
  onReportCreated?: () => void;
}

interface BugReportItem {
  id: string;
  title: string;
  description: string;
  category: string;
  pageUrl: string | null;
  pageName: string | null;
  status: string;
  priority: string;
  photoUrl: string | null;
  unreadForUser: boolean;
  unreadForAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    login: string;
  };
  _count?: {
    messages: number;
  };
}

interface BugReportMessage {
  id: string;
  bugReportId: string;
  message: string;
  attachmentUrl: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    login: string;
    role: string;
  };
}

const PAGE_OPTIONS = [
  { url: '/', name: '🏠 Strona Główna / Pulpit' },
  { url: '/audyty', name: '📋 Audyty 5S & Audyty Produktowe' },
  { url: '/bhp', name: '🛡️ Zgłoszenia BHP i Zagrożenia' },
  { url: '/jakosc', name: '🔍 Niezgodności Jakościowe' },
  { url: '/usterki', name: '🔧 Zgłoszenia Usterek i Maszyn' },
  { url: '/kaizen', name: '💡 Sugestie Udoskonalenia Kaizen' },
  { url: '/struktura', name: '🏢 Pracownicy i Struktura Zakładu' },
  { url: '/ustawienia', name: '⚙️ Ustawienia i Konfiguracja' },
  { url: '/logowanie', name: '🔑 Logowanie i Dostęp' },
  { url: 'OTHER', name: '🌐 Inna Strona / Ogólny problem z systemem' },
];

export function BugReportModal({ isOpen, onClose, initialReportId, onReportCreated }: BugReportModalProps) {
  const { user, isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'NEW' | 'LIST' | 'CHAT'>('NEW');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'BUG' | 'UI_ISSUE' | 'SUGGESTION' | 'QUESTION'>('BUG');
  const [selectedPageUrl, setSelectedPageUrl] = useState('');
  const [selectedPageName, setSelectedPageName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // List & Chat State
  const [reports, setReports] = useState<BugReportItem[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [selectedReport, setSelectedReport] = useState<BugReportItem | null>(null);
  const [messages, setMessages] = useState<BugReportMessage[]>([]);
  const [chatMessageText, setChatMessageText] = useState('');
  const [chatAttachmentUrl, setChatAttachmentUrl] = useState<string | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Auto-detect current page URL and name
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const matchedPage = PAGE_OPTIONS.find(p => p.url === path);
      if (matchedPage) {
        setSelectedPageUrl(matchedPage.url);
        setSelectedPageName(matchedPage.name);
      } else {
        setSelectedPageUrl(path);
        setSelectedPageName(`Wybrany adres: ${path}`);
      }

      fetchReports();

      if (initialReportId) {
        openChatForReport(initialReportId);
      }
    }
  }, [isOpen, initialReportId]);

  useEffect(() => {
    if (activeTab === 'CHAT' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await fetch('/api/bug-reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.bugReports || []);
        setUnreadTotal(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Error loading bug reports:', e);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const openChatForReport = async (reportId: string) => {
    setIsLoadingChat(true);
    setActiveTab('CHAT');
    try {
      const res = await fetch(`/api/bug-reports/${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedReport(data);
        setMessages(data.messages || []);
        fetchReports(); // Refresh badge counts
      }
    } catch (e) {
      showToast('Błąd ładowania konwersacji', 'error');
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Handle Clipboard Paste (Ctrl+V) Screenshot capture!
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await uploadImageFile(file);
        }
        break;
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadImageFile(file);
    }
  };

  const uploadImageFile = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Błąd wgrywania zdjęcia');
      
      if (activeTab === 'NEW') {
        setPhotoUrl(data.url);
      } else {
        setChatAttachmentUrl(data.url);
      }
      showToast('📸 Zrzut ekranu ze schowka został dołączony!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Błąd wgrywania zrzutu ekranu', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Wypełnij tytuł oraz opis problemu!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          pageUrl: selectedPageUrl,
          pageName: selectedPageName,
          photoUrl,
        }),
      });

      const created = await res.json();
      if (!res.ok) throw new Error(created.error || 'Błąd zapisywania zgłoszenia');

      showToast('🐛 Problem został pomyślnie zgłoszony! Administrator został powiadomiony.', 'success');
      setTitle('');
      setDescription('');
      setPhotoUrl(null);
      
      if (onReportCreated) onReportCreated();

      // Switch to Chat / Details for this created report
      openChatForReport(created.id);
    } catch (err: any) {
      showToast(err.message || 'Nie udało się wysłać zgłoszenia', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedReport) return;
    if (!chatMessageText.trim() && !chatAttachmentUrl) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch(`/api/bug-reports/${selectedReport.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatMessageText.trim(),
          attachmentUrl: chatAttachmentUrl,
        }),
      });

      const newMsg = await res.json();
      if (!res.ok) throw new Error(newMsg.error || 'Błąd wysyłania wiadomości');

      setMessages(prev => [...prev, newMsg]);
      setChatMessageText('');
      setChatAttachmentUrl(null);
      fetchReports();
    } catch (err: any) {
      showToast(err.message || 'Błąd wysyłania wiadomości', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedReport) return;
    try {
      const res = await fetch(`/api/bug-reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedReport(updated);
        showToast(`Zmieniono status zgłoszenia na: ${newStatus}`, 'success');
        fetchReports();
      }
    } catch (e) {
      showToast('Błąd zmiany statusu', 'error');
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onPaste={handlePaste}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border animate-in slide-in-from-top-3 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-600 text-white border-emerald-500' 
              : 'bg-red-600 text-white border-red-500'
          }`}>
            <span>{toastMessage.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-xl shadow-inner">
              🐛
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                Zgłoszenie Problemu & Wsparcie Techniczne
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Szybki kontakt z administratorem, wklejanie screenshotów (`Ctrl+V`) oraz historia dyskusji
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Zamknij"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('NEW')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'NEW'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>📝</span> Zgłoś Nowy Problem
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('LIST')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 relative ${
                activeTab === 'LIST'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>💬</span> {isAdmin ? 'Zgłoszenia Użytkowników' : 'Moje Rozmowy'}
              {unreadTotal > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white font-black text-[10px] rounded-full animate-pulse">
                  {unreadTotal}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'CHAT' && selectedReport && (
            <button
              type="button"
              onClick={() => setActiveTab('LIST')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
            >
              ← Powrót do listy
            </button>
          )}
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: FORMULARZ ZGŁOSZENIA PROBLEMU */}
          {activeTab === 'NEW' && (
            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2 font-medium">
                <span className="text-base">💡</span>
                <span>
                  **Wskazówka:** Po zrobieniu zrzutu ekranu (`PrintScreen` lub *Narzędzie Wycinanie*), kliknij w tym oknie i wciśnij **Ctrl+V**, aby automatycznie załączyć obraz ze schowka!
                </span>
              </div>

              {/* Wybór Strony / Modułu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    📍 Której strony / modułu dotyczy problem? *
                  </label>
                  <select
                    value={selectedPageUrl}
                    onChange={e => {
                      setSelectedPageUrl(e.target.value);
                      const matched = PAGE_OPTIONS.find(p => p.url === e.target.value);
                      setSelectedPageName(matched ? matched.name : e.target.value);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {PAGE_OPTIONS.map(p => (
                      <option key={p.url} value={p.url}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    🏷️ Typ Zgłoszenia *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="BUG">🐛 Błąd / Usterka w działaniu systemu</option>
                    <option value="UI_ISSUE">🎨 Problem z widokiem / Wyglądem / Układem</option>
                    <option value="SUGGESTION">💡 Sugestia / Propozycja udoskonalenia</option>
                    <option value="QUESTION">❓ Pytanie do Administratora</option>
                  </select>
                </div>
              </div>

              {/* Tytuł Zgłoszenia */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Krótki Tytuł Problemu *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Napisz krótko co poszło nie tak (np. 'Przycisk Zapisz nie reaguje w BHP')..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Opis Zgłoszenia z Paste Listener */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Szczegółowy Opis Problemu * (Wklej zrzut ekranu przez Ctrl+V)
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Opisz co kliknąłeś, jaki komunikat się pojawił. Tutaj również działa bezpośrednie wklejanie zrzutu ekranu klawiszami Ctrl+V..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Podgląd Załączonego Zdjęcia / Screenshot ze schowka */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  📸 Zrzut Ekranu / Dowód Zdjęciowy
                </span>

                {photoUrl ? (
                  <div className="relative inline-block border-2 border-red-500 rounded-2xl overflow-hidden group shadow-md">
                    <img src={photoUrl} alt="Zrzut ekranu" className="max-h-48 rounded-xl object-contain bg-slate-100" />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(null)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full font-bold text-xs shadow-lg hover:bg-red-500"
                      title="Usuń zrzut ekranu"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded-lg backdrop-blur-xs">
                      📸 Załączono zrzut ekranu
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>📎</span> Wybierz plik ze zrzutem / galerią
                    </button>
                    <span className="text-xs text-slate-400 font-medium">lub po prostu wciśnij **Ctrl+V**</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs rounded-2xl shadow-lg hover:shadow-red-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>🚀</span> {isSubmitting ? 'Wysyłanie zgłoszenia...' : 'Wyślij Zgłoszenie Problemu'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: LISTA ZGŁOSZEŃ */}
          {activeTab === 'LIST' && (
            <div className="space-y-4">
              {isLoadingReports ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400">
                  Ładowanie zgłoszeń...
                </div>
              ) : reports.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <span className="text-3xl block">🐛</span>
                  <p className="text-xs font-bold text-slate-500">Brak zarejestrowanych zgłoszeń problemów</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map(report => (
                    <div
                      key={report.id}
                      onClick={() => openChatForReport(report.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 hover:shadow-md ${
                        (isAdmin && report.unreadForAdmin) || (!isAdmin && report.unreadForUser)
                          ? 'bg-red-50 dark:bg-red-950/30 border-red-500/60 ring-2 ring-red-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg ${
                            report.status === 'OPEN' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' :
                            report.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' :
                            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          }`}>
                            {report.status === 'OPEN' ? '⏳ Oczekuje' : report.status === 'IN_PROGRESS' ? '⚙️ W trakcie' : '✅ Rozwiązano'}
                          </span>

                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                            {report.title}
                          </span>

                          {((isAdmin && report.unreadForAdmin) || (!isAdmin && report.unreadForUser)) && (
                            <span className="px-2 py-0.5 bg-red-600 text-white font-black text-[10px] rounded-full animate-bounce">
                              NOWA ODPOWIEDŹ!
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">
                          {report.description}
                        </p>

                        <div className="text-[10px] text-slate-400 flex items-center gap-3 font-mono pt-1">
                          <span>👤 {report.createdBy?.name || 'Użytkownik'}</span>
                          <span>📍 {report.pageName || report.pageUrl || '—'}</span>
                          <span>📅 {new Date(report.createdAt).toLocaleString('pl-PL')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl">
                          💬 {report._count?.messages || 0}
                        </span>
                        <span className="text-slate-400">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KONWERSACJA CZAT */}
          {activeTab === 'CHAT' && selectedReport && (
            <div className="space-y-4">
              {/* Report Header & Status Bar */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Zgłoszenie #{selectedReport.id.slice(0, 8)}</span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{selectedReport.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedReport.description}</p>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Status:</span>
                    <select
                      value={selectedReport.status}
                      onChange={e => handleUpdateStatus(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                    >
                      <option value="OPEN">⏳ Oczekuje na reakcję</option>
                      <option value="IN_PROGRESS">⚙️ W trakcie weryfikacji</option>
                      <option value="RESOLVED">✅ Rozwiązany problem</option>
                      <option value="CLOSED">🔒 Zamknięty</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Photo screenshot if attached */}
              {selectedReport.photoUrl && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Załączony zrzut ekranu:</span>
                  <img src={selectedReport.photoUrl} alt="Zrzut" className="max-h-44 object-contain rounded-xl border" />
                </div>
              )}

              {/* Chat Thread Messages Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[350px] overflow-y-auto space-y-3">
                {isLoadingChat ? (
                  <div className="py-8 text-center text-xs text-slate-400">Ładowanie historii rozmowy...</div>
                ) : messages.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Napisz pierwszą wiadomość poniżej, aby rozpocząć konwersację z administratorem.
                  </div>
                ) : (
                  messages.map(msg => {
                    const isSelf = msg.sender.id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{msg.sender.name}</span>
                          <span>({msg.sender.role})</span>
                          <span>• {new Date(msg.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className={`p-3.5 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                          isSelf
                            ? 'bg-red-600 text-white rounded-tr-xs shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-xs shadow-xs'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.message}</p>

                          {msg.attachmentUrl && (
                            <img src={msg.attachmentUrl} alt="Załącznik" className="mt-2 max-h-36 object-contain rounded-xl border" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="space-y-2">
                {chatAttachmentUrl && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl text-xs">
                    <span>📸 Załączony obraz ze schowka</span>
                    <button type="button" onClick={() => setChatAttachmentUrl(null)} className="text-red-500 font-bold ml-auto">✕</button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <textarea
                    rows={2}
                    value={chatMessageText}
                    onChange={e => setChatMessageText(e.target.value)}
                    placeholder="Wpisz wiadomość... (Działa również wklejanie Ctrl+V zrzutu ekranu)"
                    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-red-500"
                  />

                  <button
                    type="submit"
                    disabled={isSendingMessage}
                    className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all cursor-pointer"
                  >
                    <span>Wyślij</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
