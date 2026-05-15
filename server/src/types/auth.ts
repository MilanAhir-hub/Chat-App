export interface AuthUser {
  id: string;
  name: string;
  email: string;
  credits: number;
}

export interface TokenPayload {
  userId: string;
}
