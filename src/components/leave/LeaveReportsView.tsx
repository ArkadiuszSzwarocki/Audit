'use client';

import React, { useState, useEffect } from 'react';
import { useLeaveReports } from '@/hooks/useLeaveReports';
import { useToast } from '@/context/ToastContext';
import { printLeaveReport } from '@/utils/leaveReportPrintBuilder';

export function LeaveReportsView() {
  const { showToast } = useToast();
  const {
    loading,
    error,
    fetchEmployeeUtilization,
    fetchDepartmentSummary,
    fetchMonthlyTrend,
    fetchLeaveTypes,
    exportToCSV
  } = useLeaveReports();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'employees' | 'departments' | 'monthly' | 'types'>('employees');
  
  const [employeeData, setEmployeeData] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [typesData, setTypesData] = useState<any[]>([]);

  // Pobierz wszystkie raporty przy zmianie roku
  useEffect(() => {
    loadReports();
  }, [selectedYear]);

  const extractArray = (res: any): any[] => {
    if (!res || !res.success || !res.data) return [];
    if (Array.isArray(res.data.data)) return res.data.data;
    if (Array.isArray(res.data)) return res.data;
    return [];
  };

  const loadReports = async () => {
    if (activeTab === 'employees') {
      const result = await fetchEmployeeUtilization(selectedYear);
      setEmployeeData(extractArray(result));
    } else if (activeTab === 'departments') {
      const result = await fetchDepartmentSummary(selectedYear);
      setDepartmentData(extractArray(result));
    } else if (activeTab === 'monthly') {
      const result = await fetchMonthlyTrend(selectedYear);
      setMonthlyData(extractArray(result));
    } else if (activeTab === 'types') {
      const result = await fetchLeaveTypes(selectedYear);
      setTypesData(extractArray(result));
    }
  };

  const handleTabChange = async (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'employees') {
      const result = await fetchEmployeeUtilization(selectedYear);
      setEmployeeData(extractArray(result));
    } else if (tab === 'departments') {
      const result = await fetchDepartmentSummary(selectedYear);
      setDepartmentData(extractArray(result));
    } else if (tab === 'monthly') {
      const result = await fetchMonthlyTrend(selectedYear);
      setMonthlyData(extractArray(result));
    } else if (tab === 'types') {
      const result = await fetchLeaveTypes(selectedYear);
      setTypesData(extractArray(result));
    }
  };

  const handleExportEmployees = async () => {
    const result = await exportToCSV(employeeData, `raport-pracownicy-urlopy-${selectedYear}.csv`);
    if (result.success) {
      showToast('Raport pobrany pomyślnie!', 'success');
    } else {
      showToast(`Błąd eksportu: ${result.error}`, 'error');
    }
  };

  const handleExportDepartments = async () => {
    const result = await exportToCSV(departmentData, `raport-dzialy-urlopy-${selectedYear}.csv`);
    if (result.success) {
      showToast('Raport pobrany pomyślnie!', 'success');
    } else {
      showToast(`Błąd eksportu: ${result.error}`, 'error');
    }
  };

  const handlePrintPdf = () => {
    printLeaveReport({
      year: selectedYear,
      reportType: activeTab,
      employeeData,
      departmentData,
      monthlyData,
      typesData,
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Raporty i Analiza Urlopów</h1>
        <p className="text-gray-600">Przeglądaj statystyki wykorzystania urlopów, trendy i raporty</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rok</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => handleTabChange('employees')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👥 Pracownicy
            </button>
            <button
              onClick={() => handleTabChange('departments')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'departments'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏢 Działy
            </button>
            <button
              onClick={() => handleTabChange('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Miesięczne
            </button>
            <button
              onClick={() => handleTabChange('types')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'types'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏷️ Typy
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Ładowanie raportu...</p>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && !loading && (
        <div>
          <div className="mb-6 flex items-center justify-end gap-2">
            <button
              onClick={handlePrintPdf}
              disabled={employeeData.length === 0}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-all shadow disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <span>📄 Pobierz do PDF</span>
            </button>
            <button
              onClick={handleExportEmployees}
              disabled={employeeData.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-all shadow disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <span>📥 Pobierz CSV</span>
            </button>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Pracownik</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Dział</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700">Pula</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700">Użyte</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700">Dostępne</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700">Wykorzystanie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.isArray(employeeData) && employeeData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">
                        <div className="font-medium">{row.employeeName}</div>
                        <div className="text-xs text-gray-500">{row.employeeLogin}</div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{row.departmentName}</td>
                      <td className="px-6 py-3 text-center text-sm font-medium text-gray-900">{row.totalDays}</td>
                      <td className="px-6 py-3 text-center text-sm font-medium text-red-600">{row.usedDays}</td>
                      <td className="px-6 py-3 text-center text-sm font-medium text-green-600">{row.availableDays}</td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                row.utilizationPercent > 80
                                  ? 'bg-red-500'
                                  : row.utilizationPercent > 50
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(row.utilizationPercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-10">
                            {row.utilizationPercent.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {employeeData.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">Brak danych dla wybranego roku</p>
            </div>
          )}
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && !loading && (
        <div>
          <div className="mb-6 flex items-center justify-end gap-2">
            <button
              onClick={handlePrintPdf}
              disabled={departmentData.length === 0}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-all shadow disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <span>📄 Pobierz do PDF</span>
            </button>
            <button
              onClick={handleExportDepartments}
              disabled={departmentData.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-all shadow disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <span>📥 Pobierz CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.isArray(departmentData) && departmentData.map((dept, idx) => {
              const empCount = dept?.employeeCount ?? dept?.totalEmployees ?? 0;
              const totalPool = dept?.totalPoolDays ?? dept?.totalDays ?? 0;
              const used = dept?.totalUsedDays ?? dept?.usedDays ?? 0;
              const avail = dept?.totalAvailableDays ?? dept?.availableDays ?? 0;
              const avgUtil = dept?.averageUtilizationPercent ?? (totalPool > 0 ? (used / totalPool) * 100 : 0);

              return (
                <div key={dept.departmentId || idx} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{dept.departmentName}</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Pracownicy</p>
                      <p className="text-2xl font-bold text-blue-600">{empCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Całkowita pula</p>
                      <p className="text-2xl font-bold text-purple-600">{totalPool}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Użyte dni</p>
                      <p className="text-2xl font-bold text-red-600">{used.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dostępne</p>
                      <p className="text-2xl font-bold text-green-600">{avail.toFixed(1)}</p>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-1">Średnie wykorzystanie</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${Math.min(avgUtil, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {avgUtil.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {departmentData.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">Brak danych dla wybranego roku</p>
            </div>
          )}
        </div>
      )}

      {/* Monthly Tab */}
      {activeTab === 'monthly' && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Miesiąc</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700">Liczba urlopów</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700">Dni robocze</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700">Średnia dni/urlop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlyData.map((month) => (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{month.monthName}</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-600">{month.leavesCount}</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-600">{month.workDaysUsed}</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-600">{month.avgLeavesPerWorkDay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {monthlyData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Brak danych dla wybranego roku</p>
            </div>
          )}
        </div>
      )}

      {/* Types Tab */}
      {activeTab === 'types' && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {typesData.map((type) => (
            <div key={type.type} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{type.type}</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Liczba wniosków</p>
                  <p className="text-3xl font-bold text-blue-600">{type.count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Razem dni roboczych</p>
                  <p className="text-2xl font-bold text-purple-600">{type.workDays}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Średnio dni na wniosek</p>
                  <p className="text-2xl font-bold text-green-600">{type.averageDaysPerLeave}</p>
                </div>
              </div>
            </div>
          ))}

          {typesData.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">Brak danych dla wybranego roku</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
