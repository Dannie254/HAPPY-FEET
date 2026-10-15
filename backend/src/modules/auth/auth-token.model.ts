import type { Document, Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { IAuthToken } from '../../shared/types.js';
import { TokenType } from '../../shared/types.js';

export interface AuthTokenDocument extends Omit<IAuthToken, '_id'>, Document {}

const authTokenSchema = new Schema<AuthTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TokenType),
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

authTokenSchema.index({ userId: 1, type: 1, usedAt: 1 });

export const AuthTokenModel: Model<AuthTokenDocument> = mongoose.model<AuthTokenDocument>(
  'AuthToken',
  authTokenSchema
);

export function createAuthTokenModel(): Model<AuthTokenDocument> {
  return AuthTokenModel;
}
