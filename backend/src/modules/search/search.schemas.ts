import { z } from 'zod';

const sanitizeString = (val: string) => val.trim().replace(/[<>\"'&]/g, '');

const searchStringSchema = z.string().max(100).transform(sanitizeString);

const autocompleteStringSchema = z.string().min(3, 'Query must be at least 3 characters').max(100).transform(sanitizeString);

const suggestionsStringSchema = z.string().min(3, 'Query must be at least 3 characters').max(100).transform(sanitizeString);

export const searchSchema = z.object({
  query: z.object({
    q: searchStringSchema.optional(),
    categoryId: z.string().optional(),
    subcategoryId: z.string().optional(),
    brand: searchStringSchema.optional(),
    gender: z.enum(['MEN', 'WOMEN', 'UNISEX', 'KIDS']).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    tags: searchStringSchema.optional(),
    inStock: z.coerce.boolean().optional(),
    featured: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .enum([
        'relevance',
        'price_asc',
        'price_desc',
        'newest',
        'oldest',
        'popular',
        'name_asc',
        'name_desc',
      ])
      .default('relevance'),
  }),
});

export const autocompleteSchema = z.object({
  query: z.object({
    q: autocompleteStringSchema,
    limit: z.coerce.number().int().min(1).max(20).default(10),
  }),
});

export const suggestionsSchema = z.object({
  query: z.object({
    q: suggestionsStringSchema,
    limit: z.coerce.number().int().min(1).max(10).default(5),
  }),
});

export type SearchInput = z.infer<typeof searchSchema>['query'];
export type AutocompleteInput = z.infer<typeof autocompleteSchema>['query'];
export type SuggestionsInput = z.infer<typeof suggestionsSchema>['query'];
