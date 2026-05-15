export interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
}

export interface Room {
  id: string;
  roomId: string;
  createdBy: User;
  users: User[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  sender: {
    id: string;
    name: string;
  };
  type: 'text' | 'file';
  content: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  reactions: MessageReaction[];
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  deliveredTo: string[];
  seenBy: string[];
  tempId?: string;
  createdAt: string;
}

export interface RoomNotice {
  type: 'joined' | 'left' | 'closed';
  user?: User;
  message: string;
  createdAt: string;
}

export type InterviewLevel = 'junior' | 'mid' | 'senior';
export type InterviewStatus = 'in_progress' | 'completed';

export interface InterviewQuestion {
  question: string;
  userAnswer: string;
  aiAnswer: string;
  score: number;
  feedback: string;
  topics: string[];
}

export interface Interview {
  id: string;
  title: string;
  role: string;
  level: InterviewLevel;
  status: InterviewStatus;
  creditsUsed: number;
  overallScore: number;
  questions: InterviewQuestion[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditHistoryItem {
  id: string;
  type: 'grant' | 'purchase' | 'use' | 'refund';
  amount: number;
  balanceAfter: number;
  description: string;
  provider?: 'razorpay' | 'system';
  createdAt: string;
}

export interface InterviewDashboard {
  credits: number;
  stats: {
    totalInterviews: number;
    completedInterviews: number;
    creditsUsed: number;
    averageScore: number;
  };
  usageGraph: Array<{
    label: string;
    questions: number;
    credits: number;
  }>;
  interviews: Interview[];
  creditHistory: CreditHistoryItem[];
}
