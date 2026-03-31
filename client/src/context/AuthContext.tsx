import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { signalService } from '../services/e2ee/signal.service';

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
        .then(async user => {
          dispatch({ type: 'SET_USER', payload: user });
          socketService.connect(token);
          socketService.registerPushNotifications();
          const deviceId = localStorage.getItem('deviceId');
          if (deviceId) {
            await signalService.initializeAccount(user.id, deviceId);
          }
        })
        .catch(() => dispatch({ type: 'LOGOUT' }));
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    console.log('[AuthContext] Starting login...');
    const data = await api.login(phone, password);
    console.log('[AuthContext] Login API success, user:', data.user.id);
    dispatch({ type: 'SET_USER', payload: data.user });
    console.log('[AuthContext] User dispatched');
    socketService.connect(data.accessToken);
    socketService.registerPushNotifications();
    const deviceId = localStorage.getItem('deviceId');
    console.log('[AuthContext] deviceId from localStorage:', deviceId);
    if (deviceId) {
      try {
        await signalService.initializeAccount(data.user.id, deviceId);
        console.log('[AuthContext] Signal service initialized');
      } catch (err) {
        console.error('[AuthContext] Signal service init failed:', err);
        // Don't block login if signal init fails
      }
    }
    console.log('[AuthContext] Login complete');
  }, []);

  const register = useCallback(async (name: string, phone: string, password: string) => {
    const data = await api.register(name, phone, password);
    dispatch({ type: 'SET_USER', payload: data.user });
    socketService.connect(data.accessToken);
    socketService.registerPushNotifications();
    const deviceId = localStorage.getItem('deviceId');
    if (deviceId) {
      await signalService.initializeAccount(data.user.id, deviceId);
    }
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
