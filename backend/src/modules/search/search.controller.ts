import type { Request, Response, Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { successResponse, paginatedResponse } from '../../utils/api-response.js';
import * as searchService from './search.service.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { searchSchema, autocompleteSchema, suggestionsSchema } from './search.schemas.js';
import { AppError } from '../../utils/errors.js';
import type { SearchOptions, SearchFilters } from './search.service.js';

export const search = asyncHandler(async (req: Request, res: Response) => {
  const {
    q,
    categoryId,
    subcategoryId,
    brand,
    gender,
    minPrice,
    maxPrice,
    tags,
    inStock,
    featured,
    page = '1',
    limit = '20',
    sort = 'relevance',
  } = req.query as Record<string, string>;

  const result = await searchService.searchProducts({
    query: q,
    filters: {
      categoryId,
      subcategoryId,
      brand,
      gender: gender as SearchFilters['gender'],
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      tags: tags ? tags.split(',') : undefined,
      inStock: inStock === 'true',
      featured: featured === 'true',
    },
    page: parseInt(page),
    limit: parseInt(limit),
    sort: sort as SearchOptions['sort'],
  });
  res.json(paginatedResponse(result.products, result.page, result.limit, result.total));
});

export const autocomplete = asyncHandler(async (req: Request, res: Response) => {
  const { q, limit } = req.query as { q: string; limit?: string };
  if (!q || q.length < 2) {
    throw AppError.badRequest('Query must be at least 2 characters');
  }
  const result = await searchService.autocomplete(q, limit ? parseInt(limit) : 10);
  res.json(successResponse(result));
});

export const suggestions = asyncHandler(async (req: Request, res: Response) => {
  const { q, limit } = req.query as { q: string; limit?: string };
  if (!q || q.length < 3) {
    throw AppError.badRequest('Query must be at least 3 characters');
  }
  const result = await searchService.getSearchSuggestions(q, limit ? parseInt(limit) : 5);
  res.json(successResponse({ suggestions: result }));
});

export const searchRoutes = (router: Router) => {
  router.get('/', validate(searchSchema), search);
  router.get('/autocomplete', validate(autocompleteSchema), autocomplete);
  router.get('/suggestions', validate(suggestionsSchema), suggestions);
};
