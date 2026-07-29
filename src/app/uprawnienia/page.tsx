'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

interface PermissionActionMeta {
  key: string;
  label: string;
  category: string;
  emoji: string;
  description: string;
}

const ALL_ROLES = [
  { id: 'ADMIN', name: '🛡️ Admin / Master Admin', badgeBg: 'bg-red-600 text-white' },
  { id: 'ZARZAD', name: '👔 Zarząd (Board)', badgeBg: 'bg-purple-600 text-white' },
  { id: 'KIEROWNIK', name: '👨‍💼 Kierownik / Manager', badgeBg: 'bg-blue-600 text-white' },
  { id: 'BRYGADZISTA', name: '👥 Brygadzista / Lider', badgeBg: 'bg-indigo-600 text-white' },
  { id: 'OPERATOR', name: '⚙️ Operator / Pracownik', badgeBg: 'bg-emerald-600 text-white' },
  { id: 'KOMISJA_KAIZEN', name: '⚡ Komisja Kaizen', badgeBg: 'bg-amber-600 text-white' },
  { id: 'INSPEKTOR', name: '📋 Audytor / BHP / Jakość', badgeBg: 'bg-cyan-600 text-white' },
];

const PERMISSION_ACTIONS: PermissionActionMeta[] = [
  // 1. Dashboard
  { key: 'dashboard.view', label: 'Dostęp do Dashboardu i KPI', category: '📊 Dashboard & KPI', emoji: '📊', description: 'Podgląd wskaźników zakładu, zgłoszeń i powiadomień na stronie głównej.' },
  { key: 'dashboard.export', label: 'Eksport Raportów Wskaźników', category: '📊 Dashboard & KPI', emoji: '📥', description: 'Eksportowanie danych zbiorczych i raportów z pulpitu głównego.' },

  // 2. Usterki i Awarie
  { key: 'faults.view', label: 'Podgląd Rejestru Usterek', category: '🛠️ Usterki & Awarie', emoji: '👁️', description: 'Dostęp do listy zgłoszeń usterek i stanu maszyn.' },
  { key: 'faults.create', label: 'Zgłaszanie Nowej Usterki', category: '🛠️ Usterki & Awarie', emoji: '➕', description: 'Przycisk "+ Zgłoś Usterkę" na Hali produkcyjnej.' },
  { key: 'faults.update_status', label: 'Zmiana Statusu Usterki (W trakcie/Usunięta)', category: '🛠️ Usterki & Awarie', emoji: '🔄', description: 'Rozpoczynanie i zamykanie prac naprawczych przy maszynie.' },
  { key: 'faults.assign_mechanic', label: 'Przypisywanie Technika / Mechanika', category: '🛠️ Usterki & Awarie', emoji: '👤', description: 'Przydzielanie osoby odpowiedzialnej za usunięcie usterki.' },
  { key: 'faults.delete', label: 'Usuwanie Zgłoszeń Usterki z Bazy', category: '🛠️ Usterki & Awarie', emoji: '🗑️', description: 'Trwałe usuwanie nieprawidłowych lub dublujących się zgłoszeń.' },
  { key: 'faults.print_pdf', label: 'Druk i Pobieranie Protokołu PDF', category: '🛠️ Usterki & Awarie', emoji: '📄', description: 'Generowanie oficjalnego dokumentu PDF usterki z kodem QR.' },

  // 3. Innowacje Kaizen
  { key: 'kaizen.view', label: 'Podgląd Bazy Pomysłów Kaizen', category: '💡 Innowacje Kaizen', emoji: '👁️', description: 'Przeglądanie opisu pomysłów, rankingów i regulaminu.' },
  { key: 'kaizen.create', label: 'Zgłaszanie Nowego Kaizen', category: '💡 Innowacje Kaizen', emoji: '💡', description: 'Przycisk "+ Zgłoś Pomysł Kaizen" dla pracowników.' },
  { key: 'kaizen.score', label: 'Ocenianie i Przyznawanie Punktów', category: '💡 Innowacje Kaizen', emoji: '⭐', description: 'Weryfikacja przez Komisję Kaizen i przydział punktów.' },
  { key: 'kaizen.manage_payouts', label: 'Zarządzanie Wypłatami i Druk Aneksu PDF', category: '💡 Innowacje Kaizen', emoji: '💰', description: 'Zatwierdzanie premii finansowych i generowanie Aneksu PDF.' },
  { key: 'kaizen.delete', label: 'Usuwanie Pomysłów Kaizen', category: '💡 Innowacje Kaizen', emoji: '🗑️', description: 'Kasowanie zgłoszeń Kaizen z bazy danych.' },

  // 4. Urlopy i Czas Pracy
  { key: 'leaves.view_calendar', label: 'Podgląd Osobistego Kalendarza Urlopów', category: '📅 Urlopy & Czas Pracy', emoji: '🗓️', description: 'Dostęp do stanu salda i kalendarza własnego.' },
  { key: 'leaves.create_request', label: 'Składanie Wniosków Urlopowych (15 typów KP)', category: '📅 Urlopy & Czas Pracy', emoji: '✉️', description: 'Wybór dat i rodzaju urlopu zgodnego z polskim Kodeksem Pracy.' },
  { key: 'leaves.view_team_calendar', label: 'Podgląd Ogólnego Grafiku Zespołu', category: '📅 Urlopy & Czas Pracy', emoji: '🌐', description: 'Dostęp do zakładek "Ogólny Grafik Zespołu" (matrix firmy).' },
  { key: 'leaves.approve', label: 'Aprobata i Odrzucanie Wniosków Podwładnych', category: '📅 Urlopy & Czas Pracy', emoji: '✅', description: 'Przyjmowanie i odrzucanie wniosków urlopowych pracowników.' },
  { key: 'leaves.cancel_approved', label: 'Anulowanie Zatwierdzonych Wniosków (Zwrot Dni)', category: '📅 Urlopy & Czas Pracy', emoji: '🔄', description: 'Usuwanie zatwierdzonego wniosku i zwrot dni do puli urlopowej.' },
  { key: 'leaves.manage_balances', label: 'Edycja Salda i Dni Urlopowych (HR)', category: '📅 Urlopy & Czas Pracy', emoji: '⚙️', description: 'Modyfikacja puli urlopu zaległego i bieżącego pracowników.' },
  { key: 'leaves.export_reports', label: 'Eksport Raportów i Zestawień Urlopowych', category: '📅 Urlopy & Czas Pracy', emoji: '📊', description: 'Generowanie raportów nieobecności dla Kadr.' },

  // 5. Kody QR Generator
  { key: 'qr.view', label: 'Podgląd Generatora Kodów QR', category: '📱 Kody QR & Etykiety', emoji: '📱', description: 'Dostęp do modułu tworzenia kodów QR dla maszyn i rejonów.' },
  { key: 'qr.create', label: 'Tworzenie Nowych Etykiet QR', category: '📱 Kody QR & Etykiety', emoji: '➕', description: 'Dodawanie wpisów QR dla palet, regałów i pojemników.' },
  { key: 'qr.edit_shortcode', label: 'Edycja Synonimów / Skrótów Maszyn', category: '📱 Kody QR & Etykiety', emoji: '✏️', description: 'Modyfikacja unikalnych identyfikatorów maszyn (ShortCode).' },
  { key: 'qr.print_3x4', label: 'Druk i Pobieranie Arkusza PDF A4 (Siatka 3x4)', category: '📱 Kody QR & Etykiety', emoji: '🖨️', description: 'Szybkie drukowanie 12 kodów QR na jednej stronie A4.' },

  // 6. Bezpieczeństwo BHP
  { key: 'bhp.view', label: 'Podgląd Zgłoszeń i Rejestru BHP', category: '🦺 Bezpieczeństwo BHP', emoji: '👁️', description: 'Przeglądanie bazy zagrożeń niebezpiecznych i potknięć.' },
  { key: 'bhp.create_report', label: 'Zgłaszanie Nagłego Zagrożenia BHP', category: '🦺 Bezpieczeństwo BHP', emoji: '🚨', description: 'Formularz zgłaszania zdarzeń potencjalnie wypadkowych.' },
  { key: 'bhp.manage_actions', label: 'Ustalanie Działań Korygujących i Zamykanie', category: '🦺 Bezpieczeństwo BHP', emoji: '🔧', description: 'Przypisywanie wykonawców i akceptacja naprawy BHP.' },
  { key: 'bhp.manage_trainings', label: 'Edycja Terminów Szkoleń BHP Pracowników', category: '🦺 Bezpieczeństwo BHP', emoji: '🎓', description: 'Nadzorowanie ważności badań i szkoleń wstępnych/okresowych.' },

  // 7. Kontrola Jakości
  { key: 'quality.view', label: 'Podgląd Rejestru Niezgodności Jakościowych', category: '🔍 Kontrola Jakości', emoji: '👁️', description: 'Baza braków produkcyjnych i wad surowcowych.' },
  { key: 'quality.create', label: 'Zgłaszanie Problemów Jakościowych', category: '🔍 Kontrola Jakości', emoji: '➕', description: 'Formularz zgłaszania wady partii surowca lub wyrobu.' },
  { key: 'quality.decide', label: 'Wydawanie Decyzji Jakościowych & Blokada Partii', category: '🔍 Kontrola Jakości', emoji: '⚖️', description: 'Decyzje o złomowaniu, zwrocie do dostawcy lub warunkowym użyciu.' },
  { key: 'quality.print_pdf', label: 'Druk Protokołu Reklamacji Jakości PDF', category: '🔍 Kontrola Jakości', emoji: '📄', description: 'Generowanie oficjalnego raportu wady surowcowej.' },

  // 8. Struktura i Maszyny
  { key: 'structure.view', label: 'Podgląd Drzewa Organizacyjnego i Maszyn', category: '🏭 Struktura & Maszyny', emoji: '🌳', description: 'Przeglądanie hierarchii departamentów, rejonów i maszyn.' },
  { key: 'structure.create', label: 'Dodawanie Departamentu / Rejonu / Maszyny', category: '🏭 Struktura & Maszyny', emoji: '➕', description: 'Rozbudowa drzewa obiektów produkcyjnych.' },
  { key: 'structure.edit', label: 'Edycja Nazw, Rejonów i Synonimów Maszyn', category: '🏭 Struktura & Maszyny', emoji: '✏️', description: 'Zmiana parametrów i przypisania liderów obszarów.' },
  { key: 'structure.delete', label: 'Usuwanie Elementu Struktury', category: '🏭 Struktura & Maszyny', emoji: '🗑️', description: 'Kasowanie obiektów z bazy danych z zachowaniem spójności.' },

  // 9. Użytkownicy i Organizacja
  { key: 'users.view', label: 'Podgląd Bazy Pracowników i Ról', category: '🏢 Organizacja & Konta', emoji: '👥', description: 'Lista użytkowników z przypisanymi działami i uprawnieniami.' },
  { key: 'users.create', label: 'Dodawanie Nowego Pracownika', category: '🏢 Organizacja & Konta', emoji: '👤', description: 'Rejestracja nowych kont i generowanie haseł.' },
  { key: 'users.edit', label: 'Edycja Danych, Ról i Działów Użytkownika', category: '🏢 Organizacja & Konta', emoji: '🛠️', description: 'Zmiana roli (np. z Operatora na Kierownika lub Zarząd).' },
  { key: 'users.reset_password', label: 'Resetowanie Hasła Użytkownika', category: '🏢 Organizacja & Konta', emoji: '🔑', description: 'Generowanie nowego dostępu dla pracownika.' },
  { key: 'users.delete', label: 'Usuwanie Konta Pracownika z Bazy', category: '🏢 Organizacja & Konta', emoji: '🗑️', description: 'Dezaktywacja / wykasowanie konta z rejestru.' },

  // 10. Audyty 5S
  { key: 'audits.view', label: 'Podgląd Harmonogramu Audytów', category: '📝 Audyty 5S', emoji: '📅', description: 'Przeglądanie planowanych i ukończonych audytów.' },
  { key: 'audits.start', label: 'Przeprowadzanie i Wypełnianie Karty Audytu', category: '📝 Audyty 5S', emoji: '✍️', description: 'Wypełnianie pytań checklisty 5S i wprowadzanie uwag.' },
  { key: 'audits.evaluate', label: 'Ocenianie i Przyznawanie Punktów Audytowych', category: '📝 Audyty 5S', emoji: '💯', description: 'Podliczanie wskaźnika zgodności 5S stanowiska.' },
  { key: 'audits.print_pdf', label: 'Druk Raportu Audytu PDF ze Zdjęciami', category: '📝 Audyty 5S', emoji: '🖨️', description: 'Generowanie pełnego dokumentu podsumowującego audyt.' },

  // 11. HelpDesk IT
  { key: 'helpdesk.view', label: 'Podgląd Zgłoszeń IT', category: '💻 HelpDesk IT', emoji: '👁️', description: 'Lista incydentów IT i stanu ich naprawy.' },
  { key: 'helpdesk.create', label: 'Zgłaszanie Awarii IT', category: '💻 HelpDesk IT', emoji: '➕', description: 'Formularz zgłaszania awarii sprzętu/sieci/drukarki.' },
  { key: 'helpdesk.resolve', label: 'Zmiana Statusu i Obsługa Zgłoszenia IT', category: '💻 HelpDesk IT', emoji: '🔧', description: 'Zamykanie zgłoszeń i przypisywanie technika.' },
];

