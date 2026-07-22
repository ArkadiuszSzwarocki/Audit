'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

import { useToast } from '@/context/ToastContext';

interface User {
  id: string;
  login: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [login, setLogin] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('OPERATOR');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [availableRoles, setAvailableRoles] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    } else if (isAdmin) {
      fetchUsers();
      fetchRoles();
    }
  }, [isAdmin, authLoading, router]);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      if (res.ok) {
        const data = await res.json();
        setAvailableRoles(data);
      }
    } catch (e) {
      console.error(e);
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, name, password, role })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      showToast('Użytkownik dodany pomyślnie!', 'success');
      setIsAdding(false);
      setLogin('');
      setName('');
      setPassword('');
      setRole('OPERATOR');
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
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
      message: `Czy na pewno chcesz usunąć użytkownika ${userName}?`,
      confirmText: 'Usuń użytkownika',
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Nie udało się usunąć użytkownika');
        showToast('Użytkownik został usunięty', 'success');
        fetchUsers();
      }
    });
  };

  if (authLoading || loading) return <div className="p-8 text-center animate-pulse">Ładowanie...</div>;
  if (!isAdmin) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Zarządzanie Użytkownikami
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Dodawaj, edytuj i usuwaj pracowników posiadających dostęp do systemu.
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          {isAdding ? 'Anuluj dodawanie' : '+ Dodaj Użytkownika'}
        </button>
      </div>

      {isAdding && (
        <div className="glass-card p-6 border-2 border-brand-500/20">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Nowy Użytkownik</h2>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Imię i Nazwisko
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="np. Jan Kowalski"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Login
                </label>
                <input 
                  type="text" 
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="np. jkowalski"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hasło
                </label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rola
                </label>
                <select 
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="OPERATOR">Operator Produkcji (Domyślny)</option>
                  <option value="ADMIN">Administrator (Zarządzanie)</option>
                  <option value="ZARZAD">👑 Zarząd (Nadrzędna Dyrekcja)</option>
                  {availableRoles.filter(r => r.name !== 'Administrator' && r.name !== 'Operator Produkcji' && r.name !== 'Zarząd' && r.name !== 'ZARZAD').map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {formError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                {formError}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz Użytkownika'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Pracownik</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Login</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Rola</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Dodano</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {users.map(u => {
              const isZarzadRole = u.role.toUpperCase() === 'ZARZAD' || u.role.toUpperCase() === 'ZARZĄD';
              return (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-slate-100">
                    {u.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {u.login}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold shadow-xs ${
                      isZarzadRole
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        : u.role === 'ADMIN'
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    }`}>
                      {isZarzadRole ? '👑 Zarząd (Nadrzędna)' : u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <button 
                      onClick={() => handleDelete(u.id, u.name, u.role)}
                      className={`font-medium px-2 py-1 rounded transition-colors ${
                        isZarzadRole && user?.role !== 'ZARZAD' && user?.role !== 'Zarząd'
                          ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                          : 'text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                      title={
                        isZarzadRole && user?.role !== 'ZARZAD' && user?.role !== 'Zarząd'
                          ? 'Rola Zarząd jest chroniona przed usunięciem przez Administratora'
                          : 'Usuń użytkownika'
                      }
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  Brak użytkowników w bazie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
