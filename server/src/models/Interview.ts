import mongoose, { Document, Schema, Types } from 'mongoose';

export type InterviewLevel = 'junior' | 'mid' | 'senior';
export type InterviewStatus = 'in_progress' | 'completed';

export interface IInterviewQuestion {
  question: string;
  userAnswer: string;
  aiAnswer: string;
  score: number;
  feedback: string;
  topics: string[];
}

export interface IInterview extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  role: string;
  level: InterviewLevel;
  status: InterviewStatus;
  creditsUsed: number;
  overallScore: number;
  questions: IInterviewQuestion[];
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const interviewQuestionSchema = new Schema<IInterviewQuestion>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    userAnswer: {
      type: String,
      default: '',
      trim: true,
      maxlength: 3000,
    },
    aiAnswer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1200,
    },
    topics: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const interviewSchema = new Schema<IInterview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    level: {
      type: String,
      enum: ['junior', 'mid', 'senior'],
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
      index: true,
    },
    creditsUsed: {
      type: Number,
      required: true,
      min: 1,
    },
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    questions: {
      type: [interviewQuestionSchema],
      required: true,
    },
    completedAt: Date,
  },
  { timestamps: true }
);

interviewSchema.index({ user: 1, createdAt: -1 });

export const Interview = mongoose.model<IInterview>('Interview', interviewSchema);