export default function UprawnieniaPage() {
  const { user } = useAuth();
  const { showToast, showConfirm } = useToast();

  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const router = useRouter();

  const canSeePermissions = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    return ['ADMIN', 'ADMINISTRATOR', 'MASTER ADMIN', 'MASTER_ADMIN', 'SUPERADMIN', 'ZARZAD', 'ZARZĄD', 'BOARD', 'KIEROWNIK', 'MANAGER', 'DYREKTOR', 'DIRECTOR'].includes(role);
  }, [user]);

  useEffect(() => {
    if (user && !canSeePermissions) {
      router.push('/');
    }
  }, [user, canSeePermissions, router]);

  const isManagement = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    return ['ADMIN', 'ADMINISTRATOR', 'MASTER ADMIN', 'MASTER_ADMIN', 'SUPERADMIN', 'ZARZAD', 'ZARZĄD', 'BOARD'].includes(role);
  }, [user]);

  // Pobranie aktualnej macierzy uprawnień z serwera
  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/permissions');
      const data = await res.json();
      if (data.success && data.matrix) {
        setMatrix(data.matrix);
      }
    } catch (err) {
      console.error('Błąd pobierania uprawnień:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Przełączenie pojedynczego uprawnienia (KLIKALNE CHEKBOXY)
  const handleTogglePermission = (actionKey: string, roleId: string) => {
    if (!isManagement) {
      showToast('Tylko Administrator lub Zarząd może modyfikować macierz uprawnień.', 'error');
      return;
    }

    setMatrix((prev) => {
      const currentActionObj = prev[actionKey] || {};
      const currentValue = !!currentActionObj[roleId];
      return {
        ...prev,
        [actionKey]: {
          ...currentActionObj,
          [roleId]: !currentValue,
        },
      };
    });
  };

  // Zapisanie zmodyfikowanej macierzy w bazie / pliku konfiguracyjnym
  const handleSaveMatrix = async () => {
    if (!isManagement) {
      showToast('Brak uprawnień do zapisu zmian.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'OPERATOR',
        },
        body: JSON.stringify({ matrix }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✅ Pomyślnie zapisano nową macierz uprawnień ról w systemie!', 'success');
      } else {
        showToast(data.error || 'Błąd zapisu uprawnień', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Błąd podczas zapisu danych', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Przywrócenie domyślnych ustawień fabrycznych
  const handleResetDefault = () => {
    if (!isManagement) return;

    showConfirm({
      title: 'Przywrócenie Ustawień Fabrycznych',
      message: 'Czy na pewno chcesz przywrócić domyślną macierz uprawnień dla wszystkich ról w systemie?',
      confirmText: 'Przywróć Domyślne',
      isDanger: true,
      onConfirm: async () => {
        setSaving(true);
        try {
          const res = await fetch('/api/permissions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-role': user?.role || 'OPERATOR',
            },
            body: JSON.stringify({ resetToDefault: true }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            setMatrix(data.matrix);
            showToast('🔄 Przywrócono fabryczną macierz uprawnień!', 'success');
          }
        } catch (err: any) {
          showToast(err.message || 'Błąd podczas resetowania', 'error');
        } finally {
          setSaving(false);
        }
      },
    });
  };

  // Unikalne kategorie
  const categories = useMemo(() => {
    const set = new Set<string>();
    PERMISSION_ACTIONS.forEach((a) => set.add(a.category));
    return Array.from(set);
  }, []);

  // Filtrowanie akcji
  const filteredActions = useMemo(() => {
    return PERMISSION_ACTIONS.filter((act) => {
      if (selectedCategoryFilter !== 'ALL' && act.category !== selectedCategoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLabel = act.label.toLowerCase().includes(q);
        const matchesCategory = act.category.toLowerCase().includes(q);
        const matchesDesc = act.description.toLowerCase().includes(q);
        const matchesKey = act.key.toLowerCase().includes(q);
        if (!matchesLabel && !matchesCategory && !matchesDesc && !matchesKey) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCategoryFilter, searchQuery]);

  if (!user || !canSeePermissions) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 space-y-8 text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Górny Nagłówek */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                <span>⚡ Interaktywny Panel Konfiguracji RBAC</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
                Zarządzanie Uprawnieniami i Dostępami Ról
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1 max-w-3xl">
                Wszystkie opcje i przyciski w systemie są **w pełni klikalne**. Zaznaczaj lub odznaczaj uprawnienia dla poszczególnych ról i zapisuj zmiany w bazy danych.
              </p>
            </div>

            {/* Przyciski Akcji Zapisu */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {isManagement && (
                <button
                  onClick={handleResetDefault}
                  disabled={saving || loading}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 border border-slate-300 dark:border-slate-700"
                  title="Przywraca fabryczne domyślne uprawnienia ról"
                >
                  <span>🔄</span> Przywróć Domyślne
                </button>
              )}

              <button
                onClick={handleSaveMatrix}
                disabled={saving || loading || !isManagement}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl text-xs transition-all shadow-lg hover:shadow-brand-500/30 cursor-pointer disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                <span>💾</span> {saving ? 'Zapisywanie...' : 'ZAPISZ ZMIANY UPRAWNIEŃ'}
              </button>
            </div>
          </div>

          {/* Informacja dla Użytkownika */}
          {!isManagement && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-semibold flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <strong>Tryb Podglądu Uprawnień:</strong> Jesteś zalogowany jako <span className="font-black text-amber-700 uppercase">{user?.role}</span>. Modyfikacja i zapisywanie macierzy jest zastrzeżone dla ról <strong>Master Admin</strong> oraz <strong>Zarząd</strong>.
              </div>
            </div>
          )}

          {/* Szybki Wybór Roli */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              Wybierz Rolę do Podglądu lub Filtrowania Kolumn:
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedRoleFilter('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedRoleFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                🌐 Wszystkie Role (Tabela Macierzowa)
              </button>
              {ALL_ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleFilter(r.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedRoleFilter === r.id
                      ? `${r.badgeBg} shadow-md ring-2 ring-brand-500`
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pasek Wyszukiwania i Filtry Kategorialne */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg">🔍</span>
            <input
              type="text"
              placeholder="Wpisz nazwę przycisku lub funkcji (np. 'anuluj wniosek', 'synonim', 'wypłaty Kaizen')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold bg-transparent outline-none text-slate-900 dark:text-slate-100"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2">
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500">Kategoria:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
            >
              <option value="ALL">Wszystkie Moduły ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Główna Klikalna Tabela Macierzy Uprawnień */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 font-bold text-sm animate-pulse">
              Ładowanie klikalnej macierzy uprawnień...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 w-1/3 min-w-[280px]">
                      Funkcja / Przycisk w Systemie
                    </th>
                    {ALL_ROLES.map((role) => {
                      if (selectedRoleFilter !== 'ALL' && selectedRoleFilter !== role.id) {
                        return null;
                      }
                      return (
                        <th
                          key={role.id}
                          className="p-3 text-center text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 border-l border-slate-200/60 dark:border-slate-700/60 min-w-[110px]"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span>{role.name}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {filteredActions.map((act) => {
                    return (
                      <tr
                        key={act.key}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Opis funkcji */}
                        <td className="p-4 space-y-1">
                          <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
                            <span className="text-lg">{act.emoji}</span>
                            <span>{act.label}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-normal leading-relaxed">
                            {act.description}
                          </div>
                          <div className="inline-block text-[10px] font-mono font-bold text-slate-400">
                            [{act.key}]
                          </div>
                        </td>

                        {/* Przełączniki dla poszczególnych ról */}
                        {ALL_ROLES.map((role) => {
                          if (selectedRoleFilter !== 'ALL' && selectedRoleFilter !== role.id) {
                            return null;
                          }

                          const isEnabled = !!(matrix[act.key] && matrix[act.key][role.id]);

                          return (
                            <td
                              key={role.id}
                              className="p-3 text-center border-l border-slate-200/40 dark:border-slate-800/60 align-middle"
                            >
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(act.key, role.id)}
                                disabled={!isManagement}
                                className={`w-full py-2.5 px-2 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  isEnabled
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 border border-slate-200 dark:border-slate-700'
                                } ${!isManagement ? 'opacity-75 cursor-not-allowed' : ''}`}
                                title={`${isEnabled ? 'Kliknij, aby wyłączyć' : 'Kliknij, aby włączyć'} uprawnienie dla roli ${role.name}`}
                              >
                                <span>{isEnabled ? '✅' : '❌'}</span>
                                <span>{isEnabled ? 'WŁĄCZONE' : 'BRAK'}</span>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dolny Pasek Zapisywania */}
        {isManagement && (
          <div className="sticky bottom-6 bg-slate-900/90 backdrop-blur-md text-white p-5 rounded-3xl shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="text-sm font-black">Panel Zapisywania Uprawnień RBAC</h4>
                <p className="text-xs text-slate-400">Kliknięte uprawnienia zostaną trwale zapamiętane dla wszystkich użytkowników danej roli.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveMatrix}
                disabled={saving}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-2xl text-xs transition-all shadow-lg hover:shadow-emerald-500/30 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <span>💾</span> {saving ? 'Zapisywanie w bazie...' : 'ZAPISZ MACIERZ UPRAWNIEŃ'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
