import { z } from 'zod';

export const createKaizenSchema = z.object({
  title: z.string().min(3, 'Tytuł Kaizen musi mieć co najmniej 3 znaki'),
  description: z.string().min(5, 'Opis ulepszenia musi mieć co najmniej 5 znaków'),
  areaId: z.string().optional().nullable(),
  machineId: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  submittedBy: z.string().min(2, 'Podaj imię i nazwisko zgłaszającego'),
  expectedBenefit: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

export type CreateKaizenInput = z.infer<typeof createKaizenSchema>;
