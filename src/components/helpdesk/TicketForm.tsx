'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const ticketSchema = z.object({
  title: z.string().min(5, 'Tytuł musi mieć co najmniej 5 znaków'),
  description: z.string().min(10, 'Opis musi mieć co najmniej 10 znaków'),
  type: z.enum(['PROBLEM', 'PURCHASE'], { message: 'Typ zgłoszenia jest wymagany.' }),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], { message: 'Priorytet jest wymagany.' }),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface TicketFormProps {
  onTicketCreated: () => void;
}

export function TicketForm({ onTicketCreated }: TicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit: SubmitHandler<TicketFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

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

      setSuccess('Zgłoszenie zostało pomyślnie utworzone!');
      reset();
      onTicketCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg">
      {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="p-2 bg-green-100 text-green-700 rounded">{success}</div>}

      <div>
        <label htmlFor="title" className="block text-sm font-medium">Tytuł</label>
        <input id="title" {...register('title')} className="w-full p-2 border rounded" />
        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">Opis</label>
        <textarea id="description" {...register('description')} rows={4} className="w-full p-2 border rounded" />
        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium">Typ zgłoszenia</label>
        <select id="type" {...register('type')} className="w-full p-2 border rounded bg-gray-800 text-white">
          <option value="" disabled>Wybierz typ</option>
          <option value="PROBLEM">Problem techniczny</option>
          <option value="PURCHASE">Zapotrzebowanie zakupowe</option>
        </select>
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium">Priorytet</label>
        <select id="priority" {...register('priority')} className="w-full p-2 border rounded bg-gray-800 text-white">
          <option value="" disabled>Wybierz priorytet</option>
          <option value="LOW">Niski</option>
          <option value="MEDIUM">Średni</option>
          <option value="HIGH">Wysoki</option>
          <option value="CRITICAL">Krytyczny</option>
        </select>
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400">
        {isSubmitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
      </button>
    </form>
  );
}
