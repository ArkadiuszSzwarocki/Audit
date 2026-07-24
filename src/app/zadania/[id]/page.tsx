'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { useAudits } from '@/hooks/useAudits';
import { useObservations } from '@/hooks/useObservations';
import { useUsers } from '@/hooks/useUsers';
import { ImageModal } from '@/components/ui/ImageModal';
import { ExtendDeadlineModal } from '@/components/ui/ExtendDeadlineModal';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';

const getNormalizedSeverity = (sev?: string | null): 'CRITICAL' | 'MODERATE' | 'MINOR' => {
  if (!sev) return 'MINOR';
  const s = sev.toUpperCase();
  if (s === 'CRITICAL' || s.includes('KRYTYCZ') || s.includes('KO')) return 'CRITICAL';
  if (s === 'MODERATE' || s.includes('UMIARK')) return 'MODERATE';
  if (s === 'MINOR' || s.includes('MAŁO') || s.includes('MALO') || s.includes('DROB')) return 'MINOR';
  return 'MINOR';
};

const SEVERITY_LABELS: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: '🔴 Krytyczne', cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800' },
  MODERATE: { label: '🟡 Umiarkowane', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800' },
  MINOR: { label: '🟢 Drobne / Zwykłe', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' },
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const { user, isAdmin } = useAuth();
  const { users, fetchUsers } = useUsers();
  const { extendDueDate } = useAudits();
  const { deleteObservation, assignObservation } = useObservations();

  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Operator Fix Form state
  const [operatorName, setOperatorName] = useState('');
  const [operatorComment, setOperatorComment] = useState('');
  const [fixPhotoUrl, setFixPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingFix, setIsSubmittingFix] = useState(false);

  // Modals state
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useAccessTracker({
    entityType: 'TASK',
    entityId: resolvedParams.id,
    entityTitle: task?.aiSuggestion || task?.description || 'Zadanie Produkcyjne',
  });

  useEffect(() => {
    loadData();
    fetchUsers(false);
  }, [resolvedParams.id, fetchUsers]);

  const handleAssignUser = async (userId: string) => {
    try {
      await assignObservation(resolvedParams.id, userId || null);
      showToast('Przypisanie zadania zostało zaktualizowane!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Nie udało się przypisać zadania', 'error');
    }
  };

  useEffect(() => {
    if (user && !operatorName) {
      setOperatorName(user.name);
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/observations/${resolvedParams.id}`);
      if (!res.ok) throw new Error('Nie znaleziono zadania produkcyjnego');
      const data = await res.json();
      setTask(data);
    } catch (err: any) {
      showToast(err.message || 'Nie znaleziono zadania', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFixPhotoUrl(data.url);
      showToast('Dodano zdjęcie po wykonaniu!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Błąd przesyłania zdjęcia', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFixSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorName.trim()) {
      showToast('Wpisz swoje imię i nazwisko', 'error');
      return;
    }

    setIsSubmittingFix(true);
    try {
      const res = await fetch(`/api/observations/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fix',
          fixedBy: operatorName.trim(),
          fixPhotoUrl: fixPhotoUrl || undefined,
          operatorComment: operatorComment.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Błąd zapisywania wykonania zadania');

      showToast('Zadanie zostało oznaczone jako wykonane!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Błąd wykonania zadania', 'error');
    } finally {
      setIsSubmittingFix(false);
    }
  };

  const handleExtendDueDateSubmit = async (newDueDate: string, reason: string) => {
    try {
      await extendDueDate(resolvedParams.id, newDueDate, reason, user?.name || 'Operator');
      showToast('Termin zadania został wydłużony!', 'success');
      setIsExtendModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Błąd wydłużania terminu', 'error');
    }
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Usuwanie Zadania',
      message: 'Czy na pewno chcesz usunąć to zadanie produkcyjne?',
      confirmText: 'Usuń zadanie',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteObservation(resolvedParams.id);
          showToast('Zadanie zostało usunięte', 'success');
          router.push('/zadania');
        } catch (err: any) {
          showToast(err.message || 'Nie udało się usunąć zadania', 'error');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center animate-pulse text-slate-400 font-bold">
        Ładowanie pełnych szczegółów zadania...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <div className="text-xl font-bold text-red-600">Nie znaleziono zadania produkcyjnego</div>
        <Link href="/zadania" className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold text-xs inline-block">
          ⬅️ Powrót do listy zadań
        </Link>
      </div>
    );
  }

  const normSev = getNormalizedSeverity(task.severity);
  const sevBadge = SEVERITY_LABELS[normSev];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const isCompleted = task.isFixed;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <Link
            href="/zadania"
            className="text-xs font-bold text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1.5 transition-colors mb-2"
          >
            <span>⬅️</span> Powrót do Listy Zadań
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 text-xs font-black rounded-lg border ${sevBadge.cls}`}>
              {sevBadge.label}
            </span>
            {isCompleted ? (
              <span className="px-2.5 py-1 text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 rounded-lg">
                ✅ WYKONANE / NAPRAWIONE
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 rounded-lg">
                ⏳ W REALIZACJI (OTWARTE)
              </span>
            )}
            {task.dueDate && (
              <span
                className={`px-2.5 py-1 text-xs font-black rounded-lg border ${
                  isOverdue
                    ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300'
                    : 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300'
                }`}
              >
                📅 Termin: {new Date(task.dueDate).toLocaleDateString('pl-PL')}
                {isOverdue && !isCompleted && ' ⚠️ PRZEKROCZONY!'}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 pt-2 leading-tight">
            {task.aiSuggestion || task.description}
          </h1>
        </div>

        {/* Quick actions top bar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            📜 Historia Dostępu
          </button>
          {!isCompleted && (
            <button
              onClick={() => setIsExtendModalOpen(true)}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold text-xs rounded-xl border border-amber-300 dark:border-amber-800 transition-colors cursor-pointer"
            >
              📅 Wydłuż Termin
            </button>
          )}
          {isAdmin && (
            <button
              onClick={handleDelete}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold text-xs rounded-xl border border-red-200 dark:border-red-800 transition-colors cursor-pointer"
            >
              🗑️ Usuń
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Details + Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Details & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <h2 className="text-sm font-black uppercase text-slate-500 tracking-wider">
              📋 Parametry Zadania Produkcyjnego
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-black block">📍 Obszar / Rejon</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {task.audit?.area?.name || 'Brak przypisanego obszaru'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-black block">⚙️ Maszyna / Urządzenie</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {task.audit?.machine?.name || 'Ogólne dla rejonu'}
                </span>
              </div>

              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800">
                <label className="text-[10px] text-amber-800 dark:text-amber-400 uppercase font-black block mb-1">
                  👤 Osoba Odpowiedzialna (Przypisany Wykonawca)
                </label>
                <select
                  value={task.assignedToId || task.assignedTo?.id || ''}
                  onChange={(e) => handleAssignUser(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">⚪ Nieprzypisane (Zadanie Zespołowe)</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      👤 {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-black block">📋 Audyt Źródłowy</span>
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                  {task.audit?.title || 'Audyt Produkcyjny'}
                </span>
              </div>
            </div>

            {/* Description Details Box */}
            <div className="pt-2">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">
                📝 Opis Spostrzeżenia i Wymóg
              </label>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-sm font-medium leading-relaxed">
                {task.description}
              </div>
            </div>

            {/* Convert to Kaizen link */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  router.push(
                    `/kaizen/nowy?title=${encodeURIComponent(
                      'Kaizen z audytu: ' + (task.aiSuggestion || task.description)
                    )}&description=${encodeURIComponent(task.description)}`
                  );
                }}
                className="px-4 py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 text-amber-950 dark:text-amber-200 rounded-xl font-bold text-xs transition-colors border border-amber-300 dark:border-amber-800 cursor-pointer flex items-center gap-1.5"
              >
                <span>💡</span> Przekształć to Zadanie w Wniosek Kaizen
              </button>
            </div>
          </div>

          {/* Timeline of Extensions */}
          {task.extensions && task.extensions.length > 0 && (
            <div className="glass-card p-6 border border-amber-200 dark:border-amber-900/60 rounded-3xl space-y-3">
              <h3 className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                <span>📅</span> Historia Wydłużeń Terminu Realizacji ({task.extensions.length})
              </h3>
              <div className="space-y-2">
                {task.extensions.map((ext: any, i: number) => (
                  <div key={ext.id || i} className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        Wydłużono do: {new Date(ext.newDueDate).toLocaleDateString('pl-PL')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(ext.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      Uzasadnienie: <em>"{ext.reason}"</em>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Wnioskujący: <strong>{ext.requestedBy}</strong>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution / Fix Form or Completed Summary */}
          {isCompleted ? (
            <div className="glass-card p-6 border-2 border-emerald-400 dark:border-emerald-700 rounded-3xl bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-emerald-500 text-white rounded-2xl">✅</span>
                <div>
                  <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-100">Zadanie Zostało Wykonane!</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Rozliczono dnia: {task.fixedAt ? new Date(task.fixedAt).toLocaleString('pl-PL') : 'Rozliczone'} przez <strong>{task.fixedBy}</strong>
                  </p>
                </div>
              </div>

              {task.operatorComment && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-200 text-xs font-medium">
                  <strong>Komentarz Wykonawcy:</strong> {task.operatorComment}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-6 border-2 border-emerald-500/40 rounded-3xl bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:to-slate-900 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-emerald-600 text-white rounded-2xl">🛠️</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Formularz Realizacji Zadania przez Operatora
                  </h3>
                  <p className="text-xs text-slate-500">
                    Wypełnij poniższe dane i dodaj zdjęcie potwierdzające wykonanie naprawy / eliminację niezgodności.
                  </p>
                </div>
              </div>

              <form onSubmit={handleFixSubmit} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Imię i Nazwisko Wykonawcy / Operatora *
                  </label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="np. Jan Kowalski"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Uwagi / Opis Podjętych Działań (Opcjonalnie)
                  </label>
                  <textarea
                    rows={2}
                    value={operatorComment}
                    onChange={(e) => setOperatorComment(e.target.value)}
                    placeholder="np. Usunięto wyciek oleju, dokręcono zawór podajnika..."
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Fix Photo Upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    📷 Zdjęcie Po Naprawie / Wykonaniu (Opcjonalnie)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-2">
                      <span>📸</span> {isUploading ? 'Przesyłanie...' : 'Dodaj Zdjęcie Po Naprawie'}
                      <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                    </label>

                    {fixPhotoUrl && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        ✓ Zdjęcie dołączone
                      </span>
                    )}
                  </div>
                </div>

                {/* Submit Fix Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingFix}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>✅</span> {isSubmittingFix ? 'Zapisywanie...' : 'Oznacz Zadanie Jako Wykonane / Naprawione'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Photo Cards */}
        <div className="space-y-6">
          {/* Photo Before (Inspection) */}
          <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <span>🖼️</span> Zdjęcie Zostanej Niezgodności (Przed)
            </h3>
            {task.photoUrl ? (
              <div
                onClick={() => setSelectedImage(task.photoUrl)}
                className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group bg-slate-900"
              >
                <img
                  src={task.photoUrl}
                  alt="Zdjęcie usterki"
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                  <span>🔍 Powiększ zdjęcie</span>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center text-slate-400 text-xs font-semibold">
                Brak zdjęcia niezgodności z audytu.
              </div>
            )}
          </div>

          {/* Photo After (Fix) */}
          <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <h3 className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
              <span>📸</span> Zdjęcie Po Realizacji (Po)
            </h3>
            {task.fixPhotoUrl || fixPhotoUrl ? (
              <div
                onClick={() => setSelectedImage(task.fixPhotoUrl || fixPhotoUrl)}
                className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 dark:border-emerald-700 cursor-pointer group bg-slate-900"
              >
                <img
                  src={task.fixPhotoUrl || fixPhotoUrl || ''}
                  alt="Zdjęcie po wykonaniu"
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                  <span>🔍 Powiększ zdjęcie</span>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center text-slate-400 text-xs font-semibold">
                Brak zdjęcia po naprawie.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ImageModal
        isOpen={!!selectedImage}
        imageUrl={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      <ExtendDeadlineModal
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
        currentDueDate={task.dueDate}
        onExtend={handleExtendDueDateSubmit}
      />

      {isHistoryModalOpen && (
        <DocumentAccessHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          entityType="TASK"
          entityId={resolvedParams.id}
          entityTitle={task.aiSuggestion || task.description}
        />
      )}
    </div>
  );
}
