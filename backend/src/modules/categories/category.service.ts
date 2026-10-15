import type { CategoryDocument } from './category.model.js';
import { CategoryModel } from './category.model.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { invalidateCategoryCache } from '../../config/redis.js';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQueryInput,
} from './category.schemas.js';

export async function createCategory(input: CreateCategoryInput): Promise<CategoryDocument> {
  const existing = await CategoryModel.findOne({ slug: input.slug });
  if (existing) {
    throw AppError.conflict('Category with this slug already exists');
  }

  if (input.parentId) {
    const parent = await CategoryModel.findById(input.parentId);
    if (!parent) {
      throw AppError.notFound('Parent category not found');
    }
    if (parent.level >= 5) {
      throw AppError.badRequest('Maximum category depth (5 levels) exceeded');
    }
  }

  const category = await CategoryModel.create(input);

  await invalidateCategoryCache();

  logger.info({ categoryId: category._id, slug: category.slug }, 'Category created');

  return category;
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<CategoryDocument | null> {
  if (input.slug) {
    const existing = await CategoryModel.findOne({ slug: input.slug, _id: { $ne: id } });
    if (existing) {
      throw AppError.conflict('Category with this slug already exists');
    }
  }

  if (input.parentId) {
    if (input.parentId === id) {
      throw AppError.badRequest('Category cannot be its own parent');
    }
    const parent = await CategoryModel.findById(input.parentId);
    if (!parent) {
      throw AppError.notFound('Parent category not found');
    }
    if (parent.level >= 5) {
      throw AppError.badRequest('Maximum category depth (5 levels) exceeded');
    }
    const descendants = await CategoryModel.find({ path: new RegExp(`^${id}/`) });
    if (
      descendants.length > 0 &&
      parent.level + 1 + Math.max(...descendants.map((d) => d.level)) > 5
    ) {
      throw AppError.badRequest('Moving this category would exceed maximum depth');
    }
  }

  const category = await CategoryModel.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  });

  if (category) {
    await invalidateCategoryCache();
    logger.info({ categoryId: category._id }, 'Category updated');
  }

  return category;
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await CategoryModel.findById(id);
  if (!category) {
    throw AppError.notFound('Category not found');
  }

  const childrenCount = await CategoryModel.countDocuments({ parentId: id });
  if (childrenCount > 0) {
    throw AppError.badRequest(
      'Cannot delete category with subcategories. Delete or move subcategories first.'
    );
  }

  const productCount = await (
    await import('../products/product.model.js')
  ).ProductModel.countDocuments({ categoryId: id });
  if (productCount > 0) {
    throw AppError.badRequest('Cannot delete category with associated products');
  }

  await category.deleteOne();
  await invalidateCategoryCache();
  logger.info({ categoryId: id }, 'Category deleted');
}

export async function getCategoryById(id: string): Promise<CategoryDocument | null> {
  return CategoryModel.findById(id);
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDocument | null> {
  return CategoryModel.findOne({ slug });
}

export async function getCategoryTree(): Promise<CategoryDocument[]> {
  const categories = await CategoryModel.find({ isActive: true }).sort({ path: 1 }).lean();
  return buildCategoryTree(categories as unknown as CategoryDocument[]);
}

export async function getCategories(query: Record<string, unknown>): Promise<{
  categories: CategoryDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const {
    page = 1,
    limit = 20,
    sort = 'sortOrder',
    order = 'asc',
    ...filters
  } = query as CategoryQueryInput;

  const filter: Record<string, unknown> = {};

  if (filters.parentId) filter.parentId = filters.parentId;
  if (filters.isActive !== undefined) filter.isActive = filters.isActive;
  if (filters.level !== undefined) filter.level = filters.level;
  if (filters.search) {
    filter.$text = { $search: filters.search };
  }

  const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

  const [categories, total] = await Promise.all([
    CategoryModel.find(filter)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CategoryModel.countDocuments(filter),
  ]);

  return {
    categories: categories as unknown as CategoryDocument[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getCategoryChildren(parentId: string): Promise<CategoryDocument[]> {
  return CategoryModel.find({ parentId, isActive: true }).sort({ sortOrder: 1, name: 1 });
}

export async function getCategoryPath(categoryId: string): Promise<CategoryDocument[]> {
  const category = await CategoryModel.findById(categoryId);
  if (!category) return [];

  const pathParts = category.path.split('/');
  const slugs = pathParts.slice(0, -1);

  const ancestors = await CategoryModel.find({ slug: { $in: slugs } }).sort({ level: 1 });

  return [...ancestors, category];
}

function buildCategoryTree(categories: CategoryDocument[]): CategoryDocument[] {
  const map = new Map<string, CategoryDocument & { children?: CategoryDocument[] }>();

  categories.forEach((cat) => {
    const catWithChildren = { ...cat, children: [] } as unknown as CategoryDocument & {
      children?: CategoryDocument[];
    };
    map.set(cat._id.toString(), catWithChildren);
  });

  const roots: CategoryDocument[] = [];

  categories.forEach((cat) => {
    const catWithChildren = map.get(cat._id.toString())!;
    if (cat.parentId) {
      const parent = map.get(cat.parentId.toString());
      if (parent) {
        parent.children!.push(catWithChildren);
      } else {
        roots.push(catWithChildren);
      }
    } else {
      roots.push(catWithChildren);
    }
  });

  return roots;
}
