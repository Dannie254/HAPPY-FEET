import type { Document, Model, Types } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export type VariantStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';

export interface IVariantAttribute {
  name: string;
  value: string;
  displayName?: string;
}

export interface IVariant {
  _id: string;
  productId: Types.ObjectId | string;
  sku: string;
  barcode?: string;
  attributes: IVariantAttribute[];
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  currency: string;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  status: VariantStatus;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images: string[];
  sortOrder: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  availableStock?: number;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
}

export interface VariantDocument extends Omit<IVariant, '_id'>, Document {}

const variantAttributeSchema = new Schema<IVariantAttribute>(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    displayName: { type: String, trim: true },
  },
  { _id: false }
);

const variantSchema = new Schema<VariantDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    attributes: {
      type: [variantAttributeSchema],
      default: [],
    },
    price: {
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
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      index: true,
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    trackInventory: {
      type: Boolean,
      default: true,
    },
    allowBackorder: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'],
      default: 'ACTIVE',
      index: true,
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
    images: {
      type: [String],
      default: [],
    },
    sortOrder: {
      type: Number,
      default: 0,
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

variantSchema.index({ productId: 1, status: 1 });
variantSchema.index({ productId: 1, sortOrder: 1 });
variantSchema.index({ sku: 1 }, { unique: true });
variantSchema.index({ stock: 1, trackInventory: 1 });

variantSchema.virtual('availableStock').get(function () {
  if (!this.trackInventory) return Infinity;
  return Math.max(0, (this.stock || 0) - (this.reservedStock || 0));
});

variantSchema.virtual('isLowStock').get(function () {
  if (!this.trackInventory) return false;
  const available = Math.max(0, (this.stock || 0) - (this.reservedStock || 0));
  return available <= (this.lowStockThreshold || 5);
});

variantSchema.virtual('isOutOfStock').get(function () {
  if (!this.trackInventory) return false;
  const available = Math.max(0, (this.stock || 0) - (this.reservedStock || 0));
  return available <= 0;
});

variantSchema.pre('save', function (next) {
  if (this.trackInventory && this.stock <= 0) {
    this.status = 'OUT_OF_STOCK';
  } else if (this.isModified('stock') && this.stock > 0 && this.status === 'OUT_OF_STOCK') {
    this.status = 'ACTIVE';
  }
  next();
});

export const VariantModel: Model<VariantDocument> = mongoose.model<VariantDocument>(
  'Variant',
  variantSchema
);

export function createVariantModel(): Model<VariantDocument> {
  return VariantModel;
}
