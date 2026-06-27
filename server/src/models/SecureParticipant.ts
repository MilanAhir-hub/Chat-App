import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISecureParticipant extends Document {
  _id: Types.ObjectId;
  chatId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const secureParticipantSchema = new Schema<ISecureParticipant>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'SecureChat',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Ensure a user can only be added to a secure chat once
secureParticipantSchema.index({ chatId: 1, userId: 1 }, { unique: true });

export const SecureParticipant = mongoose.model<ISecureParticipant>(
  'SecureParticipant',
  secureParticipantSchema
);
