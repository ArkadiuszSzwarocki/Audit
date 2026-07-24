import { z } from 'zod';

export const createFaultReportSchema = z.object({
  title: z.string().min(3, 'Tytuł usterki musi mieć co najmniej 3 znaki'),
  description: z.string().min(5, 'Opis usterki musi mieć co najmniej 5 znaków'),
  areaId: z.string().min(1, 'Wybierz obszar'),
  machineId: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  reportedBy: z.string().min(2, 'Podaj imię zgłaszającego'),
});

export type CreateFaultReportInput = z.infer<typeof createFaultReportSchema>;
