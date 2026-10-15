import type { Document, Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { IUser } from '../../shared/types.js';
import { UserRole, UserStatus, AuthProvider } from '../../shared/types.js';

export interface UserDocument extends Omit<IUser, '_id'>, Document {}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING_VERIFICATION,
      index: true,
    },
    authProvider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.LOCAL,
      index: true,
    },
    providerId: {
      type: String,
      sparse: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      select: false,
    },
    mfaBackupCodes: {
      type: [String],
      select: false,
    },
    passwordHistory: {
      type: [String],
      select: false,
      default: [],
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1, authProvider: 1 });
userSchema.index({ createdAt: -1 });

export const UserModel: Model<UserDocument> = mongoose.model<UserDocument>('User', userSchema);

export function createUserModel(): Model<UserDocument> {
  return UserModel;
}
