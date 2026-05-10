import mongoose, { Document, Schema, Types } from 'mongoose';

export type MessageType = 'text' | 'file';

export interface IMessageReaction {
  emoji: string;
  users: Types.ObjectId[];
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  roomId: string;
  sender: Types.ObjectId;
  senderName: string;
  type: MessageType;
  content: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  reactions: IMessageReaction[];
  replyTo?: {
    id: Types.ObjectId;
    content: string;
    senderName: string;
  };
  cloudinaryPublicId?: string;
  deliveredTo: Types.ObjectId[];
  seenBy: Types.ObjectId[];
  tempId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageReactionSchema = new Schema<IMessageReaction>(
  {
    emoji: {
      type: String,
      required: true,
      maxlength: 12,
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { _id: false }
);

const messageSchema = new Schema<IMessage>(
  {
    roomId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
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
    reactions: {
      type: [messageReactionSchema],
      default: [],
    },
    replyTo: {
      type: {
        id: { type: Schema.Types.ObjectId, ref: 'Message' },
        content: String,
        senderName: String,
      },
      required: false,
      _id: false
    },
    cloudinaryPublicId: {
      type: String,
      trim: true,
    },
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
  },
  { timestamps: true }
);

messageSchema.index({ roomId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
