import { z } from 'zod';

export const teamCreateSchema = z.object({
  name: z.string().min(1).max(20),
});

export const teamUpdateSchema = z.object({
  name: z.string().min(1).max(20).optional(),
});

export const teamMemberSchema = z.object({
  user_id: z.string().uuid(),
  team_id: z.string().uuid(),
  role: z.enum(['member', 'lead']),
}); 