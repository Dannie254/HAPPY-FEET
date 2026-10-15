import type { Document, Model, Types } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: Types.ObjectId | string;
  level: number;
  path: string;
  image?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDocument extends Omit<ICategory, '_id'>, Document {}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    path: {
      type: String,
      required: true,
      index: true,
    },
    image: {
      type: String,
    },
    icon: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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
  }
);

categorySchema.index({ parentId: 1, sortOrder: 1 });
categorySchema.index({ path: 1 });

categorySchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('parentId')) {
    if (this.parentId) {
      const parent = await CategoryModel.findById(this.parentId);
      if (parent) {
        this.level = parent.level + 1;
        this.path = `${parent.path}/${this.slug}`;
      } else {
        this.level = 0;
        this.path = this.slug;
      }
    } else {
      this.level = 0;
      this.path = this.slug;
    }
  }
  next();
});

categorySchema.pre('findOneAndDelete', async function (next) {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    await this.model.deleteMany({ path: new RegExp(`^${doc.path}/`) });
  }
  next();
});

export const CategoryModel: Model<CategoryDocument> = mongoose.model<CategoryDocument>(
  'Category',
  categorySchema
);

export function createCategoryModel(): Model<CategoryDocument> {
  return CategoryModel;
}
