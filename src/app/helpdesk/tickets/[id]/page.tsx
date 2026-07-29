'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function TicketDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketId = params.id as string;
  const token = searchParams.get('token');

  useEffect(() => {
    if (ticketId) {
      const targetUrl = token
        ? `/helpdesk?ticketId=${ticketId}&token=${encodeURIComponent(token)}`
        : `/helpdesk?ticketId=${ticketId}`;
      router.replace(targetUrl);
    }
  }, [ticketId, token, router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          Otwieranie szczegółów zgłoszenia w panelu Help Desk...
        </p>
      </div>
    </div>
  );
}