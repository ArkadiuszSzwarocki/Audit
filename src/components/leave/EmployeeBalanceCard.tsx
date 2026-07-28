import React, { useState } from 'react';

interface EmployeeBalanceCardProps {
  balance: any;
  onAdjust?: (adjustment: number) => void;
  onSetTotal?: (newTotal: number) => void;
  loading?: boolean;
}

export function EmployeeBalanceCard({
  balance,
  onAdjust,
  onSetTotal,
  loading = false
}: EmployeeBalanceCardProps) {
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [newTotalValue, setNewTotalValue] = useState(balance.totalDays);

  const availableDays = balance.totalDays - balance.usedDays;
  const usagePercent = balance.totalDays > 0 ? (balance.usedDays / balance.totalDays * 100) : 0;

  const handleAdjust = () => {
    if (adjustmentValue !== 0) {
      onAdjust?.(adjustmentValue);
      setAdjustmentValue(0);
      setShowAdjustForm(false);
    }
  };

  const handleSetTotal = () => {
    if (newTotalValue !== balance.totalDays) {
      onSetTotal?.(newTotalValue);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{balance.user.name}</h3>
        <p className="text-sm text-gray-600">{balance.user.login}</p>
        {balance.user.department && (
          <p className="text-sm text-gray-600">{balance.user.department.name}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Całkowita pula</p>
          <p className="text-2xl font-bold text-blue-600">{balance.totalDays}</p>
          <p className="text-xs text-gray-500">dni</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Użyte dni</p>
          <p className="text-2xl font-bold text-red-600">{balance.usedDays}</p>
          <p className="text-xs text-gray-500">({usagePercent.toFixed(0)}%)</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Dostępne</p>
          <p className={`text-2xl font-bold ${availableDays >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
            {availableDays}
          </p>
          <p className="text-xs text-gray-500">dni</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Wykorzystanie</span>
          <span className="text-sm text-gray-600">{usagePercent.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowAdjustForm(!showAdjustForm)}
          disabled={loading}
          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
        >
          Dostosuj dni
        </button>
        <button
          onClick={() => handleSetTotal()}
          disabled={loading || newTotalValue === balance.totalDays}
          className="flex-1 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
        >
          Zmień pulę
        </button>
      </div>

      {/* Adjust Form */}
      {showAdjustForm && (
        <div className="bg-blue-50 rounded-md p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dostosowanie dni (może być ujemne)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={adjustmentValue}
              onChange={(e) => setAdjustmentValue(parseFloat(e.target.value) || 0)}
              placeholder="np. 2 lub -1"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAdjust}
              disabled={loading || adjustmentValue === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Zastosuj
            </button>
          </div>
        </div>
      )}

      {/* Set Total Form */}
      <div className="bg-green-50 rounded-md p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zmiana całkowitej puli
        </label>
        <input
          type="number"
          value={newTotalValue}
          onChange={(e) => setNewTotalValue(parseFloat(e.target.value) || 0)}
          min="0"
          max="365"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-600 mt-2">
          Uwaga: Nie możesz zmniejszyć puli poniżej {balance.usedDays} już użytych dni
        </p>
      </div>

      {/* Year Badge */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Rok: {balance.year}
      </div>
    </div>
  );
}
