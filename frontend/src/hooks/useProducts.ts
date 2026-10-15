import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { productApi, categoryApi, searchApi } from './api-services';
import type { SearchParams } from '../types/api';

export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (params?: SearchParams) => ['products', 'list', params] as const,
    featured: (limit: number) => ['products', 'featured', limit] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    slug: (slug: string) => ['products', 'slug', slug] as const,
    related: (id: string, limit: number) => ['products', 'related', id, limit] as const,
    variants: (productId: string) => ['products', 'variants', productId] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (params?: SearchParams) => ['categories', 'list', params] as const,
    tree: () => ['categories', 'tree'] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
    slug: (slug: string) => ['categories', 'slug', slug] as const,
    children: (id: string) => ['categories', 'children', id] as const,
    path: (id: string) => ['categories', 'path', id] as const,
  },
  search: {
    all: ['search'] as const,
    results: (params: SearchParams) => ['search', 'results', params] as const,
    autocomplete: (q: string, limit: number) => ['search', 'autocomplete', q, limit] as const,
    suggestions: (q: string, limit: number) => ['search', 'suggestions', q, limit] as const,
  },
};

export function useProducts(
  params?: SearchParams
) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productApi.getAll(params).then((res: any) => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedProducts(
  limit = 8
) {
  return useQuery({
    queryKey: queryKeys.products.featured(limit),
    queryFn: () => productApi.getFeatured(limit).then((res: any) => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(
  id: string
) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productApi.getById(id).then((res: any) => res.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductBySlug(
  slug: string
) {
  return useQuery({
    queryKey: queryKeys.products.slug(slug),
    queryFn: () => productApi.getBySlug(slug).then((res: any) => res.data),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRelatedProducts(
  id: string,
  limit = 4
) {
  return useQuery({
    queryKey: queryKeys.products.related(id, limit),
    queryFn: () => productApi.getRelated(id, limit).then((res: any) => res.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductVariants(
  productId: string
) {
  return useQuery({
    queryKey: queryKeys.products.variants(productId),
    queryFn: () => productApi.getVariants(productId).then((res: any) => res.data),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories(
  params?: SearchParams
) {
  return useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => categoryApi.getAll(params).then((res: any) => res.data),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCategoryTree() {
  return useQuery({
    queryKey: queryKeys.categories.tree(),
    queryFn: () => categoryApi.getTree().then((res: any) => res.data),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCategory(
  id: string
) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoryApi.getById(id).then((res: any) => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCategoryBySlug(
  slug: string
) {
  return useQuery({
    queryKey: queryKeys.categories.slug(slug),
    queryFn: () => categoryApi.getBySlug(slug).then((res: any) => res.data),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCategoryChildren(
  id: string
) {
  return useQuery({
    queryKey: queryKeys.categories.children(id),
    queryFn: () => categoryApi.getChildren(id).then((res: any) => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCategoryPath(
  id: string
) {
  return useQuery({
    queryKey: queryKeys.categories.path(id),
    queryFn: () => categoryApi.getPath(id).then((res: any) => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useSearch(
  params: SearchParams
) {
  return useQuery({
    queryKey: queryKeys.search.results(params),
    queryFn: () => searchApi.search(params),
    enabled: !!params.q || !!params.categoryId || !!params.brand,
    staleTime: 3 * 60 * 1000,
  });
}

export function useAutocomplete(
  q: string,
  limit = 10
) {
  return useQuery({
    queryKey: queryKeys.search.autocomplete(q, limit),
    queryFn: () => searchApi.autocomplete(q, limit).then((res: any) => res.data),
    enabled: q.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearchSuggestions(
  q: string,
  limit = 5
) {
  return useQuery({
    queryKey: queryKeys.search.suggestions(q, limit),
    queryFn: () => searchApi.suggestions(q, limit).then((res: any) => res.data),
    enabled: q.length >= 3,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInfiniteProducts(params?: Omit<SearchParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await productApi.getAll({ ...params, page: pageParam });
      return response;
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });
}