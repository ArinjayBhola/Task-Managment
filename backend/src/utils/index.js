import { z } from "zod";

export const signupSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const taskSchema = z.object({
  id: z.number(),
  description: z.string(),
  dueDate: z.string(),
  status: z.string().optional(),
  comments: z.string().optional(),
});
