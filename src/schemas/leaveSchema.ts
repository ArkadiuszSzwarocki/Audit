import { z } from 'zod';

export const createLeaveRequestSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Nieprawidłowy format daty'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Nieprawidłowy format daty'),
  type: z.enum(['VACATION', 'SICK_LEAVE', 'ON_DEMAND', 'UNPAID', 'SPECIAL']),
  reason: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  { message: 'Data początkowa musi być wcześniejsza niż data końcowa', path: ['startDate'] }
);

export const updateLeaveRequestStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

export const createLeaveBalanceSchema = z.object({
  userId: z.string().min(1, 'ID użytkownika jest wymagane'),
  year: z.number().int().min(2000).max(2100),
  totalDays: z.number().positive('Liczba dni musi być dodatnia'),
});

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type UpdateLeaveRequestStatusInput = z.infer<typeof updateLeaveRequestStatusSchema>;
export type CreateLeaveBalanceInput = z.infer<typeof createLeaveBalanceSchema>;
