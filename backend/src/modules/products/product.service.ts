import type { ProductDocument } from './product.model.js';
import { ProductModel } from './product.model.js';
import type { VariantDocument } from './variant.model.js';
import { VariantModel } from './variant.model.js';
import { CategoryModel } from '../categories/category.model.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { invalidateProductCache } from '../../config/redis.js';
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
  CreateVariantInput,
  UpdateVariantInput,
  VariantQueryInput,
} from './product.schemas.js';
import type { SortOrder } from 'mongoose';

export async function createProduct(input: CreateProductInput): Promise<ProductDocument> {
  const category = await CategoryModel.findById(input.categoryId);
  if (!category) {
    throw AppError.notFound('Category not found');
  }

  if (input.subcategoryId) {
    const subcategory = await CategoryModel.findById(input.subcategoryId);
    if (!subcategory || subcategory.parentId?.toString() !== input.categoryId) {
      throw AppError.badRequest('Invalid subcategory for the selected category');
    }
  }

  if (input.sku) {
    const existing = await ProductModel.findOne({ sku: input.sku.toUpperCase() });
    if (existing) {
      throw AppError.conflict('Product with this SKU already exists');
    }
  }

  const existingSlug = await ProductModel.findOne({ slug: input.slug });
  if (existingSlug) {
    throw AppError.conflict('Product with this slug already exists');
  }

  const product = await ProductModel.create({
    ...input,
    sku: input.sku?.toUpperCase(),
  });

  await invalidateProductCache();
  logger.info({ productId: product._id, slug: product.slug }, 'Product created');

  return product;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<ProductDocument | null> {
  if (input.slug) {
    const existing = await ProductModel.findOne({ slug: input.slug, _id: { $ne: id } });
    if (existing) {
      throw AppError.conflict('Product with this slug already exists');
    }
  }

  if (input.sku) {
    const existing = await ProductModel.findOne({ sku: input.sku.toUpperCase(), _id: { $ne: id } });
    if (existing) {
      throw AppError.conflict('Product with this SKU already exists');
    }
  }

  if (input.categoryId) {
    const category = await CategoryModel.findById(input.categoryId);
    if (!category) {
      throw AppError.notFound('Category not found');
    }
  }

  if (input.subcategoryId) {
    const subcategory = await CategoryModel.findById(input.subcategoryId);
    if (!subcategory || subcategory.parentId?.toString() !== input.categoryId) {
      throw AppError.badRequest('Invalid subcategory for the selected category');
    }
  }

  const product = await ProductModel.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  });

  if (product) {
    await invalidateProductCache(product._id.toString());
    logger.info({ productId: product._id }, 'Product updated');
  }

  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  const product = await ProductModel.findById(id);
  if (!product) {
    throw AppError.notFound('Product not found');
  }

  await VariantModel.deleteMany({ productId: id });
  await product.deleteOne();
  await invalidateProductCache(id);
  logger.info({ productId: id }, 'Product deleted');
}

export async function getProductById(
  id: string,
  populateVariants = false
): Promise<ProductDocument | null> {
  let query = ProductModel.findById(id);
  if (populateVariants) {
    query = query.populate({
      path: 'variants',
      match: { status: { $ne: 'DISCONTINUED' } },
      options: { sort: { sortOrder: 1 } },
    });
  }
  return query;
}

export async function getProductBySlug(
  slug: string,
  populateVariants = false
): Promise<ProductDocument | null> {
  let query = ProductModel.findOne({ slug });
  if (populateVariants) {
    query = query.populate({
      path: 'variants',
      match: { status: { $ne: 'DISCONTINUED' } },
      options: { sort: { sortOrder: 1 } },
    });
  }
  return query;
}

