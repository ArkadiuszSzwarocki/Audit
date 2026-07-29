'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { QrLabelItem } from './QrCodeLabelModal';

export interface QrSelectableItem {
  id: string;
  title: string;
  subtitle?: string;
  code: string;
  shortCode?: string | null;
  typeLabel: 'Maszyna' | 'Rejon';
  areaId?: string | null; // ID rejonu nadrzędnego dla maszyny
  parentAreaName?: string | null;
}

interface QrCodeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: QrSelectableItem[];
  availableAreas?: { id: string; name: string }[];
  onConfirmSelection: (selectedItems: QrLabelItem[], action: 'preview' | 'pdf' | 'png') => void;
}

type FilterMode = 'ALL' | 'MACHINES' | 'AREAS' | 'SPECIFIC_AREA' | 'MANUAL';

export function QrCodeSelectionModal({
  isOpen,
  onClose,
  items,
  availableAreas = [],
  onConfirmSelection,
}: QrCodeSelectionModalProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [selectedAreaId, setSelectedAreaId] = useState<string>(availableAreas[0]?.id || '');
  const [includeAreaMachines, setIncludeAreaMachines] = useState<boolean>(true);
  const [manualSelectedIds, setManualSelectedIds] = useState<Set<string>>(
    new Set(items.map((i) => i.id))
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Unikalne rejony / kategorie na liście (jeśli brak availableAreas)
  const areaOptions = useMemo(() => {
    if (availableAreas.length > 0) return availableAreas;

    // Próba zbudowania opcji z subtitle / parentAreaName
    const areaMap = new Map<string, string>();
    items.forEach((item) => {
      if (item.typeLabel === 'Rejon') {
        areaMap.set(item.id, item.title);
      } else if (item.areaId && item.parentAreaName) {
        areaMap.set(item.areaId, item.parentAreaName);
      }
    });
    return Array.from(areaMap.entries()).map(([id, name]) => ({ id, name }));
  }, [availableAreas, items]);

  // Wyliczanie przefiltrowanej listy etykiet na podstawie wybranego wariantu
  const filteredItems = useMemo(() => {
    if (filterMode === 'ALL') {
      return items;
    }
    if (filterMode === 'MACHINES') {
      return items.filter((i) => i.typeLabel === 'Maszyna');
    }
    if (filterMode === 'AREAS') {
      return items.filter((i) => i.typeLabel === 'Rejon');
    }
    if (filterMode === 'SPECIFIC_AREA') {
      if (!selectedAreaId) return [];

      const targetAreaObj = areaOptions.find((a) => a.id === selectedAreaId);
      const targetAreaName = targetAreaObj ? targetAreaObj.name.toLowerCase() : '';

      return items.filter((i) => {
        // Czy to ten konkretny rejon
        const isTargetArea =
          (i.typeLabel === 'Rejon' && i.id === selectedAreaId) ||
          (i.typeLabel === 'Rejon' && i.title.toLowerCase() === targetAreaName);

        // Czy to maszyna w tym rejonie
        const isMachineInTargetArea =
          i.typeLabel === 'Maszyna' &&
          ((i.areaId && i.areaId === selectedAreaId) ||
            (i.subtitle && i.subtitle.toLowerCase().includes(targetAreaName)) ||
            (i.parentAreaName && i.parentAreaName.toLowerCase() === targetAreaName));

        if (includeAreaMachines) {
          return isTargetArea || isMachineInTargetArea;
        }
        return isTargetArea;
      });
    }
    if (filterMode === 'MANUAL') {
      return items.filter((i) => manualSelectedIds.has(i.id));
    }
    return items;
  }, [filterMode, items, selectedAreaId, includeAreaMachines, manualSelectedIds, areaOptions]);

  // Przefiltrowana lista dla trybu ręcznego (wyszukiwarka)
  const searchedItemsForManual = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.shortCode && i.shortCode.toLowerCase().includes(q)) ||
        (i.subtitle && i.subtitle.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  if (!isOpen) return null;

  const handleToggleManualId = (id: string) => {
    setManualSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllManual = () => {
    setManualSelectedIds(new Set(items.map((i) => i.id)));
  };

  const handleDeselectAllManual = () => {
    setManualSelectedIds(new Set());
  };

  const mapToQrLabelItems = (list: QrSelectableItem[]): QrLabelItem[] =>
    list.map((i) => ({
      id: i.id,
      title: i.title,
      subtitle: i.subtitle,
      code: i.code,
      shortCode: i.shortCode,
      typeLabel: i.typeLabel,
    }));

  const handleConfirm = (action: 'preview' | 'pdf' | 'png') => {
    const finalLabels = mapToQrLabelItems(filteredItems);
    onConfirmSelection(finalLabels, action);
    onClose();
  };

  const a4PagesCount = Math.ceil(filteredItems.length / 12);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] flex flex-col justify-between">
        {/* Nagłówek okna modularnego */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>🖨️</span> Wybierz Zakres Kodów QR do Pobrania / Druku
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Wybierz, które etykiety chcesz przygotować (wszystkie, tylko maszyny, konkretny rejon lub zaznacz ręcznie).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Zawartość opcji filtrowania */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Wybór Wariantu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option 1: Wszystkie */}
            <label
              onClick={() => setFilterMode('ALL')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                filterMode === 'ALL'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="filterMode"
                checked={filterMode === 'ALL'}
                onChange={() => setFilterMode('ALL')}
                className="mt-1 accent-brand-600"
              />
              <div>
                <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  🌐 Wszystkie Kody QR ({items.length} szt.)
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Kompletna lista wszystkich rejonów oraz maszyn
                </div>
              </div>
            </label>

            {/* Option 2: Tylko Maszyny */}
            <label
              onClick={() => setFilterMode('MACHINES')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                filterMode === 'MACHINES'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="filterMode"
                checked={filterMode === 'MACHINES'}
                onChange={() => setFilterMode('MACHINES')}
                className="mt-1 accent-brand-600"
              />
              <div>
                <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  ⚙️ Tylko Maszyny ({items.filter((i) => i.typeLabel === 'Maszyna').length} szt.)
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Wyłącznie kody dla maszyn i urządzeń
                </div>
              </div>
            </label>

            {/* Option 3: Tylko Rejony */}
            <label
              onClick={() => setFilterMode('AREAS')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                filterMode === 'AREAS'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="filterMode"
                checked={filterMode === 'AREAS'}
                onChange={() => setFilterMode('AREAS')}
                className="mt-1 accent-brand-600"
              />
              <div>
                <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  🏭 Tylko Rejony ({items.filter((i) => i.typeLabel === 'Rejon').length} szt.)
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Wyłącznie kody dla rejonów i obszarów
                </div>
              </div>
            </label>

            {/* Option 4: Konkretny Rejon */}
            <label
              onClick={() => setFilterMode('SPECIFIC_AREA')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                filterMode === 'SPECIFIC_AREA'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="filterMode"
                checked={filterMode === 'SPECIFIC_AREA'}
                onChange={() => setFilterMode('SPECIFIC_AREA')}
                className="mt-1 accent-brand-600"
              />
              <div>
                <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  📍 Konkretny Rejon / Strefa
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Wybierz 1 rejon (np. Hala, Regał) i opcjonalnie jego maszyny
                </div>
              </div>
            </label>
          </div>

          {/* Konfiguracja Wariantu: Konkretny Rejon */}
          {filterMode === 'SPECIFIC_AREA' && (
            <div className="p-4 bg-brand-50/60 dark:bg-brand-950/30 rounded-2xl border border-brand-200 dark:border-brand-800 space-y-3 animate-in fade-in duration-200">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Wybierz rejon / strefę z listy:
              </label>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              >
                {areaOptions.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={includeAreaMachines}
                  onChange={(e) => setIncludeAreaMachines(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-600"
                />
                <span>Dołącz wszystkie maszyny należące do tego rejonu</span>
              </label>
            </div>
          )}

          {/* Option 5: Ręczny Wybór z Checkboxów */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label
                onClick={() => setFilterMode('MANUAL')}
                className="flex items-center gap-2 cursor-pointer text-sm font-extrabold text-slate-800 dark:text-slate-100"
              >
                <input
                  type="radio"
                  name="filterMode"
                  checked={filterMode === 'MANUAL'}
                  onChange={() => setFilterMode('MANUAL')}
                  className="accent-brand-600"
                />
                <span>📋 Ręczne zaznaczanie poszczególnych etykiet ({manualSelectedIds.size} zaznaczonych)</span>
              </label>
              {filterMode === 'MANUAL' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllManual}
                    className="text-xs text-brand-600 hover:text-brand-700 font-bold"
                  >
                    Zaznacz wszystkie
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllManual}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Odznacz wszystkie
                  </button>
                </div>
              )}
            </div>

            {filterMode === 'MANUAL' && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <input
                  type="text"
                  placeholder="🔍 Szukaj etykiety na liście..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />

                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-slate-50 dark:bg-slate-900 space-y-1">
                  {searchedItemsForManual.map((item) => {
                    const isChecked = manualSelectedIds.has(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-brand-50 dark:bg-brand-950/40 text-slate-900 dark:text-slate-100 font-bold'
                            : 'hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleManualId(item.id)}
                            className="w-4 h-4 rounded accent-brand-600"
                          />
                          <span className="truncate">
                            <strong className="uppercase">{item.shortCode || item.title}</strong>
                            {item.shortCode && item.title && ` (${item.title})`}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium shrink-0 ml-2">
                          {item.typeLabel}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Podsumowanie i Przyciski Akcji */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-2xl text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Wybrany zestaw etykiet: <strong className="text-brand-600 text-sm">{filteredItems.length} szt.</strong>
            </span>
            <span className="font-extrabold text-slate-500">
              Liczba arkuszy A4: <strong className="text-slate-800 dark:text-slate-200">{a4PagesCount} {a4PagesCount === 1 ? 'strona' : 'strony'}</strong> (12 / strona)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleConfirm('preview')}
              disabled={filteredItems.length === 0}
              className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <span>📱</span> Podgląd i Wydruk Wybranych ({filteredItems.length} szt.)
            </button>

            <button
              onClick={() => handleConfirm('pdf')}
              disabled={filteredItems.length === 0}
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <span>📑</span> Pobierz PDF A4 (Siatka 3x4)
            </button>

            <button
              onClick={() => handleConfirm('png')}
              disabled={filteredItems.length === 0}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <span>💾</span> Pobierz PNG ({filteredItems.length} szt.)
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
