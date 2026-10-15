import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(100, 'Slug too long')
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    description: z.string().max(500, 'Description too long').optional(),
    parentId: z.string().optional(),
    image: z.string().url('Invalid image URL').optional(),
    icon: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    description: z.string().max(500).optional(),
    parentId: z.string().nullable().optional(),
    image: z.string().url().optional(),
    icon: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const categoryParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const categoryQuerySchema = z.object({
  query: z.object({
    parentId: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    level: z.coerce.number().int().min(0).max(5).optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['name', 'sortOrder', 'createdAt']).default('sortOrder'),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>['query'];
