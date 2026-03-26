import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { playMessageSound, playSentSound } from '../services/notificationSound';
import { useAuth } from './AuthContext';

function generateClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

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
  attachmentId?: string;
  attachmentUrl?: string;
  attachmentMimeType?: string;
  reactions?: any[];
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
  onlineUsers: string[];
  userPresence: Record<string, { status: string; lastSeen?: string }>;
}

type ChatAction =
  | { type: 'SET_CHATS'; payload: Chat[] }
  | { type: 'ADD_CHAT'; payload: Chat }
  | { type: 'DELETE_CHAT'; payload: string }
  | { type: 'SET_ACTIVE_CHAT'; payload: Chat | null }
  | { type: 'SET_MESSAGES'; payload: { chatId: string; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; chatId: string; updates: Partial<Message> } }
  | { type: 'SET_TYPING'; payload: { chatId: string; userId: string; isTyping: boolean } }
  | { type: 'UPDATE_UNREAD'; payload: { chatId: string; count: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SENT_ACK'; payload: { clientTempId: string; message: Message } }
  | { type: 'DELETE_MESSAGE'; payload: { id: string; chatId: string; forEveryone: boolean } }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { messageId: string; chatId: string; status: 'delivered' | 'read' } }
  | { type: 'SET_ONLINE_USERS'; payload: string[] }
  | { type: 'UPDATE_CHAT'; payload: Chat }
  | { type: 'UPDATE_PRESENCE'; payload: { userId: string; status: string; lastSeen?: string } };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CHATS':
      return { ...state, chats: action.payload, isLoadingChats: false };
    case 'ADD_CHAT':
      return { ...state, chats: [action.payload, ...state.chats] };
    case 'UPDATE_CHAT': {
      const updated = action.payload;
      return {
        ...state,
        chats: state.chats.map(c => c.id === updated.id ? { ...c, ...updated } : c),
        activeChat: state.activeChat?.id === updated.id ? { ...state.activeChat, ...updated } : state.activeChat,
      };
    }
    case 'DELETE_CHAT': {
      const chatId = action.payload;
      const { [chatId]: _, ...remainingMessages } = state.messages;
      return {
        ...state,
        chats: state.chats.filter(c => c.id !== chatId),
        messages: remainingMessages,
        activeChat: state.activeChat?.id === chatId ? null : state.activeChat
      };
    }
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
        m.clientTempId === clientTempId ? { ...message, status: 'sent', clientTempId: undefined } : m
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
    case 'DELETE_MESSAGE': {
      const { id, chatId, forEveryone } = action.payload;
      if (forEveryone) {
        // Just mark as deleted (text will be hidden by UI)
        const msgs = (state.messages[chatId] || []).map(m => 
          m.id === id ? { ...m, isDeleted: true, textContent: undefined, attachmentId: undefined, attachmentUrl: undefined } : m
        );
        return { ...state, messages: { ...state.messages, [chatId]: msgs } };
      } else {
        // Remove completely for this user
        const msgs = (state.messages[chatId] || []).filter(m => m.id !== id);
        return { ...state, messages: { ...state.messages, [chatId]: msgs } };
      }
    }
    case 'UPDATE_MESSAGE_STATUS': {
      const { messageId, chatId, status } = action.payload;
      const msgs = (state.messages[chatId] || []).map(m =>
        m.id === messageId ? { ...m, status } : m
      );
      return { ...state, messages: { ...state.messages, [chatId]: msgs } };
    }
    case 'SET_ONLINE_USERS':
      return { ...state, onlineUsers: action.payload };
    case 'UPDATE_PRESENCE': {
      const { userId, status, lastSeen } = action.payload;
      return {
        ...state,
        userPresence: { ...state.userPresence, [userId]: { status, lastSeen } },
      };
    }
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
  onlineUsers: [],
  userPresence: {},
};

