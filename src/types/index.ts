import { z } from 'zod';

export const ZoneSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
});
export type Zone = z.infer<typeof ZoneSchema>;

export const ChecklistItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  isDone: z.boolean().default(false),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const ReflectionSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  content: z.string(),
});
export type Reflection = z.infer<typeof ReflectionSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.string().optional(), // For rich markdown notes, links, and embeds
  zoneId: z.string().uuid().optional(),
  isTarget: z.boolean().default(false), // Max 3 rolling active targets
  energyLevel: z.enum(['deep-work', 'light-work']).default('light-work'),
  estimatedMinutes: z.number().int().min(1).max(480).default(15),
  startDate: z.string().datetime().optional(), // The "Do" date
  dueDate: z.string().datetime().optional(),
  impact: z.enum(['high', 'medium', 'low']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  checklist: z.array(ChecklistItemSchema),
  completedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});
export type Task = z.infer<typeof TaskSchema>;