export async function getProducts(query: Record<string, unknown>): Promise<{
  products: ProductDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt',
    order = 'desc',
    ...filters
  } = query as ProductQueryInput;

  const filter: Record<string, unknown> = {};

  if (filters.categoryId) filter.categoryId = filters.categoryId;
  if (filters.subcategoryId) filter.subcategoryId = filters.subcategoryId;
  if (filters.brand) filter.brand = filters.brand;
  if (filters.gender) filter.gender = filters.gender;
  if (filters.status) filter.status = filters.status;
  if (filters.featured !== undefined) filter.featured = filters.featured;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    filter.basePrice = {};
    if (filters.minPrice !== undefined)
      (filter.basePrice as Record<string, number>).$gte = filters.minPrice;
    if (filters.maxPrice !== undefined)
      (filter.basePrice as Record<string, number>).$lte = filters.maxPrice;
  }
  if (filters.tags) {
    filter.tags = { $in: filters.tags.split(',').map((t) => t.trim()) };
  }
  if (filters.search) {
    filter.$text = { $search: filters.search };
  }

  const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

  const [products, total] = await Promise.all([
    ProductModel.find(filter)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);

  return {
    products: products as unknown as ProductDocument[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getFeaturedProducts(limit = 8): Promise<ProductDocument[]> {
  return ProductModel.find({
    status: 'ACTIVE',
    featured: true,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({
      path: 'variants',
      match: { status: { $ne: 'DISCONTINUED' } },
      options: { sort: { sortOrder: 1 }, limit: 1 },
    });
}

export async function getRelatedProducts(productId: string, limit = 4): Promise<ProductDocument[]> {
  const product = await ProductModel.findById(productId);
  if (!product) return [];

  return ProductModel.find({
    _id: { $ne: productId },
    categoryId: product.categoryId,
    status: 'ACTIVE',
  })
    .sort({ featured: -1, createdAt: -1 })
    .limit(limit)
    .populate({
      path: 'variants',
      match: { status: { $ne: 'DISCONTINUED' } },
      options: { sort: { sortOrder: 1 }, limit: 1 },
    });
}

export async function searchProducts(
  searchTerm: string,
  filters: Partial<ProductQueryInput> = {},
  page = 1,
  limit = 20
): Promise<{
  products: ProductDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const filter: Record<string, unknown> = {
    $text: { $search: searchTerm },
    status: 'ACTIVE',
  };

  if (filters.categoryId) filter.categoryId = filters.categoryId;
  if (filters.brand) filter.brand = filters.brand;
  if (filters.gender) filter.gender = filters.gender;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    filter.basePrice = {};
    if (filters.minPrice !== undefined)
      (filter.basePrice as Record<string, number>).$gte = filters.minPrice;
    if (filters.maxPrice !== undefined)
      (filter.basePrice as Record<string, number>).$lte = filters.maxPrice;
  }

  const sortObj: Record<string, SortOrder | { $meta: string }> = {
    score: { $meta: 'textScore' },
    featured: -1 as SortOrder,
    createdAt: -1 as SortOrder,
  };

  const [products, total] = await Promise.all([
    ProductModel.find(filter, { score: { $meta: 'textScore' } })
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);

  return {
    products: products as unknown as ProductDocument[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createVariant(input: CreateVariantInput): Promise<VariantDocument> {
  const product = await ProductModel.findById(input.productId);
  if (!product) {
    throw AppError.notFound('Product not found');
  }

  const existingSku = await VariantModel.findOne({ sku: input.sku.toUpperCase() });
  if (existingSku) {
    throw AppError.conflict('Variant with this SKU already exists');
  }

  const variant = await VariantModel.create({
    ...input,
    sku: input.sku.toUpperCase(),
  });

  await invalidateProductCache(input.productId);
  logger.info(
    { variantId: variant._id, sku: variant.sku, productId: input.productId },
    'Variant created'
  );

  return variant;
}

export async function updateVariant(
  id: string,
  input: UpdateVariantInput
): Promise<VariantDocument | null> {
  if (input.sku) {
    const existing = await VariantModel.findOne({ sku: input.sku.toUpperCase(), _id: { $ne: id } });
    if (existing) {
      throw AppError.conflict('Variant with this SKU already exists');
    }
  }

  const variant = await VariantModel.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  });

  if (variant) {
    await invalidateProductCache(variant.productId.toString());
    logger.info({ variantId: variant._id }, 'Variant updated');
  }

  return variant;
}

export async function deleteVariant(id: string): Promise<void> {
  const variant = await VariantModel.findById(id);
  if (!variant) {
    throw AppError.notFound('Variant not found');
  }

  const productId = variant.productId.toString();
  await variant.deleteOne();
  await invalidateProductCache(productId);
  logger.info({ variantId: id }, 'Variant deleted');
}

export async function getVariantById(id: string): Promise<VariantDocument | null> {
  return VariantModel.findById(id);
}

export async function getVariantBySku(sku: string): Promise<VariantDocument | null> {
  return VariantModel.findOne({ sku: sku.toUpperCase() });
}

export async function getVariantsByProduct(
  productId: string,
  query?: Record<string, unknown>
): Promise<VariantDocument[]> {
  const filter: Record<string, unknown> = { productId };

  const q = query as VariantQueryInput | undefined;

  if (q?.status) filter.status = q.status;
  if (q?.lowStock)
    filter.$expr = { $lte: [{ $subtract: ['$stock', '$reservedStock'] }, '$lowStockThreshold'] };
  if (q?.outOfStock) filter.$expr = { $lte: [{ $subtract: ['$stock', '$reservedStock'] }, 0] };

  const sort = q?.sort || 'sortOrder';
  const order = q?.order || 'asc';
  const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

  return VariantModel.find(filter).sort(sortObj);
}

export async function getVariants(query: Record<string, unknown>): Promise<{
  variants: VariantDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt',
    order = 'desc',
    ...filters
  } = query as VariantQueryInput;

  const filter: Record<string, unknown> = {};

  if (filters.productId) filter.productId = filters.productId;
  if (filters.status) filter.status = filters.status;
  if (filters.lowStock)
    filter.$expr = { $lte: [{ $subtract: ['$stock', '$reservedStock'] }, '$lowStockThreshold'] };
  if (filters.outOfStock) filter.$expr = { $lte: [{ $subtract: ['$stock', '$reservedStock'] }, 0] };

  const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

  const [variants, total] = await Promise.all([
    VariantModel.find(filter)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('productId', 'name slug')
      .lean(),
    VariantModel.countDocuments(filter),
  ]);

  return {
    variants: variants as unknown as VariantDocument[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
