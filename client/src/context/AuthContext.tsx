/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { getErrorMessage } from '../services/http';
import { disconnectSocket } from '../socket/socket';
import type { User } from '../types';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  name: string;
}

interface AuthContextValue {
  user: User | null;
  isCheckingAuth: boolean;
  login: (input: LoginInput) => Promise<string>;
  register: (input: RegisterInput) => Promise<string>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.me();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (input: LoginInput) => {
    try {
      const response = await authService.login(input);
      setUser(response.user);
      return response.message;
    } catch (error) {
      throw new Error(getErrorMessage(error), { cause: error });
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    try {
      const response = await authService.register(input);
      setUser(response.user);
      return response.message;
    } catch (error) {
      throw new Error(getErrorMessage(error), { cause: error });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      disconnectSocket();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isCheckingAuth,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isCheckingAuth, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
};
