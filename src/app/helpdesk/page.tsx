'use client';

import React, { useState } from 'react';
import { TicketForm } from '@/components/helpdesk/TicketForm';
import { TicketList } from '@/components/helpdesk/TicketList';

export default function HelpDeskPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTicketCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Help Desk IT</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-2">Nowe zgłoszenie</h2>
          <TicketForm onTicketCreated={handleTicketCreated} />
        </div>
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-2">Twoje zgłoszenia</h2>
          <TicketList key={refreshKey} />
        </div>
      </div>
    </div>
  );
}
