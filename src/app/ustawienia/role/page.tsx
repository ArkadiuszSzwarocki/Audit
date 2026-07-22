'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  canCreateAudit: boolean;
  canCompleteAudit: boolean;
  canDeleteAudit: boolean;
  canManageStructure: boolean;
  canManageUsers: boolean;
  canManageTypes: boolean;
  canManageKaizen: boolean;
  _count?: { users: number };
}

export default function RolesManagementPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast, showConfirm } = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    canCreateAudit: false,
    canCompleteAudit: false,
    canDeleteAudit: false,
    canManageStructure: false,
    canManageUsers: false,
    canManageTypes: false,
    canManageKaizen: false,
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    } else if (isAdmin) {
      fetchRoles();
    }
  }, [isAdmin, authLoading, router]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roles');
      if (!res.ok) throw new Error('Nie udało się pobrać listy ról');
      const data = await res.json();
      setRoles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingRoleId(null);
    setFormData({
      name: '',
      description: '',
      canCreateAudit: false,
      canCompleteAudit: false,
      canDeleteAudit: false,
      canManageStructure: false,
      canManageUsers: false,
      canManageTypes: false,
      canManageKaizen: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setEditingRoleId(role.id);
    setFormData({
      name: role.name,
      description: role.description || '',
      canCreateAudit: role.canCreateAudit,
      canCompleteAudit: role.canCompleteAudit,
      canDeleteAudit: role.canDeleteAudit,
      canManageStructure: role.canManageStructure,
      canManageUsers: role.canManageUsers,
      canManageTypes: role.canManageTypes,
      canManageKaizen: role.canManageKaizen,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const url = editingRoleId ? `/api/roles/${editingRoleId}` : '/api/roles';
      const method = editingRoleId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Błąd zapisu roli');

      showToast(editingRoleId ? 'Rola zaktualizowana' : 'Nowa rola została utworzona', 'success');
      setIsModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteRole = (id: string, name: string) => {
    showConfirm({
      title: 'Usuwanie Roli',
      message: `Czy na pewno chcesz usunąć rolę "${name}"?`,
      confirmText: 'Usuń rolę',
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Błąd usuwania');
        showToast('Rola usunięta', 'success');
        fetchRoles();
      }
    });
  };

  const permissionLabels = [
    { key: 'canCreateAudit', label: 'Tworzenie i otwieranie audytów', desc: 'Możliwość uruchamiania nowego audytu w systemie' },
    { key: 'canCompleteAudit', label: 'Zamykanie i zatwierdzanie audytów', desc: 'Możliwość oznaczania audytu jako skończony' },
    { key: 'canDeleteAudit', label: 'Usuwanie audytów i zgłoszeń', desc: 'Usuwanie bezpowrotnie audytów lub pojedynczych usterek' },
    { key: 'canManageStructure', label: 'Struktura zakładu (Rejony i Maszyny)', desc: 'Dodawanie i edycja rejonów oraz maszyn' },
    { key: 'canManageTypes', label: 'Typy Audytów (HACCP, GMP+, itp.)', desc: 'Definiowanie kategorii i typów audytów' },
    { key: 'canManageUsers', label: 'Zarządzanie użytkownikami', desc: 'Tworzenie kont i przypisywanie im ról' },
    { key: 'canManageKaizen', label: 'Zarządzanie wnioskami Kaizen', desc: 'Akceptowanie, odrzucanie i zmiana statusów pomysłów' },
  ];

  if (authLoading || loading) return <div className="p-8 text-center animate-pulse">Ładowanie ról...</div>;
  if (!isAdmin) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Zarządzanie Rolami i Uprawnieniami (RBAC)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Definiuj własne role oraz precyzyjne zgody na dostęp do poszczególnych funkcji systemu.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md font-bold transition-all text-sm flex items-center gap-2 whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Dodaj Nową Rolę
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {roles.map((role) => (
          <div key={role.id} className="glass-card p-6 border-l-4 border-brand-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{role.name}</h3>
                  {role.isSystem && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      Rola Systemowa
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium">
                    (Użytkowników: {role._count?.users || 0})
                  </span>
                </div>
                {role.description && (
                  <p className="text-sm text-slate-500 mt-1">{role.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(role)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
                >
                  Edytuj uprawnienia
                </button>
                {!role.isSystem && (
                  <button
                    onClick={() => handleDeleteRole(role.id, role.name)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    title="Usuń rolę"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Uprawnienia i funkcje:</h4>
              <div className="flex flex-wrap gap-2">
                {role.canCreateAudit && <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold">✓ Tworzenie audytów</span>}
                {role.canCompleteAudit && <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold">✓ Zamykanie audytów</span>}
                {role.canDeleteAudit && <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold">✓ Usuwanie audytów</span>}
                {role.canManageStructure && <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold">✓ Struktura zakładu</span>}
                {role.canManageTypes && <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold">✓ Typy audytów</span>}
                {role.canManageUsers && <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-semibold">✓ Użytkownicy</span>}
                {role.canManageKaizen && <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold">✓ Decyzje Kaizen</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Dodawania / Edycji Roli */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingRoleId ? 'Edycja Roli' : 'Nowa Rola w Systemie'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nazwa roli</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="np. Główny Audytor Jakości"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Opis (opcjonalnie)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Opisz krótko zakres odpowiedzialności tej roli..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Uprawnienia dla roli:</h3>
                
                <div className="grid gap-3">
                  {permissionLabels.map((perm) => (
                    <label key={perm.key} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={(formData as any)[perm.key]}
                        onChange={(e) => setFormData({ ...formData, [perm.key]: e.target.checked })}
                        className="mt-1 w-5 h-5 text-brand-600 rounded focus:ring-brand-500 border-slate-300"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{perm.label}</p>
                        <p className="text-xs text-slate-500">{perm.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md text-sm"
                >
                  Zapisz Rolę
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
