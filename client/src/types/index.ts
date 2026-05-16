export interface User {
  id: string;
  name: string;
  email: string;
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
