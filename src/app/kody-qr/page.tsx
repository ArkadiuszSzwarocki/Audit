'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { QrCodeLabelModal, QrLabelItem } from '@/components/ui/QrCodeLabelModal';
import { QrCodeSelectionModal, QrSelectableItem } from '@/components/ui/QrCodeSelectionModal';

interface CustomQrItem {
  id: string;
  shortCode: string;
  title: string;
  subtitle: string;
  code: string;
  typeLabel: 'Maszyna' | 'Rejon';
}

const LOCAL_STORAGE_KEY = 'audit_app_custom_qr_list_v1';

export default function CustomQrGeneratorPage() {
  const { showToast, showConfirm } = useToast();
  const [customList, setCustomList] = useState<CustomQrItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Formularz nowego kodu
  const [shortCode, setShortCode] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [code, setCode] = useState('');
  const [typeLabel, setTypeLabel] = useState<'Maszyna' | 'Rejon'>('Rejon');

  // Stan edycji istniejącego wpisu
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modal wyboru zakresu etykiet QR
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState<boolean>(false);

  // Modal podglądu etykiet QR
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    item?: QrLabelItem;
    items?: QrLabelItem[];
  } | null>(null);

  // Wczytywanie listy z localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setCustomList(JSON.parse(saved));
      } else {
        // Przykładowe wpisy początkowe
        setCustomList([
          {
            id: 'demo-1',
            shortCode: 'PAL-01',
            title: 'Paleta Surowców Malina',
            subtitle: 'Regał 1 • Sektor A',
            code: 'PALETTE:MALINA:01',
            typeLabel: 'Rejon',
          },
          {
            id: 'demo-2',
            shortCode: 'BOX-99',
            title: 'Pojemnik Komponentów A2',
            subtitle: 'Regał 1 • Strefa Pakowania',
            code: 'CONTAINER:BOX:99',
            typeLabel: 'Maszyna',
          },
        ]);
      }
    } catch (e) {
      console.error('Błąd odczytu z localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Zapis do localStorage przy każdej zmianie listy
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customList));
    }
  }, [customList, isLoaded]);

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortCode.trim() && !title.trim()) {
      showToast('Wprowadź co najmniej Synonim (Kod) lub Nazwę', 'error');
      return;
    }

    const payloadCode = code.trim() || shortCode.trim() || title.trim();

    if (editingId) {
      // Edycja istniejącego
      setCustomList((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                shortCode: shortCode.trim().toUpperCase(),
                title: title.trim(),
                subtitle: subtitle.trim(),
                code: payloadCode,
                typeLabel,
              }
            : item
        )
      );
      showToast('Zaktualizowano kod QR', 'success');
      setEditingId(null);
    } else {
      // Dodawanie nowego
      const newItem: CustomQrItem = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        shortCode: shortCode.trim().toUpperCase(),
        title: title.trim(),
        subtitle: subtitle.trim(),
        code: payloadCode,
        typeLabel,
      };
      setCustomList((prev) => [newItem, ...prev]);
      showToast('Dodano nowy kod QR do listy', 'success');
    }

    // Czyszczenie formularza
    setShortCode('');
    setTitle('');
    setSubtitle('');
    setCode('');
  };

  const handleEditClick = (item: CustomQrItem) => {
    setEditingId(item.id);
    setShortCode(item.shortCode);
    setTitle(item.title);
    setSubtitle(item.subtitle);
    setCode(item.code);
    setTypeLabel(item.typeLabel);
  };

  const handleDeleteItem = (id: string, name: string) => {
    showConfirm({
      title: 'Usuwanie kodu QR',
      message: `Czy na pewno chcesz usunąć "${name}" z listy?`,
      confirmText: 'Usuń',
      isDanger: true,
      onConfirm: () => {
        setCustomList((prev) => prev.filter((item) => item.id !== id));
        showToast('Usunięto z listy', 'success');
      },
    });
  };

  const handleClearAll = () => {
    showConfirm({
      title: 'Wyszyszczenie całej listy',
      message: 'Czy na pewno chcesz usunąć wszystkie kody z roboczej listy?',
      confirmText: 'Wyczyść wszystko',
      isDanger: true,
      onConfirm: () => {
        setCustomList([]);
        showToast('Wyczyszczono listę', 'success');
      },
    });
  };

  const mapToSelectableItem = (item: CustomQrItem): QrSelectableItem => ({
    id: item.id,
    title: item.title || item.shortCode,
    subtitle: item.subtitle,
    code: item.code,
    shortCode: item.shortCode,
    typeLabel: item.typeLabel,
    parentAreaName: item.subtitle,
  });

  const handleSelectionConfirmed = (selectedLabels: QrLabelItem[]) => {
    setQrModalData({
      isOpen: true,
      items: selectedLabels,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      {/* Nagłówek strony */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>📱</span> Generator Kodów QR — Luźna Lista Operatora
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Przygotuj własną roboczą listę dowolnych kodów QR (np. palety, pojemniki, regały). Synonim jest głównym punktem widocznym na etykiecie!
          </p>
        </div>

        {/* Przycisk Wyboru Zakresu i Druku */}
        {customList.length > 0 && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setIsSelectionModalOpen(true)}
              className="py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>📱</span> Pobierz / Drukuj Kody QR... ({customList.length} szt.)
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formularz Tworzenia/Edycji */}
        <section className="glass-card md:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>✏️</span> {editingId ? 'Edycja Kodu' : 'Nowy Kod QR'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setShortCode('');
                  setTitle('');
                  setSubtitle('');
                  setCode('');
                }}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                Anuluj
              </button>
            )}
          </div>

          <form onSubmit={handleAddOrUpdate} className="space-y-3">
            <div>
              <label className="block text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
                ⭐ Synonim / Kod Skrócony (GŁÓWNY PUNKT)
              </label>
              <input
                type="text"
                placeholder="np. PAL-01, REJ-55, BOX-99"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none uppercase tracking-wider"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Będzie wyświetlany jako główny, najbardziej widoczny element etykiety!
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Pełna Nazwa / Opis (Informacyjny)
              </label>
              <input
                type="text"
                placeholder="np. Paleta Surowców Malina"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Podtytuł / Kategoria / Lokalizacja (np. Regał 1)
              </label>
              <input
                type="text"
                placeholder="np. Regał 1 • Strefa Pakowania"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Treść Kodu QR (Kodowany ciąg znaków)
              </label>
              <input
                type="text"
                placeholder="Domyślnie użyty zostanie Synonim / Nazwa"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Etykieta typu</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTypeLabel('Rejon')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    typeLabel === 'Rejon'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  🏭 Rejon / Strefa
                </button>
                <button
                  type="button"
                  onClick={() => setTypeLabel('Maszyna')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    typeLabel === 'Maszyna'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ⚙️ Maszyna / Urządzenie
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer"
            >
              {editingId ? 'Zapisz Zmiany w Kodzie' : '+ Dodaj do Listy QR'}
            </button>
          </form>
        </section>

        {/* Lista Robocza Operatora */}
        <section className="glass-card md:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>📋</span> Luźna Lista Kodów Operatora ({customList.length} szt.)
              </h2>
              {customList.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-red-500 hover:text-red-600 font-bold cursor-pointer"
                >
                  Wyczyść całą listę
                </button>
              )}
            </div>

            {customList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic text-xs">
                Brak dodanych kodów na roboczej liście. Wypełnij formularz po lewej stronie, aby dodać pierwsze kody!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 max-h-[550px] overflow-y-auto pr-1">
                {customList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2 hover:border-brand-300 transition-all"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-black text-slate-900 dark:text-slate-100 text-sm tracking-wider uppercase truncate">
                        {item.shortCode || item.title}
                      </span>
                      {item.shortCode && item.title && (
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold truncate">
                          {item.title}
                        </span>
                      )}
                      {item.subtitle && (
                        <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                          {item.typeLabel} • {item.subtitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Podgląd pojedynczej etykiety QR */}
                      <button
                        onClick={() =>
                          setQrModalData({
                            isOpen: true,
                            item: {
                              id: item.id,
                              title: item.title || item.shortCode,
                              subtitle: item.subtitle,
                              code: item.code,
                              shortCode: item.shortCode,
                              typeLabel: item.typeLabel,
                            },
                          })
                        }
                        className="p-2 text-slate-600 hover:text-brand-600 bg-white dark:bg-slate-800 hover:bg-brand-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
                        title="Podgląd etykiety"
                      >
                        📱
                      </button>

                      {/* Edycja */}
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-2 text-slate-600 hover:text-blue-600 bg-white dark:bg-slate-800 hover:bg-blue-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
                        title="Edytuj dane kodu"
                      >
                        ✏️
                      </button>

                      {/* Usunięcie */}
                      <button
                        onClick={() => handleDeleteItem(item.id, item.shortCode || item.title)}
                        className="p-2 text-slate-400 hover:text-red-600 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
                        title="Usuń z listy"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 1. Okno Modularne Wyboru Zakresu Kodów QR */}
      {isSelectionModalOpen && (
        <QrCodeSelectionModal
          isOpen={isSelectionModalOpen}
          onClose={() => setIsSelectionModalOpen(false)}
          items={customList.map(mapToSelectableItem)}
          onConfirmSelection={handleSelectionConfirmed}
        />
      )}

      {/* 2. Modal Podglądu, Druku i Pobierania Etykiet QR */}
      {qrModalData && (
        <QrCodeLabelModal
          isOpen={qrModalData.isOpen}
          onClose={() => setQrModalData(null)}
          item={qrModalData.item}
          items={qrModalData.items}
        />
      )}
    </div>
  );
}
