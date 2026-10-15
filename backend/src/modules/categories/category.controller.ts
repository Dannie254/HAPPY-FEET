import type { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { successResponse, paginatedResponse } from '../../utils/api-response.js';
import * as categoryService from './category.service.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema,
  categoryQuerySchema,
} from './category.schemas.js';
import { AppError } from '../../utils/errors.js';
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware.js';
import { UserRole } from '../../shared/types.js';

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json(successResponse({ category }));
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const { categories, total, page, limit } = await categoryService.getCategories(req.query);
  res.json(paginatedResponse(categories, page, limit, total));
});

export const getCategoryTree = asyncHandler(async (req: Request, res: Response) => {
  const tree = await categoryService.getCategoryTree();
  res.json(successResponse({ categories: tree }));
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryById(req.params.id);
  if (!category) {
    throw AppError.notFound('Category not found');
  }
  res.json(successResponse({ category }));
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  if (!category) {
    throw AppError.notFound('Category not found');
  }
  res.json(successResponse({ category }));
});

export const getCategoryChildren = asyncHandler(async (req: Request, res: Response) => {
  const children = await categoryService.getCategoryChildren(req.params.id);
  res.json(successResponse({ categories: children }));
});

export const getCategoryPath = asyncHandler(async (req: Request, res: Response) => {
  const path = await categoryService.getCategoryPath(req.params.id);
  res.json(successResponse({ categories: path }));
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  if (!category) {
    throw AppError.notFound('Category not found');
  }
  res.json(successResponse({ category }));
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.deleteCategory(req.params.id);
  res.json(successResponse({ message: 'Category deleted successfully' }));
});

export const categoryRoutes = (router: Router) => {
  router.get('/', validate(categoryQuerySchema), getCategories);
  router.get('/tree', getCategoryTree);
  router.get('/:slug', getCategoryBySlug);
  router.get('/:id', validate(categoryParamsSchema), getCategoryById);
  router.get('/:id/children', validate(categoryParamsSchema), getCategoryChildren);
  router.get('/:id/path', validate(categoryParamsSchema), getCategoryPath);

  router.post(
    '/',
    requireAuth,
    requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validate(createCategorySchema),
    createCategory
  );
  router.patch(
    '/:id',
    requireAuth,
    requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validate(updateCategorySchema),
    updateCategory
  );
  router.delete(
    '/:id',
    requireAuth,
    requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validate(categoryParamsSchema),
    deleteCategory
  );
};
