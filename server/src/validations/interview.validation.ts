import { z } from 'zod';

export const startInterviewSchema = {
  body: z.object({
    role: z
      .string()
      .trim()
      .min(2, 'Role is required.')
      .max(80, 'Role is too long.'),
    level: z.enum(['junior', 'mid', 'senior']),
    questionCount: z.number().int().min(3).max(10),
  }),
};

export const submitInterviewSchema = {
  body: z.object({
    answers: z
      .array(z.string().trim().max(3000, 'Answer is too long.'))
      .min(1, 'At least one answer is required.'),
  }),
  params: z.object({
    interviewId: z.string().min(1),
  }),
};

export const interviewParamsSchema = {
  params: z.object({
    interviewId: z.string().min(1),
  }),
};
