import axios, { AxiosResponse } from 'axios';
import type { Product } from '../types/api';

function handleResponse<T>(response: AxiosResponse<T>) {
  return response.data;
}

export const productApi = {
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    sort?: string; 
    order?: 'asc' | 'desc';
    categoryId?: string;
    subcategoryId?: string;
    brand?: string;
    gender?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string;
    search?: string;
    inStock?: boolean;
  }) => {
    const response = await axios.get<Product[]>('/products', { params });
    return handleResponse(response);
  },

  getFeatured: async (limit: number) => {
    const response = await axios.get<Product[]>(`/products/featured`, { params: { limit } });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await axios.get<Product>(`/products/${id}`);
    return handleResponse(response);
  },

  getBySlug: async (slug: string) => {
    const response = await axios.get<Product>(`/products/slug/${slug}`);
    return handleResponse(response);
  },

  getRelated: async (id: string, limit = 4) => {
    const response = await axios.get<Product[]>(`/products/${id}/related`, { params: { limit } });
    return handleResponse(response);
  },

  getVariants: async (productId: string) => {
    const response = await axios.get<any[]>(`/products/${productId}/variants`);
    return handleResponse(response);
  },
};

export const categoryApi = {
  getAll: async (params?: { 
    parentId?: string; 
    isActive?: boolean; 
    level?: number; 
    search?: string; 
    page?: number; 
    limit?: number; 
    sort?: string; 
    order?: 'asc' | 'desc' 
  }) => {
    const response = await axios.get<any[]>(`/categories`, { params });
    return handleResponse(response);
  },

  getTree: async () => {
    const response = await axios.get<any[]>(`/categories/tree`);
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await axios.get<any>(`/categories/${id}`);
    return handleResponse(response);
  },

  getBySlug: async (slug: string) => {
    const response = await axios.get<any>(`/categories/slug/${slug}`);
    return handleResponse(response);
  },

  getChildren: async (id: string) => {
    const response = await axios.get<any[]>(`/categories/${id}/children`);
    return handleResponse(response);
  },

  getPath: async (id: string) => {
    const response = await axios.get<any[]>(`/categories/${id}/path`);
    return handleResponse(response);
  },
};

export const searchApi = {
  search: async (params: {
    q?: string;
    categoryId?: string;
    subcategoryId?: string;
    brand?: string;
    gender?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string;
    inStock?: boolean;
    featured?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) => {
    const response = await axios.get<any>('/search', { params });
    return handleResponse(response);
  },

  autocomplete: async (q: string, limit = 10) => {
    const response = await axios.get<{ suggestions: { type: 'product' | 'category' | 'query'; text: string; id?: string; slug?: string; image?: string }[] }>(`/search/autocomplete`, { params: { q, limit } });
    return handleResponse(response);
  },

  suggestions: async (q: string, limit = 5) => {
    const response = await axios.get<{ suggestions: string[] }>(`/search/suggestions`, { params: { q, limit } });
    return handleResponse(response);
  },
};