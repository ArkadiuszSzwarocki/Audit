import { z } from 'zod';

export const assignShiftSchema = z.object({
  userId: z.string().min(1, 'ID użytkownika jest wymagane'),
  workDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Nieprawidłowy format daty'),
  shiftType: z.enum(['SHIFT_1', 'SHIFT_2', 'SHIFT_3', 'DAY_OFF']),
});

export const generateScheduleSchema = z.object({
  userId: z.string().min(1, 'ID użytkownika jest wymagane'),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export const getScheduleSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Nieprawidłowy format daty'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Nieprawidłowy format daty'),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  { message: 'Data początkowa musi być wcześniejsza niż data końcowa', path: ['startDate'] }
);

export type AssignShiftInput = z.infer<typeof assignShiftSchema>;
export type GenerateScheduleInput = z.infer<typeof generateScheduleSchema>;
export type GetScheduleInput = z.infer<typeof getScheduleSchema>;
