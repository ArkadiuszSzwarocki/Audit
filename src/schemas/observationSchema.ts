import { z } from 'zod';

export const createObservationSchema = z.object({
  auditId: z.string().optional().nullable(),
  description: z.string().min(3, 'Opis obserwacji musi mieć co najmniej 3 znaki'),
  severityId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

export type CreateObservationInput = z.infer<typeof createObservationSchema>;
