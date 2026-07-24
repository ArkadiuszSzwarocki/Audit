'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { getRemainingBusinessDays } from '@/utils/bhpDateUtils';

interface User {
  id: string;
  login: string;
  name: string;
  email?: string | null;
  role: string;
  bhpTrainingDueDate?: string | null;
  responsibleAreaId?: string | null;
  responsibleArea?: { id: string; name: string } | null;
  notifyBhp?: boolean;
  notifyQuality?: boolean;
  notifyFaults?: boolean;
  notifyKaizen?: boolean;
  notifyAudits?: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast, showConfirm } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Form state (Add User)
  const [isAdding, setIsAdding] = useState(false);
  const [login, setLogin] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('OPERATOR');
  const [bhpTrainingDueDate, setBhpTrainingDueDate] = useState('');
  const [responsibleAreaId, setResponsibleAreaId] = useState('');
  const [notifyBhp, setNotifyBhp] = useState(false);
  const [notifyQuality, setNotifyQuality] = useState(false);
  const [notifyFaults, setNotifyFaults] = useState(false);
  const [notifyKaizen, setNotifyKaizen] = useState(false);
  const [notifyAudits, setNotifyAudits] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editBhpDate, setEditBhpDate] = useState('');
  const [editResponsibleAreaId, setEditResponsibleAreaId] = useState('');
  const [editNotifyBhp, setEditNotifyBhp] = useState(false);
  const [editNotifyQuality, setEditNotifyQuality] = useState(false);
  const [editNotifyFaults, setEditNotifyFaults] = useState(false);
  const [editNotifyKaizen, setEditNotifyKaizen] = useState(false);
  const [editNotifyAudits, setEditNotifyAudits] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [showEditPasswordInput, setShowEditPasswordInput] = useState(false);

  // Password Reset Modal State
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    } else if (isAdmin) {
      fetchUsers();
      fetchRoles();
      fetchAreas();
    }
  }, [isAdmin, authLoading, router]);

  const fetchAreas = async () => {
    try {
      const res = await fetch('/api/areas');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAreas(data);
      }
    } catch (e) {
      console.error('Błąd pobierania rejonów:', e);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      if (res.ok) {
        const data = await res.json();
        setAvailableRoles(data);
      }
    } catch (e) {
      console.error('Błąd pobierania ról:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Nie udało się pobrać listy użytkowników');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      showToast('Błąd wczytywania użytkowników', 'error');
    } finally {
      setLoading(false);
    }
  };

  const DEFAULT_EMAIL_DOMAIN = '@allspice.pl';

  const formatEmailWithDomain = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return '';
    if (trimmed.includes('@')) return trimmed;
    return `${trimmed}${DEFAULT_EMAIL_DOMAIN}`;
  };

  const handleNameChange = (val: string) => {
    setName(val);
    const normalized = val
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l')
      .replace(/ń/g, 'n')
      .replace(/ć/g, 'c')
      .replace(/ś/g, 's')
      .replace(/ż|ź/g, 'z')
      .replace(/ą/g, 'a')
      .replace(/ę/g, 'e')
      .replace(/ó/g, 'o');
    const parts = normalized.split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      const suggestedUser = `${parts[0]}.${parts[parts.length - 1]}`;
      setLogin(prev => (!prev || prev.includes('.') ? suggestedUser : prev));
      setEmail(prev => (!prev || prev.endsWith(DEFAULT_EMAIL_DOMAIN) ? `${suggestedUser}${DEFAULT_EMAIL_DOMAIN}` : prev));
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalEmail = formatEmailWithDomain(email);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: login.trim(),
          name: name.trim(),
          email: finalEmail || null,
          password,
          role,
          bhpTrainingDueDate: bhpTrainingDueDate || null,
          responsibleAreaId: responsibleAreaId || null,
          notifyBhp,
          notifyQuality,
          notifyFaults,
          notifyKaizen,
          notifyAudits,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`👤 Użytkownik ${name.trim()} został pomyślnie dodany!`, 'success');
      setIsAdding(false);
      setLogin('');
      setName('');
      setEmail('');
      setPassword('');
      setRole('OPERATOR');
      setBhpTrainingDueDate('');
      setResponsibleAreaId('');
      setNotifyBhp(false);
      setNotifyQuality(false);
      setNotifyFaults(false);
      setNotifyKaizen(false);
      setNotifyAudits(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email || '');
    setEditRole(u.role);
    setEditBhpDate(u.bhpTrainingDueDate ? u.bhpTrainingDueDate.split('T')[0] : '');
    setEditResponsibleAreaId(u.responsibleAreaId || '');
    setEditNotifyBhp(Boolean(u.notifyBhp));
    setEditNotifyQuality(Boolean(u.notifyQuality));
    setEditNotifyFaults(Boolean(u.notifyFaults));
    setEditNotifyKaizen(Boolean(u.notifyKaizen));
    setEditNotifyAudits(Boolean(u.notifyAudits));
    setEditPassword('');
    setShowEditPasswordInput(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: editName.trim(),
        email: formatEmailWithDomain(editEmail) || null,
        role: editRole,
        bhpTrainingDueDate: editBhpDate ? editBhpDate : null,
        responsibleAreaId: editResponsibleAreaId || null,
        notifyBhp: editNotifyBhp,
        notifyQuality: editNotifyQuality,
        notifyFaults: editNotifyFaults,
        notifyKaizen: editNotifyKaizen,
        notifyAudits: editNotifyAudits,
      };

      if (showEditPasswordInput && editPassword.trim()) {
        payload.newPassword = editPassword.trim();
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się zaktualizować użytkownika');

      showToast(`Dane użytkownika ${editName.trim()} zostały zaktualizowane!`, 'success');
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenResetPassword = (u: User) => {
    setResetModalUser(u);
    setNewPasswordValue('');
    setShowNewPassword(false);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordValue(pass);
    setShowNewPassword(true);
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    if (!newPasswordValue.trim()) {
      showToast('Wpisz nowe hasło lub wygeneruj je losowo', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${resetModalUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: newPasswordValue.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się zresetować hasła');

      showToast(`🔑 Hasło dla użytkownika ${resetModalUser.name} (${resetModalUser.login}) zostało zmienione!`, 'success');
      setResetModalUser(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, userName: string, userRole: string) => {
    const isZarzadRole = userRole.toUpperCase() === 'ZARZAD' || userRole.toUpperCase() === 'ZARZĄD';
    if (isZarzadRole && user?.role !== 'ZARZAD' && user?.role !== 'Zarząd') {
      showToast('Niedozwolona operacja! Rola Zarząd posiada nadrzędną władzę – Administrator nie może jej usuwać.', 'error');
      return;
    }

    showConfirm({
      title: 'Usuwanie Użytkownika',
      message: `Czy na pewno chcesz usunąć konto użytkownika ${userName}?`,
      confirmText: 'Usuń użytkownika',
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Nie udało się usunąć użytkownika');
        showToast('Użytkownik został usunięty z systemu', 'success');
        fetchUsers();
      },
    });
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.login.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q);

      const matchesRole =
        selectedRoleFilter === 'ALL' ||
        u.role.toUpperCase() === selectedRoleFilter.toUpperCase();

      return matchesQuery && matchesRole;
    });
  }, [users, searchQuery, selectedRoleFilter]);

  const renderRoleBadge = (roleName: string) => {
    const r = roleName.toUpperCase();
    if (r === 'ZARZAD' || r === 'ZARZĄD' || r === 'BOARD') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-xs rounded-full shadow-sm">
          👑 Zarząd
        </span>
      );
    }
    if (r === 'ADMIN' || r === 'ADMINISTRATOR') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 font-extrabold text-xs rounded-full shadow-sm">
          ⚡ ADMIN
        </span>
      );
    }
    if (r === 'KONTROLA_JAKOSCI' || r === 'KONTROLA JAKOŚCI' || r === 'AUDYTOR' || r === 'AUDITOR') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-extrabold text-xs rounded-full shadow-sm">
          🛡️ Kontrola Jakości
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-full">
        🛠️ {roleName}
      </span>
    );
  };

  const renderBhpBadge = (dueDate?: string | null) => {
    if (!dueDate) {
      return <span className="text-slate-400 text-xs italic">Brak terminu</span>;
    }

    const remainingDays = getRemainingBusinessDays(dueDate);
    if (remainingDays <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 font-bold text-xs rounded-lg animate-pulse">
          ⚠️ Minął termin ({remainingDays} dni)
        </span>
      );
    }
    if (remainingDays <= 14) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-lg">
          ⏳ Pozostało: {remainingDays} dni
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium text-xs rounded-lg">
        ✅ Ważne ({remainingDays} dni)
      </span>
    );
  };

  if (authLoading || loading) {
    return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Ładowanie bazy użytkowników...</div>;
  }
  if (!isAdmin) return null;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Full-width Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👥</span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Zarządzanie Użytkownikami
            </h1>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">
            Pełny panel zarządzania pracownikami w zakładzie. Dodawaj nowe konta, wyszukuj użytkowników oraz resetuj hasła dostępu.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl text-sm font-bold transition-all shadow-lg hover:shadow-brand-600/30 flex items-center gap-2 self-start md:self-auto cursor-pointer touch-manipulation min-h-[44px]"
        >
          {isAdding ? (
            <>
              <span>✕</span>
              <span>Zamknij Formularz</span>
            </>
          ) : (
            <>
              <span>➕</span>
              <span>Dodaj Nowego Użytkownika</span>
            </>
          )}
        </button>
      </div>

      {/* Add User Panel (Collapsible) */}
      {isAdding && (
        <div className="bg-white dark:bg-slate-900 border-2 border-brand-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>👤</span> Nowe Konto Użytkownika
            </h2>
            <span className="text-xs font-semibold text-slate-400">Pola oznaczone gwiazdką (*) są wymagane</span>
          </div>

          <form onSubmit={handleAddUser} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Imię i Nazwisko *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="np. Jan Kowalski"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Login do Systemu *
                </label>
                <input
                  type="text"
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="np. jan.kowalski"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Adres E-mail
                  </label>
                  {email && !email.includes('@') && (
                    <button
                      type="button"
                      onClick={() => setEmail(formatEmailWithDomain(email))}
                      className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold"
                    >
                      + @allspice.pl
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={e => setEmail(formatEmailWithDomain(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="jan.kowalski@allspice.pl"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  💡 Domena <span className="font-bold text-brand-600 dark:text-brand-400">@allspice.pl</span> dodaje się automatycznie!
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Hasło *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Rola w Systemie
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                >
                  <option value="OPERATOR">🛠️ Operator Produkcji (Domyślny)</option>
                  <option value="ADMIN">⚡ Administrator (Zarządzanie)</option>
                  <option value="ZARZAD">👑 Zarząd (Nadrzędna Dyrekcja)</option>
                  {availableRoles
                    .filter(r => r.name !== 'Administrator' && r.name !== 'Operator Produkcji' && r.name !== 'Zarząd' && r.name !== 'ZARZAD')
                    .map(r => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span>🦺</span> Data Ważności Szkolenia BHP
                </label>
                <input
                  type="date"
                  value={bhpTrainingDueDate}
                  onChange={e => setBhpTrainingDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Responsible Area Assignment */}
              <div className="col-span-full pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span>📍</span> Odpowiedzialny za Rejon Zakładu
                </label>
                <select
                  value={responsibleAreaId}
                  onChange={e => setResponsibleAreaId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-300 dark:border-brand-700 bg-brand-50/30 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                >
                  <option value="">-- Brak przypisania do konkretnego rejonu (Ogólny) --</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>
                      📍 {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notification Subscriptions Checkboxes */}
              <div className="col-span-full space-y-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  🔔 Jakie powiadomienia e-mail i zgłoszenia ma otrzymywać ten użytkownik?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyBhp}
                      onChange={e => setNotifyBhp(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>🛡️ Zagrożenia BHP</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyQuality}
                      onChange={e => setNotifyQuality(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>📦 Zgłoszenia Jakościowe</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyFaults}
                      onChange={e => setNotifyFaults(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>🔧 Usterki i Awarie</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyKaizen}
                      onChange={e => setNotifyKaizen(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>💡 Pomysły Kaizen</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyAudits}
                      onChange={e => setNotifyAudits(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>📋 Audyty</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer min-h-[44px]"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg disabled:opacity-50 cursor-pointer transition-all min-h-[44px]"
              >
                {isSubmitting ? 'Utworzenie konta...' : '➕ Utwórz Konto Użytkownika'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Szukaj po imieniu, nazwisku, loginie, e-mailu lub roli..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm p-1 rounded-md"
            >
              ✕
            </button>
          )}
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[170px]">
            <select
              value={selectedRoleFilter}
              onChange={e => setSelectedRoleFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
            >
              <option value="ALL">Wszystkie Role</option>
              <option value="OPERATOR">🛠️ Operator</option>
              <option value="ADMIN">⚡ Admin</option>
              <option value="ZARZAD">👑 Zarząd</option>
              <option value="KONTROLA_JAKOSCI">🛡️ Kontrola Jakości</option>
            </select>
          </div>

          <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-extrabold text-slate-600 dark:text-slate-300 whitespace-nowrap">
            Razem: <span className="text-brand-600 dark:text-brand-400">{filteredUsers.length}</span> / {users.length}
          </div>
        </div>
      </div>

      {/* Full-width Users Table */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider font-extrabold">
                <th className="py-4 px-6">Pracownik</th>
                <th className="py-4 px-4">Login</th>
                <th className="py-4 px-4">E-mail</th>
                <th className="py-4 px-4">Rola</th>
                <th className="py-4 px-4">Rejon & Powiadomienia</th>
                <th className="py-4 px-4">Ważność Szkolenia BHP</th>
                <th className="py-4 px-4">Data Utworzenia</th>
                <th className="py-4 px-6 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm font-medium">
                    {searchQuery || selectedRoleFilter !== 'ALL'
                      ? 'Nie znaleziono użytkowników spełniających podane kryteria.'
                      : 'Brak zarejestrowanych użytkowników w bazie.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold flex items-center justify-center text-sm border border-brand-500/20">
                          {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {u.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Login */}
                    <td className="py-4 px-4">
                      <code className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-mono font-bold">
                        {u.login}
                      </code>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-4 text-xs font-medium">
                      {u.email ? (
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{u.email}</span>
                      ) : (
                        <span className="text-slate-400 italic">brak</span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">{renderRoleBadge(u.role)}</td>

                    {/* Rejon & Module Subscriptions */}
                    <td className="py-4 px-4 text-xs space-y-1">
                      {u.responsibleArea ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-lg font-extrabold text-[11px]">
                          📍 {u.responsibleArea.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px] block">Wszystkie rejony</span>
                      )}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {u.notifyBhp && <span className="px-1.5 py-0.2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-bold rounded">🛡️ BHP</span>}
                        {u.notifyQuality && <span className="px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded">📦 Jakość</span>}
                        {u.notifyFaults && <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded">🔧 Awarie</span>}
                        {u.notifyKaizen && <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded">💡 Kaizen</span>}
                        {u.notifyAudits && <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded">📋 Audyty</span>}
                      </div>
                    </td>

                    {/* BHP Status */}
                    <td className="py-4 px-4">{renderBhpBadge(u.bhpTrainingDueDate)}</td>

                    {/* Created Date */}
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pl-PL') : '-'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Reset Password Button */}
                        <button
                          onClick={() => handleOpenResetPassword(u)}
                          className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer min-h-[38px] touch-manipulation"
                          title="Resetuj hasło użytkownika"
                        >
                          <span>🔑</span>
                          <span className="hidden sm:inline">Reset Hasła</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer min-h-[38px] touch-manipulation"
                          title="Edytuj dane użytkownika"
                        >
                          <span>✏️</span>
                          <span className="hidden sm:inline">Edytuj</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(u.id, u.name, u.role)}
                          className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer min-h-[38px] touch-manipulation"
                          title="Usuń konto użytkownika"
                        >
                          <span>🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🔑</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Reset Hasła Użytkownika
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Zmień hasło dla: <strong className="text-slate-800 dark:text-slate-200">{resetModalUser.name}</strong> ({resetModalUser.login})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetModalUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Nowe Hasło dla {resetModalUser.login} *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPasswordValue}
                    onChange={e => setNewPasswordValue(e.target.value)}
                    placeholder="Wpisz nowe hasło..."
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold p-1"
                  >
                    {showNewPassword ? '👁️ Ukryj' : '👁️ Pokaż'}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={generateRandomPassword}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                <span>🎲</span> Wygeneruj Bezpieczne Losowe Hasło
              </button>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newPasswordValue.trim()}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-extrabold text-xs shadow-lg disabled:opacity-50 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Zapisywanie...' : '🔑 Zapisz Nowe Hasło'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>✏️</span> Edycja Użytkownika ({editingUser.login})
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Login Użytkownika (Stały)
                </label>
                <input
                  type="text"
                  value={editingUser.login}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Imię i Nazwisko
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Adres E-mail
                  </label>
                  {editEmail && !editEmail.includes('@') && (
                    <button
                      type="button"
                      onClick={() => setEditEmail(formatEmailWithDomain(editEmail))}
                      className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold"
                    >
                      + @allspice.pl
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  onBlur={e => setEditEmail(formatEmailWithDomain(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="jan.kowalski@allspice.pl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Rola w Systemie
                </label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer text-sm"
                >
                  <option value="OPERATOR">🛠️ Operator Produkcji (Domyślny)</option>
                  <option value="ADMIN">⚡ Administrator (Zarządzanie)</option>
                  <option value="ZARZAD">👑 Zarząd (Nadrzędna Dyrekcja)</option>
                  {availableRoles
                    .filter(r => r.name !== 'Administrator' && r.name !== 'Operator Produkcji' && r.name !== 'Zarząd' && r.name !== 'ZARZAD')
                    .map(r => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span>🦺</span> Data Ważności Szkolenia BHP
                </label>
                <input
                  type="date"
                  value={editBhpDate}
                  onChange={e => setEditBhpDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-50/50 dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                />
              </div>

              {/* Responsible Area Assignment */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span>📍</span> Odpowiedzialny za Rejon Zakładu
                </label>
                <select
                  value={editResponsibleAreaId}
                  onChange={e => setEditResponsibleAreaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-brand-50/30 dark:bg-slate-800 border border-brand-300 dark:border-brand-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer text-sm"
                >
                  <option value="">-- Brak przypisania do konkretnego rejonu (Ogólny) --</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>
                      📍 {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notification Subscriptions Checkboxes */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  🔔 Jakie powiadomienia e-mail i zgłoszenia ma otrzymywać ten użytkownik?
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editNotifyBhp}
                      onChange={e => setEditNotifyBhp(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>🛡️ Zagrożenia BHP</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editNotifyQuality}
                      onChange={e => setEditNotifyQuality(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>📦 Zgłoszenia Jakościowe</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editNotifyFaults}
                      onChange={e => setEditNotifyFaults(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>🔧 Usterki i Awarie</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editNotifyKaizen}
                      onChange={e => setEditNotifyKaizen(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>💡 Pomysły Kaizen</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editNotifyAudits}
                      onChange={e => setEditNotifyAudits(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>📋 Audyty</span>
                  </label>
                </div>
              </div>

              {/* Password Option in Edit Modal */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                {!showEditPasswordInput ? (
                  <button
                    type="button"
                    onClick={() => setShowEditPasswordInput(true)}
                    className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
                  >
                    🔑 Chcesz zmienić hasło temu użytkownikowi?
                  </button>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Nowe Hasło Użytkownika
                    </label>
                    <input
                      type="password"
                      value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                      placeholder="Wpisz nowe hasło..."
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Zapisywanie...' : 'Zapisz Zmiany'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
