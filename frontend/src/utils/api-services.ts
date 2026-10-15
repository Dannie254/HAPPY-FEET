import { api } from '../utils/api';
import type {
  Product,
  Category,
  SearchParams,
  PaginatedResponse,
  AutocompleteSuggestion,
} from '../types/api';

export const productApi = {
  getAll: (params?: SearchParams) => api.get<PaginatedResponse<Product>>('/products', params as Record<string, unknown>),

  getFeatured: (limit = 8) =>
    api.get<{ success: boolean; data: Product[] }>('/products/featured', { limit }),

  getById: (id: string, includeVariants = true) =>
    api.get<{ success: boolean; data: Product }>(`/products/${id}`, { variants: includeVariants }),

  getBySlug: (slug: string, includeVariants = true) =>
    api.get<{ success: boolean; data: Product }>(`/products/slug/${slug}`, {
      variants: includeVariants,
    }),

  getRelated: (id: string, limit = 4) =>
    api.get<{ success: boolean; data: Product[] }>(`/products/${id}/related`, { limit }),

  getVariants: (productId: string) =>
    api.get<{ success: boolean; data: Product[] }>(`/products/${productId}/variants`),
};

export const categoryApi = {
  getAll: (params?: {
    parentId?: string;
    isActive?: boolean;
    level?: number;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
  }) => api.get<PaginatedResponse<Category>>('/categories', params as Record<string, unknown>),

  getTree: () => api.get<{ success: boolean; data: Category[] }>('/categories/tree'),

  getById: (id: string) => api.get<{ success: boolean; data: Category }>(`/categories/${id}`),

  getBySlug: (slug: string) => api.get<{ success: boolean; data: Category }>(`/categories/${slug}`),

  getChildren: (id: string) =>
    api.get<{ success: boolean; data: Category[] }>(`/categories/${id}/children`),

  getPath: (id: string) =>
    api.get<{ success: boolean; data: Category[] }>(`/categories/${id}/path`),
};

export const searchApi = {
  search: (params: SearchParams) =>
    api.get<
      PaginatedResponse<{
        _id: string;
        name: string;
        slug: string;
        sku?: string;
        shortDescription?: string;
        basePrice: number;
        compareAtPrice?: number;
        currency: string;
        images: Array<{ url: string; alt?: string; isPrimary: boolean }>;
        categoryId: string;
        brand?: string;
        gender?: string;
        tags: string[];
        status: string;
        featured: boolean;
        variantsCount: number;
        minVariantPrice?: number;
        maxVariantPrice?: number;
        score?: number;
      }>
    >('/search', params as Record<string, unknown>),

  autocomplete: (q: string, limit = 10) =>
    api.get<{ success: boolean; data: { suggestions: AutocompleteSuggestion[] } }>(
      '/search/autocomplete',
      { q, limit }
    ),

  suggestions: (q: string, limit = 5) =>
    api.get<{ success: boolean; data: { suggestions: string[] } }>('/search/suggestions', {
      q,
      limit,
    }),
};
