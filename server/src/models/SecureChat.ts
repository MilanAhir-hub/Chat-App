import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISecureChat extends Document {
  _id: Types.ObjectId;
  passwordHash: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const secureChatSchema = new Schema<ISecureChat>(
  {
    passwordHash: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const SecureChat = mongoose.model<ISecureChat>('SecureChat', secureChatSchema);
