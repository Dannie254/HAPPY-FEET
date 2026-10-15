import type { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { successResponse, paginatedResponse } from '../../utils/api-response.js';
import * as productService from './product.service.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
  productParamsSchema,
  productQuerySchema,
  createVariantSchema,
  updateVariantSchema,
  variantParamsSchema,
  variantQuerySchema,
} from './product.schemas.js';
import { AppError } from '../../utils/errors.js';
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware.js';
import { UserRole } from '../../shared/types.js';

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json(successResponse({ product }));
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { products, total, page, limit } = await productService.getProducts(req.query);
  res.json(paginatedResponse(products, page, limit, total));
});

export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
  const products = await productService.getFeaturedProducts(limit);
  res.json(successResponse({ products }));
});

export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
  const products = await productService.getRelatedProducts(req.params.id, limit);
  res.json(successResponse({ products }));
});

export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const { q, page = 1, limit = 20, ...filters } = req.query;

  if (!q || typeof q !== 'string') {
    throw AppError.badRequest('Search query (q) is required');
  }

  const { products, total } = await productService.searchProducts(
    q,
    filters,
    parseInt(page as string),
    parseInt(limit as string)
  );
  res.json(paginatedResponse(products, parseInt(page as string), parseInt(limit as string), total));
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const includeVariants = req.query.variants === 'true';
  const product = await productService.getProductById(req.params.id, includeVariants);
  if (!product) {
    throw AppError.notFound('Product not found');
  }
  res.json(successResponse({ product }));
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const includeVariants = req.query.variants === 'true';
  const product = await productService.getProductBySlug(req.params.slug, includeVariants);
  if (!product) {
    throw AppError.notFound('Product not found');
  }
  res.json(successResponse({ product }));
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  if (!product) {
    throw AppError.notFound('Product not found');
  }
  res.json(successResponse({ product }));
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productService.deleteProduct(req.params.id);
  res.json(successResponse({ message: 'Product deleted successfully' }));
});

export const createVariant = asyncHandler(async (req: Request, res: Response) => {
  const variant = await productService.createVariant(req.body);
  res.status(201).json(successResponse({ variant }));
});

export const getVariants = asyncHandler(async (req: Request, res: Response) => {
  const { variants, total, page, limit } = await productService.getVariants(req.query);
  res.json(paginatedResponse(variants, page, limit, total));
});

export const getVariantsByProduct = asyncHandler(async (req: Request, res: Response) => {
  const variants = await productService.getVariantsByProduct(req.params.id, req.query);
  res.json(successResponse({ variants }));
});

export const getVariantById = asyncHandler(async (req: Request, res: Response) => {
  const variant = await productService.getVariantById(req.params.id);
  if (!variant) {
    throw AppError.notFound('Variant not found');
  }
  res.json(successResponse({ variant }));
});

export const getVariantBySku = asyncHandler(async (req: Request, res: Response) => {
  const variant = await productService.getVariantBySku(req.params.sku);
  if (!variant) {
    throw AppError.notFound('Variant not found');
  }
  res.json(successResponse({ variant }));
});

export const updateVariant = asyncHandler(async (req: Request, res: Response) => {
  const variant = await productService.updateVariant(req.params.id, req.body);
  if (!variant) {
    throw AppError.notFound('Variant not found');
  }
  res.json(successResponse({ variant }));
});

export const deleteVariant = asyncHandler(async (req: Request, res: Response) => {
  await productService.deleteVariant(req.params.id);
  res.json(successResponse({ message: 'Variant deleted successfully' }));
});

export const productRoutes = (router: Router) => {
  router.get('/', validate(productQuerySchema), getProducts);
  router.get('/featured', getFeaturedProducts);
  router.get('/search', searchProducts);
  router.get('/:id/related', validate(productParamsSchema), getRelatedProducts);
  router.get('/:id', validate(productParamsSchema), getProductById);
  router.get('/slug/:slug', getProductBySlug);

  router.post(
    '/',
    requireAuth,
    requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validate(createProductSchema),
    createProduct
  );
  router.patch(
    '/:id',
    requireAuth,
    requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validate(updateProductSchema),
    updateProduct
  );
  router.delete(
    '/:id',
    requireAuth,
    requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validate(productParamsSchema),
    deleteProduct
  );

  router.get('/:id/variants', validate(variantQuerySchema), getVariantsByProduct);
  router.post(
    '/:id/variants',
    requireAuth,
    requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validate(createVariantSchema),
    createVariant
  );
  router.get('/variants', validate(variantQuerySchema), getVariants);
  router.get('/variants/sku/:sku', getVariantBySku);
  router.get('/variants/:id', validate(variantParamsSchema), getVariantById);
  router.patch(
    '/variants/:id',
    requireAuth,
    requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validate(updateVariantSchema),
    updateVariant
  );
  router.delete(
    '/variants/:id',
    requireAuth,
    requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validate(variantParamsSchema),
    deleteVariant
  );
};
