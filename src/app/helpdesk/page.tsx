'use client';

import React, { useState } from 'react';
import { TicketForm } from '@/components/helpdesk/TicketForm';
import { TicketList } from '@/components/helpdesk/TicketList';

export default function HelpDeskPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  const handleTicketCreated = () => {
    setRefreshKey(prev => prev + 1);
    setShowNewTicketModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Help Desk IT</h1>
              <span className="text-3xl">🆘</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Zgłaszaj problemy techniczne i zapotrzebowania do naszego zespołu IT
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <span>➕</span>
              Zgłoś nowe
            </button>
          </div>
        </div>

        {/* Lista zgłoszeń - pełna szerokość */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Zgłoszenia do przetworzenia</h2>
            <span className="text-2xl">📋</span>
          </div>
          <TicketList key={refreshKey} />
        </div>
      </div>

      {/* Modal - Nowe zgłoszenie */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Zgłoś nowe zgłoszenie</h2>
                <span className="text-2xl">➕</span>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <TicketForm onTicketCreated={handleTicketCreated} isInModal />
          </div>
        </div>
      )}
    </div>
  );
}
