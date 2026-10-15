import type { Document, Model, Types } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'OUT_OF_STOCK';

export interface IProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  description: string;
  shortDescription?: string;
  categoryId: Types.ObjectId | string;
  subcategoryId?: Types.ObjectId | string;
  brand?: string;
  gender?: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS';
  tags: string[];
  images: IProductImage[];
  basePrice: number;
  compareAtPrice?: number;
  costPrice?: number;
  currency: string;
  status: ProductStatus;
  featured: boolean;
  isDigital: boolean;
  requiresShipping: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  seoTitle?: string;
  seoDescription?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDocument extends Omit<IProduct, '_id'>, Document {}

const productImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const productSchema = new Schema<ProductDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    subcategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: 100,
      index: true,
    },
    gender: {
      type: String,
      enum: ['MEN', 'WOMEN', 'UNISEX', 'KIDS'],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    images: {
      type: [productImageSchema],
      default: [],
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'KES',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK'],
      default: 'DRAFT',
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDigital: {
      type: Boolean,
      default: false,
    },
    requiresShipping: {
      type: Boolean,
      default: true,
    },
    weight: {
      type: Number,
      min: 0,
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: 60,
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { __v, ...rest } = ret as Record<string, unknown>;
        return rest;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ categoryId: 1, status: 1, featured: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ featured: 1, status: 1, createdAt: -1 });
productSchema.index({ brand: 1, status: 1 });
productSchema.index({ gender: 1, status: 1 });

productSchema.virtual('variants', {
  ref: 'Variant',
  localField: '_id',
  foreignField: 'productId',
});

productSchema.virtual('hasVariants', {
  ref: 'Variant',
  localField: '_id',
  foreignField: 'productId',
  count: true,
});

productSchema.pre('save', function (next) {
  if (this.isModified('images')) {
    const primaryCount = this.images.filter((img) => img.isPrimary).length;
    if (primaryCount > 1) {
      this.images.forEach((img, idx) => {
        img.isPrimary = idx === 0;
      });
    } else if (primaryCount === 0 && this.images.length > 0) {
      this.images[0].isPrimary = true;
    }
  }
  next();
});

export const ProductModel: Model<ProductDocument> = mongoose.model<ProductDocument>(
  'Product',
  productSchema
);

export function createProductModel(): Model<ProductDocument> {
  return ProductModel;
}
