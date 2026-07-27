import { z } from 'zod';

export const createAuditSchema = z.object({
  title: z.string().min(3, 'Nazwa audytu musi mieć co najmniej 3 znaki'),
  auditTypeId: z.string().optional().nullable(),
  areaId: z.string().min(1, 'Wybierz obszar'),
  auditorId: z.string().optional().nullable(),
  machineId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateAuditInput = z.infer<typeof createAuditSchema>;
