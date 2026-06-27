import mongoose, { Document, Schema, Types } from 'mongoose';

export type SecureMessageType = 'text' | 'file';

export interface ISecureMessageReply {
  id: Types.ObjectId;
  content: string;
  senderName: string;
}

export interface ISecureMessage extends Document {
  _id: Types.ObjectId;
  chatId: Types.ObjectId;
  sender: Types.ObjectId;
  senderName: string;
  type: SecureMessageType;
  content: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  deliveredTo: Types.ObjectId[];
  seenBy: Types.ObjectId[];
  tempId?: string;
  replyTo?: ISecureMessageReply;
  createdAt: Date;
  updatedAt: Date;
}

const secureMessageSchema = new Schema<ISecureMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'SecureChat',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'file'],
      default: 'text',
    },
    content: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    fileType: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    fileSize: Number,
    deliveredTo: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    seenBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    tempId: {
      type: String,
      trim: true,
    },
    replyTo: {
      type: {
        id: { type: Schema.Types.ObjectId, ref: 'SecureMessage' },
        content: String,
        senderName: String,
      },
      required: false,
      _id: false,
    },
  },
  { timestamps: true }
);

secureMessageSchema.index({ chatId: 1, createdAt: 1 });

export const SecureMessage = mongoose.model<ISecureMessage>('SecureMessage', secureMessageSchema);
