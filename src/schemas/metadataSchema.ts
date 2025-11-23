import { z } from 'zod';

export const metadataSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .refine((val) => val.length > 0, 'Name cannot be empty'),
  description: z
    .union([z.string().max(500, 'Description must be less than 500 characters'), z.literal('')])
    .transform((val) => (val === '' ? undefined : val.trim()))
    .optional(),
});

export type MetadataFormData = z.infer<typeof metadataSchema>;
