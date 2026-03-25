import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';

interface User {
  id: string;
  displayName: string;
  phoneNumber: string;
  avatarUrl?: string;
  aboutText?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.getProfile()
        .then(user => {
          dispatch({ type: 'SET_USER', payload: user });
          socketService.connect(token);
        })
        .catch(() => dispatch({ type: 'LOGOUT' }));
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const data = await api.login(phone, password);
    dispatch({ type: 'SET_USER', payload: data.user });
    socketService.connect(data.accessToken);
  }, []);

  const register = useCallback(async (name: string, phone: string, password: string) => {
    const data = await api.register(name, phone, password);
    dispatch({ type: 'SET_USER', payload: data.user });
    socketService.connect(data.accessToken);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    socketService.disconnect();
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
