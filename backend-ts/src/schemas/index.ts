import { z } from 'zod';

// Schemas de usuário
export const UserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  name: z.string().optional(),
});

export const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Schemas de board
export const BoardCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const BoardUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

// Schemas de task
export const TaskCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  position: z.number().int(),
  story_points: z.number().int().optional(),
  board_id: z.number().int(),
  column_id: z.number().int(),
});

export const TaskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  position: z.number().int().optional(),
  story_points: z.number().int().optional(),
  column_id: z.number().int().optional(),
  is_completed: z.boolean().optional(),
});

// Schemas de column
export const ColumnCreateSchema = z.object({
  name: z.string().min(1),
  position: z.number().int(),
  board_id: z.number().int(),
});

export const ColumnUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  position: z.number().int().optional(),
});

// Schemas de sprint
export const SprintCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  working_days: z.array(z.string()).optional(),
  board_id: z.number().int(),
});

export const SprintUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  working_days: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

// Tipos inferidos
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type BoardCreate = z.infer<typeof BoardCreateSchema>;
export type BoardUpdate = z.infer<typeof BoardUpdateSchema>;
export type TaskCreate = z.infer<typeof TaskCreateSchema>;
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;
export type ColumnCreate = z.infer<typeof ColumnCreateSchema>;
export type ColumnUpdate = z.infer<typeof ColumnUpdateSchema>;
export type SprintCreate = z.infer<typeof SprintCreateSchema>;
export type SprintUpdate = z.infer<typeof SprintUpdateSchema>;
