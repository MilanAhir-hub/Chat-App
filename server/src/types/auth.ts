export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface TokenPayload {
  userId: string;
}
