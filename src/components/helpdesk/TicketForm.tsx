'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/context/ToastContext';

const ticketSchema = z.object({
  title: z.string().min(5, 'Tytuł musi mieć co najmniej 5 znaków'),
  description: z.string().min(10, 'Opis musi mieć co najmniej 10 znaków'),
  type: z.enum(['PROBLEM', 'PURCHASE'], { message: 'Typ zgłoszenia jest wymagany.' }),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], { message: 'Priorytet jest wymagany.' }),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface TicketFormProps {
  onTicketCreated: () => void;
  isInModal?: boolean;
}

export function TicketForm({ onTicketCreated, isInModal = false }: TicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      type: undefined as any,
      priority: undefined as any,
    },
  });

  const onSubmit: SubmitHandler<TicketFormData> = async (data) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/helpdesk/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nie udało się utworzyć zgłoszenia');
      }

      showToast('Zgłoszenie zostało pomyślnie utworzone! 📨', 'success');
      reset();
      onTicketCreated();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Tytuł zgłoszenia
        </label>
        <input
          id="title"
          {...register('title')}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="np. Problem z logowaniem"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Opis problemu
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Opisz problem i jego wpływ na Twoją pracę..."
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Typ zgłoszenia
        </label>
        <select
          id="type"
          {...register('type')}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">-- Wybierz typ --</option>
          <option value="PROBLEM">🔧 Problem techniczny</option>
          <option value="PURCHASE">🛒 Zapotrzebowanie na sprzęt/oprogramowanie</option>
        </select>
        {errors.type && (
          <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Priorytet
        </label>
        <select
          id="priority"
          {...register('priority')}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">-- Wybierz priorytet --</option>
          <option value="LOW">🟢 Niski</option>
          <option value="MEDIUM">🟡 Średni</option>
          <option value="HIGH">🟠 Wysoki</option>
          <option value="CRITICAL">🔴 Krytyczny</option>
        </select>
        {errors.priority && (
          <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin">⏳</span>
            Wysyłanie...
          </>
        ) : (
          <>
            <span>✉️</span>
            Wyślij zgłoszenie
          </>
        )}
      </button>

      {!isInModal && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>Porada:</strong> Im więcej szczegółów podasz, tym szybciej będziemy mogli Ci pomóc!
          </p>
        </div>
      )}
    </form>
  );
}
