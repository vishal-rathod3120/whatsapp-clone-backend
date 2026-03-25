import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: string;
  textContent?: string;
  createdAt: string;
  editedAt?: string;
  isDeleted?: boolean;
  sender?: { displayName: string; avatarUrl?: string };
  clientTempId?: string;
  status?: string;
}

interface Chat {
  id: string;
  type: string;
  title?: string;
  avatarUrl?: string;
  lastMessage?: any;
  unreadCount: number;
  lastMessageAt?: string;
  members: { userId: string; displayName: string; avatarUrl?: string; role?: string }[];
}

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  isLoadingChats: boolean;
}

type ChatAction =
  | { type: 'SET_CHATS'; payload: Chat[] }
  | { type: 'SET_ACTIVE_CHAT'; payload: Chat | null }
  | { type: 'SET_MESSAGES'; payload: { chatId: string; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; chatId: string; updates: Partial<Message> } }
  | { type: 'SET_TYPING'; payload: { chatId: string; userId: string; isTyping: boolean } }
  | { type: 'UPDATE_UNREAD'; payload: { chatId: string; count: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SENT_ACK'; payload: { clientTempId: string; message: Message } };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CHATS':
      return { ...state, chats: action.payload, isLoadingChats: false };
    case 'SET_ACTIVE_CHAT':
      return { ...state, activeChat: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: { ...state.messages, [action.payload.chatId]: action.payload.messages } };
    case 'ADD_MESSAGE': {
      const chatId = action.payload.chatId;
      const existing = state.messages[chatId] || [];
      // Don't add duplicates
      if (existing.some(m => m.id === action.payload.id)) return state;
      const updated = [...existing, action.payload];
      // Update chat's last message
      const chats = state.chats.map(c =>
        c.id === chatId
          ? { ...c, lastMessage: action.payload, lastMessageAt: action.payload.createdAt }
          : c
      );
      // Move chat to top
      chats.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
      return { ...state, messages: { ...state.messages, [chatId]: updated }, chats };
    }
    case 'SENT_ACK': {
      const { clientTempId, message } = action.payload;
      const chatId = message.chatId;
      const msgs = (state.messages[chatId] || []).map(m =>
        m.clientTempId === clientTempId ? { ...message, clientTempId } : m
      );
      return { ...state, messages: { ...state.messages, [chatId]: msgs } };
    }
    case 'UPDATE_MESSAGE': {
      const { id, chatId, updates } = action.payload;
      const msgs = (state.messages[chatId] || []).map(m => m.id === id ? { ...m, ...updates } : m);
      return { ...state, messages: { ...state.messages, [chatId]: msgs } };
    }
    case 'SET_TYPING': {
      const { chatId, userId, isTyping } = action.payload;
      const current = state.typingUsers[chatId] || [];
      const next = isTyping
        ? [...new Set([...current, userId])]
        : current.filter(id => id !== userId);
      return { ...state, typingUsers: { ...state.typingUsers, [chatId]: next } };
    }
    case 'UPDATE_UNREAD': {
      const chats = state.chats.map(c => c.id === action.payload.chatId ? { ...c, unreadCount: action.payload.count } : c);
      return { ...state, chats };
    }
    case 'SET_LOADING':
      return { ...state, isLoadingChats: action.payload };
    default:
      return state;
  }
}

const initialState: ChatState = {
  chats: [],
  activeChat: null,
  messages: {},
  typingUsers: {},
  isLoadingChats: true,
};

interface ChatContextType extends ChatState {
  loadChats: () => Promise<void>;
  selectChat: (chat: Chat) => void;
  loadMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => void;
  dispatch: React.Dispatch<ChatAction>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { isAuthenticated } = useAuth();

  const loadChats = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await api.getChatList();
      dispatch({ type: 'SET_CHATS', payload: data.items || data });
    } catch (err) {
      console.error('Failed to load chats:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const selectChat = useCallback((chat: Chat) => {
    dispatch({ type: 'SET_ACTIVE_CHAT', payload: chat });
    dispatch({ type: 'UPDATE_UNREAD', payload: { chatId: chat.id, count: 0 } });
    api.markChatRead(chat.id).catch(() => {});
  }, []);

  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const data = await api.getMessages(chatId);
      dispatch({ type: 'SET_MESSAGES', payload: { chatId, messages: (data.items || data).reverse() } });
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  const sendMessage = useCallback((chatId: string, text: string) => {
    const clientTempId = crypto.randomUUID();
    const optimistic: Message = {
      id: clientTempId,
      chatId,
      senderId: 'me',
      type: 'TEXT',
      textContent: text,
      createdAt: new Date().toISOString(),
      clientTempId,
      status: 'sending',
    };
    dispatch({ type: 'ADD_MESSAGE', payload: optimistic });
    socketService.sendMessage(chatId, { clientTempId, type: 'TEXT', textContent: text });
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const onNewMessage = (data: { message: Message }) => {
      dispatch({ type: 'ADD_MESSAGE', payload: data.message });
      socketService.markDelivered(data.message.id);
    };

    const onSentAck = (data: { clientTempId: string; message: Message }) => {
      dispatch({ type: 'SENT_ACK', payload: data });
    };

    const onTyping = (data: { chatId: string; userId: string; isTyping: boolean }) => {
      dispatch({ type: 'SET_TYPING', payload: data });
    };

    const onMessageDeleted = (data: { chatId: string; messageId: string }) => {
      dispatch({ type: 'UPDATE_MESSAGE', payload: { id: data.messageId, chatId: data.chatId, updates: { isDeleted: true, textContent: undefined } } });
    };

    const onMessageEdited = (data: { chatId: string; messageId: string; textContent: string; editedAt: string }) => {
      dispatch({ type: 'UPDATE_MESSAGE', payload: { id: data.messageId, chatId: data.chatId, updates: { textContent: data.textContent, editedAt: data.editedAt } } });
    };

    socketService.on('chat:new', onNewMessage);
    socketService.on('chat:sent-ack', onSentAck);
    socketService.on('chat:typing:update', onTyping);
    socketService.on('message:deleted', onMessageDeleted);
    socketService.on('message:edited', onMessageEdited);

    return () => {
      socketService.off('chat:new', onNewMessage);
      socketService.off('chat:sent-ack', onSentAck);
      socketService.off('chat:typing:update', onTyping);
      socketService.off('message:deleted', onMessageDeleted);
      socketService.off('message:edited', onMessageEdited);
    };
  }, [isAuthenticated]);

  return (
    <ChatContext.Provider value={{ ...state, loadChats, selectChat, loadMessages, sendMessage, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
