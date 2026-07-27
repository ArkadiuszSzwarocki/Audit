'use client';

import React, { useState, useEffect } from 'react';
import { HelpDeskTicket, User } from '@/generated/prisma';

type TicketWithUser = HelpDeskTicket & { createdBy: User };

export function TicketList() {
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        // TODO: Stworzyć endpoint do pobierania ticketów
        // const response = await fetch('/api/helpdesk/tickets');
        // if (!response.ok) throw new Error('Failed to fetch tickets');
        // const data = await response.json();
        // setTickets(data);
        setTickets([]); // Placeholder
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  if (isLoading) return <div>Ładowanie...</div>;
  if (error) return <div className="text-red-500">Błąd: {error}</div>;

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <p>Nie masz jeszcze żadnych zgłoszeń.</p>
      ) : (
        tickets.map(ticket => (
          <div key={ticket.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="font-bold">{ticket.title}</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                ticket.status === 'OPEN' ? 'bg-blue-200 text-blue-800' :
                ticket.status === 'CLOSED' ? 'bg-gray-200 text-gray-800' :
                ticket.status === 'PENDING_APPROVAL' ? 'bg-yellow-200 text-yellow-800' :
                ticket.status === 'APPROVED' ? 'bg-green-200 text-green-800' :
                'bg-red-200 text-red-800'
              }`}>
                {ticket.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
            <div className="text-xs text-gray-500 mt-2">
              <span>Zgłoszono: {new Date(ticket.createdAt).toLocaleString()}</span> | 
              <span> Typ: {ticket.type}</span> |
              <span> Priorytet: {ticket.priority}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
