'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStructure, Area, Machine } from '@/hooks/useStructure';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { QrCodeLabelModal, QrLabelItem } from '@/components/ui/QrCodeLabelModal';
import { QrCodeSelectionModal, QrSelectableItem } from '@/components/ui/QrCodeSelectionModal';

export default function StructurePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const { areas, machines, loading, error, addArea, updateArea, addMachine, updateMachine, deleteArea, deleteMachine } = useStructure();
  
  const canEditStructure = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    return ['ADMIN', 'ADMINISTRATOR', 'ZARZAD', 'ZARZĄD', 'BOARD', 'KIEROWNIK', 'MANAGER', 'DYREKTOR', 'DIRECTOR'].includes(role);
  }, [user]);

  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaShortCode, setNewAreaShortCode] = useState('');

  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineShortCode, setNewMachineShortCode] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');

  // Modal edycji (nazwa + synonim)
  const [editingItem, setEditingItem] = useState<{
    id: string;
    type: 'AREA' | 'MACHINE';
    name: string;
    shortCode: string;
    areaId?: string;
  } | null>(null);

  // Modal wyboru zakresu kodów QR
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState<boolean>(false);

  // Modal etykiety QR (7.5cm x 7.5cm) — pojedynczo lub zbiorczo
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    item?: QrLabelItem;
    items?: QrLabelItem[];
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/logowanie');
    }
  }, [user, authLoading, router]);

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditStructure) {
      showToast('Brak uprawnień do edycji struktury (Tryb podglądu)', 'error');
      return;
    }
    if (!newAreaName) return;
    try {
      await addArea(newAreaName, newAreaShortCode || undefined);
      showToast('Rejon dodany pomyślnie!', 'success');
      setNewAreaName('');
      setNewAreaShortCode('');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditStructure) {
      showToast('Brak uprawnień do edycji struktury (Tryb podglądu)', 'error');
      return;
    }
    if (!newMachineName || !selectedAreaId) return;
    try {
      await addMachine(newMachineName, selectedAreaId, newMachineShortCode || undefined);
      showToast('Maszyna dodana pomyślnie!', 'success');
      setNewMachineName('');
      setNewMachineShortCode('');
      setSelectedAreaId('');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditStructure) {
      showToast('Brak uprawnień do edycji (Tryb podglądu)', 'error');
      return;
    }
    if (!editingItem || !editingItem.name.trim()) return;

    try {
      if (editingItem.type === 'AREA') {
        await updateArea(editingItem.id, {
          name: editingItem.name,
          shortCode: editingItem.shortCode || null,
        });
        showToast('Dane rejonu zostały zaktualizowane!', 'success');
      } else {
        await updateMachine(editingItem.id, {
          name: editingItem.name,
          shortCode: editingItem.shortCode || null,
          areaId: editingItem.areaId,
        });
        showToast('Dane maszyny zostały zaktualizowane!', 'success');
      }
      setEditingItem(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteArea = (id: string, name: string) => {
    if (!canEditStructure) {
      showToast('Brak uprawnień do usuwania rejonu (Tryb podglądu)', 'error');
      return;
    }
    showConfirm({
      title: 'Usuwanie rejonu',
      message: `Czy na pewno chcesz usunąć rejon "${name}"? Przypisane maszyny również zostaną usunięte!`,
      confirmText: 'Usuń rejon',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteArea(id);
          showToast('Rejon został usunięty', 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      },
    });
  };

  const handleDeleteMachine = (id: string, name: string) => {
    if (!canEditStructure) {
      showToast('Brak uprawnień do usuwania maszyny (Tryb podglądu)', 'error');
      return;
    }
    showConfirm({
      title: 'Usuwanie maszyny',
      message: `Czy na pewno chcesz usunąć maszynę "${name}"?`,
      confirmText: 'Usuń maszynę',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteMachine(id);
          showToast('Maszyna została usunięta', 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      },
    });
  };

  // Przygotuj elementy do selektora kodów QR
  const qrSelectableItems: QrSelectableItem[] = useMemo(() => {
    const areaItems: QrSelectableItem[] = areas.map((a) => ({
      id: a.id,
      title: a.name,
      subtitle: 'Rejon Fabryczny',
      code: `AREA:${a.id}`,
      shortCode: a.shortCode,
      typeLabel: 'Rejon',
      groupKey: 'Rejony Fabryczne',
    }));

    const machineItems: QrSelectableItem[] = machines.map((m) => {
      const area = areas.find((a) => a.id === m.areaId);
      return {
        id: m.id,
        title: m.name,
        subtitle: area ? `Rejon: ${area.name}` : 'Maszyna Produkcyjna',
        code: `MACHINE:${m.id}`,
        shortCode: m.shortCode,
        typeLabel: 'Maszyna',
        groupKey: area ? `Rejon: ${area.name}` : 'Pozostałe Maszyny',
      };
    });

    return [...areaItems, ...machineItems];
  }, [areas, machines]);

  if (authLoading || loading) {
    return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Ładowanie struktury zakładu...</div>;
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Baner Górny */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏭</span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Struktura Rejonów i Maszyn
            </h1>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">
            Baza obszarów fabrycznych i maszyn. Dostęp do kodów QR i synonimów.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsSelectionModalOpen(true)}
            className="py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>📱</span> Pobierz / Drukuj Kody QR ({areas.length + machines.length} szt.)
          </button>
        </div>
      </div>

      {/* Baner informacyjny dla Operatora (Tryb Read-Only) */}
      {!canEditStructure && (
        <div className="p-4 bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 rounded-2xl text-xs text-blue-900 dark:text-blue-200 font-semibold flex items-center gap-3">
          <span className="text-xl">ℹ️</span>
          <div>
            <strong>Tryb Podglądu Struktury (Read-Only):</strong> Jesteś zalogowany jako Operator. Posiadasz pełen podgląd bazy rejonów, maszyn i synonimów oraz dostęp do druku kodów QR. Edycja i wprowadzanie zmian są zarezerwowane dla Kierowników i Administratorów.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Rejony */}
        <section className="glass-card flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-4 text-brand-600 dark:text-brand-400 flex items-center gap-2">
              <span>🏭</span> Rejony Fabryki
            </h2>
            
            {canEditStructure && (
              <form onSubmit={handleAddArea} className="flex flex-col gap-2 mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-500 uppercase">Dodaj nowy rejon</div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nazwa rejonu (np. Hala Produkcyjna A)" 
                    value={newAreaName}
                    onChange={e => setNewAreaName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <input 
                    type="text" 
                    placeholder="Synonim (np. HPA)" 
                    value={newAreaShortCode}
                    onChange={e => setNewAreaShortCode(e.target.value)}
                    className="w-32 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none uppercase"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-colors font-bold text-xs cursor-pointer">
                  + Dodaj Rejon
                </button>
              </form>
            )}

            <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {areas.length === 0 ? <li className="text-slate-500 italic text-xs">Brak rejonów</li> : null}
              {areas.map(area => {
                const isWarehouse = area.name.toLowerCase().includes('magazyn');
                return (
                  <li key={area.id} className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{area.name}</span>
                        {area.shortCode && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-extrabold rounded-md text-[10px] border border-blue-200 dark:border-blue-800">
                            {area.shortCode}
                          </span>
                        )}
                      </div>
                      {isWarehouse ? (
                        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 w-max">
                          📦 Magazyn (Brak maszyn)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">
                          ⚙️ Maszyn: <strong>{machines.filter(m => m.areaId === area.id).length}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Generuj QR */}
                      <button
                        onClick={() =>
                          setQrModalData({
                            isOpen: true,
                            item: {
                              id: area.id,
                              title: area.name,
                              subtitle: `Rejon Fabryczny`,
                              code: `AREA:${area.id}`,
                              shortCode: area.shortCode,
                              typeLabel: 'Rejon',
                            },
                          })
                        }
                        className="p-2 text-slate-600 hover:text-brand-600 bg-white dark:bg-slate-800 hover:bg-brand-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
                        title="Generuj i pobierz etykietę QR (7.5x7.5 cm)"
                      >
                        📱
                      </button>

                      {/* Edytuj (Tylko dla Kierowników/Admina) */}
                      {canEditStructure && (
                        <button
                          onClick={() =>
                            setEditingItem({
                              id: area.id,
                              type: 'AREA',
                              name: area.name,
                              shortCode: area.shortCode || '',
                            })
                          }
                          className="p-2 text-slate-600 hover:text-blue-600 bg-white dark:bg-slate-800 hover:bg-blue-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
                          title="Edytuj nazwę i synonim"
                        >
                          ✏️
                        </button>
                      )}

                      {/* Usuń (Tylko dla Kierowników/Admina) */}
                      {canEditStructure && (
                        <button
                          onClick={() => handleDeleteArea(area.id, area.name)}
                          className="p-2 text-slate-600 hover:text-red-600 bg-white dark:bg-slate-800 hover:bg-red-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
                          title="Usuń rejon"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Maszyny */}
        <section className="glass-card flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-4 text-brand-600 dark:text-brand-400 flex items-center gap-2">
              <span>⚙️</span> Maszyny w Rejonach
            </h2>
            
            {canEditStructure && (
              <form onSubmit={handleAddMachine} className="flex flex-col gap-2 mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-500 uppercase">Dodaj nową maszynę</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select 
                    value={selectedAreaId} 
                    onChange={e => setSelectedAreaId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none font-bold"
                  >
                    <option value="">-- Wybierz Rejon --</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    placeholder="Nazwa maszyny (np. Linia 1 Pakowania)" 
                    value={newMachineName}
                    onChange={e => setNewMachineName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Synonim / Skrót maszyny (np. PAK01)" 
                    value={newMachineShortCode}
                    onChange={e => setNewMachineShortCode(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none uppercase font-mono"
                  />
                  <button type="submit" className="py-2 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-colors font-bold text-xs cursor-pointer">
                    + Dodaj Maszynę
                  </button>
                </div>
              </form>
            )}

            <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {machines.length === 0 ? <li className="text-slate-500 italic text-xs">Brak maszyn</li> : null}
              {machines.map(m => {
                const parentArea = areas.find(a => a.id === m.areaId);
                return (
                  <li key={m.id} className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{m.name}</span>
                        {m.shortCode && (
                          <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300 font-extrabold font-mono rounded-md text-[10px] border border-brand-200 dark:border-brand-800">
                            {m.shortCode}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        📍 Rejon: <strong>{parentArea?.name || 'Brak'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Generuj QR */}
                      <button
                        onClick={() =>
                          setQrModalData({
                            isOpen: true,
                            item: {
                              id: m.id,
                              title: m.name,
                              subtitle: `Rejon: ${parentArea?.name || 'Brak'}`,
                              code: `MACHINE:${m.id}`,
                              shortCode: m.shortCode,
                              typeLabel: 'Maszyna',
                            },
                          })
                        }
                        className="p-2 text-slate-600 hover:text-brand-600 bg-white dark:bg-slate-800 hover:bg-brand-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
                        title="Generuj i pobierz etykietę QR (7.5x7.5 cm)"
                      >
                        📱
                      </button>

                      {/* Edytuj (Tylko dla Kierowników/Admina) */}
                      {canEditStructure && (
                        <button
                          onClick={() =>
                            setEditingItem({
                              id: m.id,
                              type: 'MACHINE',
                              name: m.name,
                              shortCode: m.shortCode || '',
                              areaId: m.areaId,
                            })
                          }
                          className="p-2 text-slate-600 hover:text-blue-600 bg-white dark:bg-slate-800 hover:bg-blue-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
                          title="Edytuj nazwę i synonim"
                        >
                          ✏️
                        </button>
                      )}

                      {/* Usuń (Tylko dla Kierowników/Admina) */}
                      {canEditStructure && (
                        <button
                          onClick={() => handleDeleteMachine(m.id, m.name)}
                          className="p-2 text-slate-600 hover:text-red-600 bg-white dark:bg-slate-800 hover:bg-red-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
                          title="Usuń maszynę"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>

      {/* Modal Wyboru Kodów QR */}
      <QrCodeSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        items={qrSelectableItems}
        onConfirmSelection={(selectedItems) => {
          setQrModalData({
            isOpen: true,
            items: selectedItems,
          });
        }}
      />

      {/* Modal Generowania Etykiety QR (Dla 1 przedmiotu lub całej siatki A4 3x4) */}
      {qrModalData && (
        <QrCodeLabelModal
          isOpen={qrModalData.isOpen}
          onClose={() => setQrModalData(null)}
          item={qrModalData.item}
          items={qrModalData.items}
        />
      )}

      {/* Modal Edycji Maszyny / Rejonu */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                ✏️ Edycja {editingItem.type === 'AREA' ? 'Rejonu' : 'Maszyny'}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-500 mb-1">Nazwa</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Synonim / Skrót Kodów QR</label>
                <input
                  type="text"
                  value={editingItem.shortCode}
                  onChange={(e) => setEditingItem({ ...editingItem, shortCode: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-brand-500 outline-none uppercase"
                  placeholder="np. HPA lub PAK01"
                />
              </div>

              {editingItem.type === 'MACHINE' && (
                <div>
                  <label className="block text-slate-500 mb-1">Przypisany Rejon</label>
                  <select
                    value={editingItem.areaId || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, areaId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-extrabold hover:bg-slate-200 cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-extrabold shadow-md cursor-pointer"
                >
                  Zapisz Zmiany
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
