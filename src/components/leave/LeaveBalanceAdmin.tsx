'use client';

import React, { useState, useEffect } from 'react';
import { useLeaveBalance } from '@/hooks/useLeaveBalance';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { EmployeeBalanceCard } from './EmployeeBalanceCard';

export function LeaveBalanceAdmin() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    loading,
    error,
    fetchAllBalances,
    adjustBalance,
    setTotalDays
  } = useLeaveBalance();

  const [balances, setBalances] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [searchText, setSearchText] = useState('');

  // Pobierz wszystkie salda
  useEffect(() => {
    loadBalances();
  }, [selectedYear]);

  const loadBalances = async () => {
    const result = await fetchAllBalances(selectedYear);
    if (result.success) {
      setBalances(result.data.data || []);
    } else {
      showToast(`Błąd: ${result.error}`, 'error');
    }
  };

  // Filtrowanie
  const filteredBalances = balances.filter((balance) => {
    if (filterRole !== 'ALL' && balance.user.role !== filterRole) return false;
    if (filterDepartment !== 'ALL' && balance.user.department?.name !== filterDepartment) return false;
    if (searchText && !balance.user.name.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  // Pobierz unikalne role i departamenty
  const roles = ['ALL', ...new Set(balances.map((b) => b.user.role))];
  const departments = ['ALL', ...new Set(balances.map((b) => b.user.department?.name).filter(Boolean))];

  // Statystyki
  const stats = {
    total: filteredBalances.length,
    totalPoolDays: filteredBalances.reduce((sum, b) => sum + b.totalDays, 0),
    totalUsedDays: filteredBalances.reduce((sum, b) => sum + b.usedDays, 0),
    totalAvailableDays: filteredBalances.reduce((sum, b) => sum + (b.totalDays - b.usedDays), 0)
  };

  const handleAdjustBalance = async (balance: any, adjustment: number) => {
    const result = await adjustBalance(balance.userId, adjustment, selectedYear);
    if (result.success) {
      showToast(`Zmiana salda: ${adjustment > 0 ? '+' : ''}${adjustment} dni`, 'success');
      await loadBalances();
    } else {
      showToast(`Błąd: ${result.error}`, 'error');
    }
  };

  const handleSetTotal = async (balance: any, newTotal: number) => {
    const result = await setTotalDays(balance.userId, newTotal, 'Zmiana manualna przez admina', selectedYear);
    if (result.success) {
      showToast(`Pula zmieniona na ${newTotal} dni`, 'success');
      await loadBalances();
    } else {
      showToast(`Błąd: ${result.error}`, 'error');
    }
  };

  if (!user || !['ADMIN', 'HR'].includes(user.role)) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Brak dostępu. Tylko administracyjne może zarządzać pulami urlopów.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Zarządzanie Pulą Urlopów</h1>
        <p className="text-gray-600">Zarządzaj saldem urlopów pracowników, koryguj pule i przeglądaj dostępne dni</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium mb-1">Liczba pracowników</p>
          <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <p className="text-sm text-purple-600 font-medium mb-1">Całkowita pula</p>
          <p className="text-3xl font-bold text-purple-900">{stats.totalPoolDays}</p>
          <p className="text-xs text-purple-600 mt-1">dni</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <p className="text-sm text-red-600 font-medium mb-1">Użyte dni</p>
          <p className="text-3xl font-bold text-red-900">{stats.totalUsedDays.toFixed(1)}</p>
          <p className="text-xs text-red-600 mt-1">({((stats.totalUsedDays / stats.totalPoolDays) * 100).toFixed(1)}%)</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <p className="text-sm text-green-600 font-medium mb-1">Dostępne dni</p>
          <p className="text-3xl font-bold text-green-900">{stats.totalAvailableDays.toFixed(1)}</p>
          <p className="text-xs text-green-600 mt-1">w sumie</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Year Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rok</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rola</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role === 'ALL' ? 'Wszystkie role' : role}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dział</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'ALL' ? 'Wszystkie działy' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Szukaj pracownika</label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Imię lub login..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Ładowanie...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && filteredBalances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBalances.map((balance) => (
            <EmployeeBalanceCard
              key={balance.id}
              balance={balance}
              loading={loading}
              onAdjust={(adj) => handleAdjustBalance(balance, adj)}
              onSetTotal={(total) => handleSetTotal(balance, total)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBalances.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg mb-2">Nie znaleziono pracowników</p>
          <p className="text-gray-400 text-sm">Spróbuj zmienić filtry</p>
        </div>
      )}
    </div>
  );
}