interface ChatContextType extends ChatState {
  loadChats: () => Promise<void>;
  selectChat: (chat: Chat) => void;
  deselectChat: () => void;
  loadMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string, replyToMessageId?: string) => void;
  sendMediaMessage: (chatId: string, file: File, type: 'IMAGE' | 'VIDEO' | 'FILE') => Promise<void>;
  deleteMessage: (chatId: string, messageId: string, forEveryone: boolean) => Promise<void>;
  deleteGroup: (chatId: string) => Promise<void>;
  createDirectChat: (targetUserId: string) => Promise<void>;
  createGroupChat: (name: string, memberIds: string[]) => Promise<void>;
  refreshChat: (chatId: string) => Promise<any>;
  addGroupMembers: (chatId: string, userIds: string[]) => Promise<void>;
  removeGroupMember: (chatId: string, userId: string) => Promise<void>;
  updateMemberRole: (chatId: string, userId: string, role: string) => Promise<void>;
  updateGroupInfo: (chatId: string, data: { title?: string; avatarUrl?: string }) => Promise<void>;
  dispatch: React.Dispatch<ChatAction>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { isAuthenticated, user } = useAuth();

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

  const deselectChat = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_CHAT', payload: null });
  }, []);

  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const data = await api.getMessages(chatId);
      const messages = (data.items || data).map((m: any) => {
        let status = m.status;
        if (m.receipts && m.receipts.length > 0) {
          if (m.receipts.some((r: any) => r.seenAt)) status = 'read';
          else if (m.receipts.some((r: any) => r.deliveredAt)) status = 'delivered';
        }
        return { ...m, status };
      });
      dispatch({ type: 'SET_MESSAGES', payload: { chatId, messages: messages.reverse() } });
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  const sendMessage = useCallback((chatId: string, text: string, replyToMessageId?: string) => {
    const clientTempId = generateClientId();
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
    socketService.sendMessage(chatId, { clientTempId, type: 'TEXT', textContent: text, replyToMessageId });
  }, []);

  const sendMediaMessage = useCallback(async (chatId: string, file: File, type: 'IMAGE' | 'VIDEO' | 'FILE') => {
    const clientTempId = generateClientId();
    const objectUrl = URL.createObjectURL(file);
    
    const optimistic: Message = {
      id: clientTempId,
      chatId,
      senderId: 'me',
      type,
      createdAt: new Date().toISOString(),
      clientTempId,
      status: 'sending',
      attachmentUrl: objectUrl,
      attachmentMimeType: file.type,
    };
    dispatch({ type: 'ADD_MESSAGE', payload: optimistic });
    
    try {
      const data = await api.uploadMedia(file, type);
      socketService.sendMessage(chatId, { clientTempId, type, attachmentId: data.attachmentId });
    } catch (err) {
      console.error('Failed to send media message:', err);
      dispatch({ type: 'UPDATE_MESSAGE', payload: { id: clientTempId, chatId, updates: { status: 'failed' } } });
    }
  }, []);

  const deleteMessage = useCallback(async (chatId: string, messageId: string, forEveryone: boolean) => {
    try {
      await api.deleteMessage(chatId, messageId, forEveryone);
      dispatch({ type: 'DELETE_MESSAGE', payload: { id: messageId, chatId, forEveryone } });
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  }, []);

  const deleteGroup = useCallback(async (chatId: string) => {
    try {
      await api.deleteGroup(chatId);
      dispatch({ type: 'DELETE_CHAT', payload: chatId });
    } catch (err) {
      console.error('Failed to delete group:', err);
    }
  }, []);

  const createDirectChat = useCallback(async (targetUserId: string) => {
    try {
      const newChat = await api.createDirectChat(targetUserId);
      dispatch({ type: 'ADD_CHAT', payload: newChat });
      dispatch({ type: 'SET_ACTIVE_CHAT', payload: newChat });
    } catch (err) {
      console.error('Failed to create direct chat:', err);
    }
  }, []);

  const createGroupChat = useCallback(async (name: string, memberIds: string[]) => {
    try {
      const newChat = await api.createGroupChat(name, memberIds);
      dispatch({ type: 'ADD_CHAT', payload: newChat });
      dispatch({ type: 'SET_ACTIVE_CHAT', payload: newChat });
    } catch (err) {
      console.error('Failed to create group chat:', err);
    }
  }, []);

  const refreshChat = useCallback(async (chatId: string) => {
    try {
      const chat = await api.getChatById(chatId);
      dispatch({ type: 'UPDATE_CHAT', payload: chat });
      return chat;
    } catch (err) {
      console.error('Failed to refresh chat:', err);
    }
  }, []);

  const addGroupMembers = useCallback(async (chatId: string, userIds: string[]) => {
    try {
      await api.addGroupMembers(chatId, userIds);
      await refreshChat(chatId);
    } catch (err) {
      console.error('Failed to add members:', err);
      throw err;
    }
  }, [refreshChat]);

  const removeGroupMember = useCallback(async (chatId: string, userId: string) => {
    try {
      await api.removeGroupMember(chatId, userId);
      await refreshChat(chatId);
    } catch (err) {
      console.error('Failed to remove member:', err);
      throw err;
    }
  }, [refreshChat]);

  const updateMemberRole = useCallback(async (chatId: string, userId: string, role: string) => {
    try {
      await api.updateMemberRole(chatId, userId, role);
      await refreshChat(chatId);
    } catch (err) {
      console.error('Failed to update role:', err);
      throw err;
    }
  }, [refreshChat]);

  const updateGroupInfo = useCallback(async (chatId: string, data: { title?: string; avatarUrl?: string }) => {
    try {
      await api.updateGroupInfo(chatId, data);
      await refreshChat(chatId);
    } catch (err) {
      console.error('Failed to update group info:', err);
      throw err;
    }
  }, [refreshChat]);

  // Socket event listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const onNewMessage = (data: { message: Message }) => {
      dispatch({ type: 'ADD_MESSAGE', payload: data.message });
      socketService.markDelivered(data.message.id);
      // Play sound for messages from other users (not currently viewed chat)
      if (data.message.senderId !== user?.id) {
        playMessageSound();
      }
    };

    const onSentAck = (data: { clientTempId: string; message: Message }) => {
      dispatch({ type: 'SENT_ACK', payload: data });
      playSentSound();
    };

    const onTyping = (data: { chatId: string; userId: string; isTyping: boolean }) => {
      dispatch({ type: 'SET_TYPING', payload: data });
    };

    const onMessageDeleted = (data: { chatId: string; messageId: string; deletedForEveryone: boolean }) => {
      dispatch({ type: 'DELETE_MESSAGE', payload: { id: data.messageId, chatId: data.chatId, forEveryone: data.deletedForEveryone } });
    };

    const onMessageEdited = (data: { chatId: string; messageId: string; textContent: string; editedAt: string }) => {
      dispatch({ type: 'UPDATE_MESSAGE', payload: { id: data.messageId, chatId: data.chatId, updates: { textContent: data.textContent, editedAt: data.editedAt } } });
    };

    const onChatDeleted = (data: { chatId: string }) => {
      dispatch({ type: 'DELETE_CHAT', payload: data.chatId });
    };

    const onUserOnline = (userIds: string[]) => {
      dispatch({ type: 'SET_ONLINE_USERS', payload: userIds });
    };

    const onPresenceUpdate = (data: { userId: string; status: string; lastSeen?: string }) => {
      dispatch({ type: 'UPDATE_PRESENCE', payload: data });
    };

    const onDeliveredUpdate = (data: { messageId: string; chatId: string; deliveredAt: string }) => {
      dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId: data.messageId, chatId: data.chatId, status: 'delivered' } });
    };

    const onSeenUpdate = (data: { messageId: string; chatId: string; seenBy: string; seenAt: string }) => {
      dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId: data.messageId, chatId: data.chatId, status: 'read' } });
    };

    const onReactions = (data: { chatId: string; messageId: string; reactions: any[] }) => {
      dispatch({ type: 'UPDATE_MESSAGE', payload: { id: data.messageId, chatId: data.chatId, updates: { reactions: data.reactions } } });
    };

    socketService.on('chat:new', onNewMessage);
    socketService.on('chat:sent-ack', onSentAck);
    socketService.on('chat:typing:update', onTyping);
    socketService.on('message:deleted', onMessageDeleted);
    socketService.on('message:edited', onMessageEdited);
    socketService.on('chat:deleted', onChatDeleted);
    socketService.on('user:online', onUserOnline);
    socketService.on('presence:update', onPresenceUpdate);
    socketService.on('chat:delivered:update', onDeliveredUpdate);
    socketService.on('chat:seen:update', onSeenUpdate);
    socketService.on('message:reactions', onReactions);

    return () => {
      socketService.off('chat:new', onNewMessage);
      socketService.off('chat:sent-ack', onSentAck);
      socketService.off('chat:typing:update', onTyping);
      socketService.off('message:deleted', onMessageDeleted);
      socketService.off('message:edited', onMessageEdited);
      socketService.off('chat:deleted', onChatDeleted);
      socketService.off('user:online', onUserOnline);
      socketService.off('presence:update', onPresenceUpdate);
      socketService.off('chat:delivered:update', onDeliveredUpdate);
      socketService.off('chat:seen:update', onSeenUpdate);
      socketService.off('message:reactions', onReactions);
    };
  }, [isAuthenticated]);

  // Auto-mark as seen when chat is active
  useEffect(() => {
    if (state.activeChat && state.messages[state.activeChat.id]) {
      const unseen = state.messages[state.activeChat.id].filter(
        m => m.senderId !== user?.id && m.status !== 'read'
      );
      unseen.forEach(m => {
        socketService.markSeen(state.activeChat!.id, m.id);
      });
    }
  }, [state.activeChat?.id, state.messages[state.activeChat?.id || '']?.length, user?.id]);

  return (
    <ChatContext.Provider value={{ ...state, loadChats, selectChat, deselectChat, loadMessages, sendMessage, sendMediaMessage, deleteMessage, deleteGroup, createDirectChat, createGroupChat, refreshChat, addGroupMembers, removeGroupMember, updateMemberRole, updateGroupInfo, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
