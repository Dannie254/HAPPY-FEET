import { ProductModel } from '../products/product.model.js';
import { CategoryModel } from '../categories/category.model.js';
import {
  getCache,
  setCache,
  generateCacheKey,
  CacheTTL,
  invalidateSearchCache,
} from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import type { PipelineStage } from 'mongoose';

const MAX_QUERY_LENGTH = 100;
const SANITIZE_REGEX = /[<>\"'&]/g;

function sanitizeQuery(query: string): string {
  return query.trim().replace(SANITIZE_REGEX, '').slice(0, MAX_QUERY_LENGTH);
}

export interface SearchFilters {
  categoryId?: string;
  subcategoryId?: string;
  brand?: string;
  gender?: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS';
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  inStock?: boolean;
  featured?: boolean;
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFilters;
  page: number;
  limit: number;
  sort:
    | 'relevance'
    | 'price_asc'
    | 'price_desc'
    | 'newest'
    | 'oldest'
    | 'popular'
    | 'name_asc'
    | 'name_desc';
}

export interface SearchResult {
  products: Array<{
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
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets?: {
    brands: Array<{ value: string; count: number }>;
    genders: Array<{ value: string; count: number }>;
    priceRange: { min: number; max: number };
    categories: Array<{ value: string; count: number; label: string }>;
  };
}

export interface AutocompleteResult {
  suggestions: Array<{
    type: 'product' | 'category' | 'query';
    text: string;
    id?: string;
    slug?: string;
    image?: string;
  }>;
}

function buildMongoFilters(filters: SearchFilters): Record<string, unknown> {
  const mongoFilter: Record<string, unknown> = { status: 'ACTIVE' };

  if (filters.categoryId) mongoFilter.categoryId = filters.categoryId;
  if (filters.subcategoryId) mongoFilter.subcategoryId = filters.subcategoryId;
  if (filters.brand) mongoFilter.brand = filters.brand;
  if (filters.gender) mongoFilter.gender = filters.gender;
  if (filters.featured !== undefined) mongoFilter.featured = filters.featured;

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    mongoFilter.basePrice = {};
    if (filters.minPrice !== undefined)
      (mongoFilter.basePrice as Record<string, number>).$gte = filters.minPrice;
    if (filters.maxPrice !== undefined)
      (mongoFilter.basePrice as Record<string, number>).$lte = filters.maxPrice;
  }

  if (filters.tags && filters.tags.length > 0) {
    mongoFilter.tags = { $in: filters.tags };
  }

  return mongoFilter;
}

function buildSort(
  sort: SearchOptions['sort']
): Record<string, 1 | -1 | { $meta: 'textScore' | 'indexKey' }> {
  switch (sort) {
    case 'price_asc':
      return { basePrice: 1 };
    case 'price_desc':
      return { basePrice: -1 };
    case 'newest':
      return { createdAt: -1 };
    case 'oldest':
      return { createdAt: 1 };
    case 'popular':
      return { featured: -1, createdAt: -1 };
    case 'name_asc':
      return { name: 1 };
    case 'name_desc':
      return { name: -1 };
    case 'relevance':
    default:
      return { score: { $meta: 'textScore' } };
  }
}

export async function searchProducts(options: SearchOptions): Promise<SearchResult> {
  const { query, filters = {}, page = 1, limit = 20, sort = 'relevance' } = options;

  const sanitizedQuery = query ? sanitizeQuery(query) : '';
  const cacheKey = generateCacheKey('search', {
    query: sanitizedQuery,
    ...filters,
    page,
    limit,
    sort,
  });
  const cached = await getCache<SearchResult>(cacheKey);
  if (cached) return cached;

  const mongoFilter = buildMongoFilters(filters);
  const sortObj = buildSort(sort);

  let pipeline: PipelineStage[] = [];

  if (sanitizedQuery) {
    pipeline = [
      {
        $search: {
          index: 'products_text',
          text: {
            query: sanitizedQuery,
            path: ['name', 'description', 'tags', 'brand'],
            fuzzy: { maxEdits: 1, prefixLength: 2 },
          },
        },
      },
      { $match: mongoFilter },
      { $addFields: { score: { $meta: 'searchScore' } } },
    ];
  } else {
    pipeline = [{ $match: mongoFilter }];
  }

  if (filters.inStock) {
    pipeline.push({
      $lookup: {
        from: 'variants',
        localField: '_id',
        foreignField: 'productId',
        as: 'variants',
        pipeline: [
          { $match: { status: { $ne: 'DISCONTINUED' }, trackInventory: true } },
          { $addFields: { available: { $subtract: ['$stock', '$reservedStock'] } } },
          { $match: { available: { $gt: 0 } } },
        ],
      },
    });
    pipeline.push({ $match: { 'variants.0': { $exists: true } } });
  }

  pipeline.push(
    { $sort: sortObj },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $lookup: {
        from: 'variants',
        localField: '_id',
        foreignField: 'productId',
        as: 'variants',
        pipeline: [{ $match: { status: { $ne: 'DISCONTINUED' } } }, { $project: { price: 1 } }],
      },
    },
    {
      $addFields: {
        variantsCount: { $size: '$variants' },
        minVariantPrice: { $min: '$variants.price' },
        maxVariantPrice: { $max: '$variants.price' },
      },
    },
    {
      $project: {
        name: 1,
        slug: 1,
        sku: 1,
        shortDescription: 1,
        basePrice: 1,
        compareAtPrice: 1,
        currency: 1,
        images: 1,
        categoryId: 1,
        brand: 1,
        gender: 1,
        tags: 1,
        status: 1,
        featured: 1,
        variantsCount: 1,
        minVariantPrice: 1,
        maxVariantPrice: 1,
        score: 1,
      },
    }
  );

  const totalPipeline = [...pipeline];
  const skipIndex = totalPipeline.findIndex((p) => '$skip' in p);
  if (skipIndex !== -1) {
    totalPipeline.splice(skipIndex, 1);
  }
  const limitIndex = totalPipeline.findIndex((p) => '$limit' in p);
  if (limitIndex !== -1) {
    totalPipeline.splice(limitIndex, 1);
  }
  totalPipeline.push({ $count: 'total' });

  const [products, totalResult] = await Promise.all([
    ProductModel.aggregate(pipeline).exec(),
    ProductModel.aggregate(totalPipeline).exec(),
  ]);

  const total = totalResult[0]?.total || 0;

  const result: SearchResult = {
    products: products as SearchResult['products'],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  if (!query && (filters.categoryId || filters.brand)) {
    result.facets = await getFacets(mongoFilter);
  }

  await setCache(cacheKey, result, CacheTTL.SEARCH);
  return result;
}

async function getFacets(
  baseFilter: Record<string, unknown>
): Promise<SearchResult['facets'] | undefined> {
  const [brands, genders, priceRange, categories] = await Promise.all([
    ProductModel.aggregate([
      { $match: { ...baseFilter, status: 'ACTIVE' } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { value: '$_id', count: 1, _id: 0 } },
    ]),
    ProductModel.aggregate([
      { $match: { ...baseFilter, status: 'ACTIVE' } },
      { $group: { _id: '$gender', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
      { $project: { value: '$_id', count: 1, _id: 0 } },
    ]),
    ProductModel.aggregate([
      { $match: { ...baseFilter, status: 'ACTIVE' } },
      { $group: { _id: null, min: { $min: '$basePrice' }, max: { $max: '$basePrice' } } },
      { $project: { min: 1, max: 1, _id: 0 } },
    ]),
    CategoryModel.find({ isActive: true, level: { $lte: 2 } })
      .select('name slug')
      .lean()
      .then((cats) => cats.map((c) => ({ value: c.slug, label: c.name, count: 0 }))),
  ]);

  return {
    brands: brands as Array<{ value: string; count: number }>,
    genders: genders as Array<{ value: string; count: number }>,
    priceRange: priceRange[0] || { min: 0, max: 0 },
    categories: categories as Array<{ value: string; label: string; count: number }>,
  };
}

export async function autocomplete(query: string, limit = 10): Promise<AutocompleteResult> {
  if (!query || query.trim().length < 3) {
    return { suggestions: [] };
  }

  const sanitizedQuery = sanitizeQuery(query);
  if (!sanitizedQuery || sanitizedQuery.length < 3) {
    return { suggestions: [] };
  }

  const cacheKey = generateCacheKey('autocomplete', { query: sanitizedQuery, limit });
  const cached = await getCache<AutocompleteResult>(cacheKey);
  if (cached) return cached;

  const [products, categories] = await Promise.all([
    ProductModel.aggregate([
      {
        $search: {
          index: 'products_autocomplete',
          autocomplete: {
            query: sanitizedQuery,
            path: 'name',
            tokenOrder: 'any',
            fuzzy: { maxEdits: 1 },
          },
        },
      },
      { $match: { status: 'ACTIVE' } },
      { $limit: Math.ceil(limit / 2) },
      {
        $project: {
          text: '$name',
          type: { $literal: 'product' },
          id: '$_id',
          slug: 1,
          image: { $arrayElemAt: ['$images', 0] },
        },
      },
    ]),
    CategoryModel.aggregate([
      {
        $search: {
          index: 'categories_autocomplete',
          autocomplete: {
            query: sanitizedQuery,
            path: 'name',
            tokenOrder: 'any',
          },
        },
      },
      { $match: { isActive: true } },
      { $limit: Math.ceil(limit / 4) },
      {
        $project: {
          text: '$name',
          type: { $literal: 'category' },
          id: '$_id',
          slug: 1,
        },
      },
    ]),
  ]);

  const suggestions = [...products, ...categories].slice(0, limit);
  const result: AutocompleteResult = { suggestions };

  await setCache(cacheKey, result, CacheTTL.AUTOCOMPLETE);
  return result;
}

export async function getSearchSuggestions(query: string, limit = 5): Promise<string[]> {
  if (!query || query.trim().length < 3) return [];

  const sanitizedQuery = sanitizeQuery(query);
  if (!sanitizedQuery || sanitizedQuery.length < 3) return [];

  const cacheKey = generateCacheKey('suggestions', { query: sanitizedQuery, limit });
  const cached = await getCache<string[]>(cacheKey);
  if (cached) return cached;

  const products = await ProductModel.aggregate([
    {
      $search: {
        index: 'products_text',
        text: {
          query: sanitizedQuery,
          path: 'tags',
        },
      },
    },
    { $match: { status: 'ACTIVE' } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, suggestion: '$_id' } },
  ]);

  const suggestions = products.map((p) => p.suggestion);
  await setCache(cacheKey, suggestions, CacheTTL.AUTOCOMPLETE);
  return suggestions;
}

export async function invalidateSearchCaches(): Promise<void> {
  await invalidateSearchCache();
  logger.info('Search caches invalidated');
}
