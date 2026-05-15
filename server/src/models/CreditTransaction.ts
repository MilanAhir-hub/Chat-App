import mongoose, { Document, Schema, Types } from 'mongoose';

export type CreditTransactionType = 'grant' | 'purchase' | 'use' | 'refund';

export interface ICreditTransaction extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  provider?: 'razorpay' | 'system';
  providerOrderId?: string;
  providerPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const creditTransactionSchema = new Schema<ICreditTransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['grant', 'purchase', 'use', 'refund'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    provider: {
      type: String,
      enum: ['razorpay', 'system'],
    },
    providerOrderId: {
      type: String,
      trim: true,
      index: true,
    },
    providerPaymentId: {
      type: String,
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
);

creditTransactionSchema.index({ user: 1, createdAt: -1 });

export const CreditTransaction = mongoose.model<ICreditTransaction>(
  'CreditTransaction',
  creditTransactionSchema
);
