import { z } from 'zod';

export const createBhpSchema = z.object({
  title: z.string().min(3, 'Tytuł musi mieć co najmniej 3 znaki'),
  description: z.string().min(5, 'Opis zagrożenia musi mieć co najmniej 5 znaków'),
  areaId: z.string().min(1, 'Wybierz obszar'),
  machineId: z.string().optional().nullable(),
  severity: z.string().optional().nullable(),
  reportedBy: z.string().min(2, 'Podaj zgłaszającego'),
  photoUrl: z.string().optional().nullable(),
  actionPlan: z.string().optional().nullable(),
});

export type CreateBhpInput = z.infer<typeof createBhpSchema>;
