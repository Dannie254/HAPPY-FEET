import type { Document, Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { ISession } from '../../shared/types.js';

export interface SessionDocument extends Omit<ISession, '_id'>, Document {}

const sessionSchema = new Schema<SessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },
    userAgent: {
      type: String,
    },
    ip: {
      type: String,
    },
    fingerprintHash: {
      type: String,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ userId: 1, revokedAt: 1 });

export const SessionModel: Model<SessionDocument> = mongoose.model<SessionDocument>(
  'Session',
  sessionSchema
);

export function createSessionModel(): Model<SessionDocument> {
  return SessionModel;
}
