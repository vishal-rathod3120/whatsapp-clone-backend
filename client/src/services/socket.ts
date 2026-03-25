import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => console.log('Socket connected'));
    this.socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
    this.socket.on('connect_error', (err) => console.error('Socket error:', err.message));

    // Re-register all listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(cb => this.socket?.on(event, cb));
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.listeners.get(event)?.delete(callback);
    this.socket?.off(event, callback);
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }

  sendMessage(chatId: string, data: { clientTempId: string; type: string; textContent?: string; replyToMessageId?: string }) {
    this.emit('chat:send', { chatId, ...data });
  }

  markDelivered(messageId: string) {
    this.emit('chat:delivered', { messageId });
  }

  markSeen(chatId: string, messageId: string) {
    this.emit('chat:seen', { chatId, messageId });
  }

  startTyping(chatId: string) {
    this.emit('chat:typing:start', { chatId });
  }

  stopTyping(chatId: string) {
    this.emit('chat:typing:stop', { chatId });
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
