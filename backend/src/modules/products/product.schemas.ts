import { z } from 'zod';

const productImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  alt: z.string().optional(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const dimensionsSchema = z.object({
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(200, 'Slug too long')
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    sku: z
      .string()
      .max(50)
      .regex(/^[A-Z0-9-]+$/)
      .optional(),
    description: z.string().min(1, 'Description is required'),
    shortDescription: z.string().max(300).optional(),
    categoryId: z.string().min(1, 'Category is required'),
    subcategoryId: z.string().optional(),
    brand: z.string().max(100).optional(),
    gender: z.enum(['MEN', 'WOMEN', 'UNISEX', 'KIDS']).optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(productImageSchema).optional(),
    basePrice: z.number().min(0, 'Price must be positive'),
    compareAtPrice: z.number().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    currency: z.string().length(3).default('KES'),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK']).default('DRAFT'),
    featured: z.boolean().optional(),
    isDigital: z.boolean().optional(),
    requiresShipping: z.boolean().optional(),
    weight: z.number().min(0).optional(),
    dimensions: dimensionsSchema.optional(),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    slug: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    sku: z
      .string()
      .max(50)
      .regex(/^[A-Z0-9-]+$/)
      .optional(),
    description: z.string().min(1).optional(),
    shortDescription: z.string().max(300).optional(),
    categoryId: z.string().optional(),
    subcategoryId: z.string().nullable().optional(),
    brand: z.string().max(100).optional(),
    gender: z.enum(['MEN', 'WOMEN', 'UNISEX', 'KIDS']).optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(productImageSchema).optional(),
    basePrice: z.number().min(0).optional(),
    compareAtPrice: z.number().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK']).optional(),
    featured: z.boolean().optional(),
    isDigital: z.boolean().optional(),
    requiresShipping: z.boolean().optional(),
    weight: z.number().min(0).optional(),
    dimensions: dimensionsSchema.optional(),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const productParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    categoryId: z.string().optional(),
    subcategoryId: z.string().optional(),
    brand: z.string().optional(),
    gender: z.enum(['MEN', 'WOMEN', 'UNISEX', 'KIDS']).optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK']).optional(),
    featured: z.coerce.boolean().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    tags: z.string().optional(),
    search: z.string().optional(),
    inStock: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['name', 'basePrice', 'createdAt', 'featured', 'popularity']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const variantAttributeSchema = z.object({
  name: z.string().min(1).max(50),
  value: z.string().min(1).max(100),
  displayName: z.string().max(100).optional(),
});

export const createVariantSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product is required'),
    sku: z
      .string()
      .min(1, 'SKU is required')
      .max(50)
      .regex(/^[A-Z0-9-]+$/, 'SKU must be uppercase alphanumeric with hyphens'),
    barcode: z.string().optional(),
    attributes: z.array(variantAttributeSchema).optional(),
    price: z.number().min(0, 'Price must be positive'),
    compareAtPrice: z.number().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    currency: z.string().length(3).default('KES'),
    stock: z.number().int().min(0).default(0),
    lowStockThreshold: z.number().int().min(0).default(5),
    trackInventory: z.boolean().default(true),
    allowBackorder: z.boolean().default(false),
    status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED']).default('ACTIVE'),
    weight: z.number().min(0).optional(),
    dimensions: dimensionsSchema.optional(),
    images: z.array(z.string().url()).optional(),
    sortOrder: z.number().int().min(0).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

export const updateVariantSchema = z.object({
  body: z.object({
    sku: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[A-Z0-9-]+$/)
      .optional(),
    barcode: z.string().optional(),
    attributes: z.array(variantAttributeSchema).optional(),
    price: z.number().min(0).optional(),
    compareAtPrice: z.number().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    stock: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    trackInventory: z.boolean().optional(),
    allowBackorder: z.boolean().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED']).optional(),
    weight: z.number().min(0).optional(),
    dimensions: dimensionsSchema.optional(),
    images: z.array(z.string().url()).optional(),
    sortOrder: z.number().int().min(0).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const variantParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const variantQuerySchema = z.object({
  query: z.object({
    productId: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED']).optional(),
    lowStock: z.coerce.boolean().optional(),
    outOfStock: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['sku', 'price', 'stock', 'createdAt']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ProductQueryInput = z.infer<typeof productQuerySchema>['query'];
export type CreateVariantInput = z.infer<typeof createVariantSchema>['body'];
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>['body'];
export type VariantQueryInput = z.infer<typeof variantQuerySchema>['query'];
