'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStructure, Area, Machine } from '@/hooks/useStructure';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { QrCodeLabelModal, QrLabelItem } from '@/components/ui/QrCodeLabelModal';
import { QrCodeSelectionModal, QrSelectableItem } from '@/components/ui/QrCodeSelectionModal';

export default function StructurePage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const { areas, machines, loading, error, addArea, updateArea, addMachine, updateMachine, deleteArea, deleteMachine } = useStructure();
  
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
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading, router]);

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
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

  if (loading) return <div className="p-8 text-center animate-pulse">Ładowanie struktury...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Błąd: {error}</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>⚙️</span> Zarządzanie Strukturą Zakładu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Zarządzaj rejonami i maszynami, przypisuj synonimy (np. MID01, MIM01) oraz generuj etykiety QR 7.5x7.5 cm.
          </p>
        </div>

        {/* Przyciski Zbiorczego Pobierania i Drukowania Kodów QR */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setIsSelectionModalOpen(true)}
            className="py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>📱</span> Pobierz / Drukuj Kody QR... ({areas.length + machines.length} szt.)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Rejony */}
        <section className="glass-card flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-4 text-brand-600 dark:text-brand-400 flex items-center gap-2">
              <span>🏭</span> Rejony Fabryki
            </h2>
            
            {isAdmin && (
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
                <button type="submit" className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-colors font-bold text-xs">
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
                        className="p-2 text-slate-600 hover:text-brand-600 bg-white dark:bg-slate-800 hover:bg-brand-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
                        title="Generuj i pobierz etykietę QR (7.5x7.5 cm)"
                      >
                        📱
                      </button>

                      {/* Edytuj */}
                      {isAdmin && (
                        <button
                          onClick={() =>
                            setEditingItem({
                              id: area.id,
                              type: 'AREA',
                              name: area.name,
                              shortCode: area.shortCode || '',
                            })
                          }
                          className="p-2 text-slate-600 hover:text-blue-600 bg-white dark:bg-slate-800 hover:bg-blue-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
                          title="Edytuj nazwę i synonim"
                        >
                          ✏️
                        </button>
                      )}

                      {/* Usuń */}
                      {isAdmin && (
                        <button
                          onClick={() => {
                            showConfirm({
                              title: 'Usuwanie Rejonu',
                              message: `Czy na pewno chcesz usunąć rejon "${area.name}"?`,
                              confirmText: 'Usuń rejon',
                              isDanger: true,
                              onConfirm: async () => {
                                await deleteArea(area.id);
                                showToast('Rejon usunięty', 'success');
                              }
                            });
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
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
            <h2 className="text-xl font-bold mb-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <span>⚙️</span> Maszyny i Urządzenia
            </h2>
            
            {isAdmin && (
              <form onSubmit={handleAddMachine} className="flex flex-col gap-2 mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-500 uppercase">Dodaj nową maszynę</div>
                <input 
                  type="text" 
                  placeholder="Nazwa maszyny (np. Mieszalnik Duży)" 
                  value={newMachineName}
                  onChange={e => setNewMachineName(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Synonim (np. MID01)" 
                    value={newMachineShortCode}
                    onChange={e => setNewMachineShortCode(e.target.value)}
                    className="w-36 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                  />
                  <select 
                    value={selectedAreaId}
                    onChange={e => setSelectedAreaId(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="" disabled>Wybierz rejon produkcyjny</option>
                    {areas
                      .filter(area => !area.name.toLowerCase().includes('magazyn'))
                      .map(area => (
                        <option key={area.id} value={area.id}>{area.name} {area.shortCode ? `(${area.shortCode})` : ''}</option>
                      ))}
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors font-bold text-xs">
                  + Dodaj Maszynę
                </button>
              </form>
            )}

            <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {machines.length === 0 ? <li className="text-slate-500 italic text-xs">Brak maszyn</li> : null}
              {machines.map(machine => {
                const area = areas.find(a => a.id === machine.areaId);
                return (
                  <li key={machine.id} className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{machine.name}</span>
                        {machine.shortCode && (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold rounded-md text-[10px] border border-emerald-200 dark:border-emerald-800">
                            {machine.shortCode}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Rejon: <strong className="text-slate-700 dark:text-slate-300">{area?.name || 'Nieznany'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Generuj QR */}
                      <button
                        onClick={() =>
                          setQrModalData({
                            isOpen: true,
                            item: {
                              id: machine.id,
                              title: machine.name,
                              subtitle: `Rejon: ${area?.name || 'Brak'}`,
                              code: `MACHINE:${machine.id}`,
                              shortCode: machine.shortCode,
                              typeLabel: 'Maszyna',
                            },
                          })
                        }
                        className="p-2 text-slate-600 hover:text-emerald-600 bg-white dark:bg-slate-800 hover:bg-emerald-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
                        title="Generuj i pobierz etykietę QR (7.5x7.5 cm)"
                      >
                        📱
                      </button>

                      {/* Edytuj */}
                      {isAdmin && (
                        <button
                          onClick={() =>
                            setEditingItem({
                              id: machine.id,
                              type: 'MACHINE',
                              name: machine.name,
                              shortCode: machine.shortCode || '',
                              areaId: machine.areaId,
                            })
                          }
                          className="p-2 text-slate-600 hover:text-blue-600 bg-white dark:bg-slate-800 hover:bg-blue-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
                          title="Edytuj nazwę, synonim i rejon"
                        >
                          ✏️
                        </button>
                      )}

                      {/* Usuń */}
                      {isAdmin && (
                        <button
                          onClick={() => {
                            showConfirm({
                              title: 'Usuwanie Maszyny',
                              message: `Czy na pewno chcesz usunąć maszynę "${machine.name}"?`,
                              confirmText: 'Usuń maszynę',
                              isDanger: true,
                              onConfirm: async () => {
                                await deleteMachine(machine.id);
                                showToast('Maszyna usunięta', 'success');
                              }
                            });
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
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

      {/* Modal Edycji Nazwy i Synonimu */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>✏️</span> Edycja: {editingItem.type === 'AREA' ? 'Rejon' : 'Maszyna'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Nazwa {editingItem.type === 'AREA' ? 'Rejonu' : 'Maszyny'}
              </label>
              <input
                type="text"
                value={editingItem.name}
                onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="np. Mieszalnik Duży"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Synonim / Kod skrócony (np. MID01, MIM01, MIS01)
              </label>
              <input
                type="text"
                value={editingItem.shortCode}
                onChange={e => setEditingItem({ ...editingItem, shortCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-bold tracking-wider"
                placeholder="np. MID01"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Synonim będzie drukowany na etykiecie QR oraz ułatwi szybkie wyszukiwanie.
              </p>
            </div>

            {editingItem.type === 'MACHINE' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Przypisany Rejon
                </label>
                <select
                  value={editingItem.areaId || ''}
                  onChange={e => setEditingItem({ ...editingItem, areaId: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {areas
                    .filter(area => !area.name.toLowerCase().includes('magazyn'))
                    .map(area => (
                      <option key={area.id} value={area.id}>
                        {area.name} {area.shortCode ? `(${area.shortCode})` : ''}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs transition-colors"
              >
                Zapisz Zmiany
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="py-2.5 px-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition-colors"
              >
                Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Okno Modularne wyboru zakresu kodów QR */}
      {isSelectionModalOpen && (
        <QrCodeSelectionModal
          isOpen={isSelectionModalOpen}
          onClose={() => setIsSelectionModalOpen(false)}
          availableAreas={areas.map((a) => ({ id: a.id, name: a.name }))}
          items={[
            ...areas.map((a) => ({
              id: a.id,
              title: a.name,
              subtitle: 'Rejon Fabryczny',
              code: `AREA:${a.id}`,
              shortCode: a.shortCode,
              typeLabel: 'Rejon' as const,
              areaId: a.id,
              parentAreaName: a.name,
            })),
            ...machines.map((m) => {
              const area = areas.find((a) => a.id === m.areaId);
              return {
                id: m.id,
                title: m.name,
                subtitle: `Rejon: ${area?.name || 'Brak'}`,
                code: `MACHINE:${m.id}`,
                shortCode: m.shortCode,
                typeLabel: 'Maszyna' as const,
                areaId: m.areaId,
                parentAreaName: area?.name || null,
              };
            }),
          ]}
          onConfirmSelection={(selectedLabels, action) => {
            setQrModalData({
              isOpen: true,
              items: selectedLabels,
            });
          }}
        />
      )}

      {/* Modal etykiety QR */}
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
