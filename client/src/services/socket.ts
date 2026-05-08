import { io, Socket } from 'socket.io-client';

const SOCKET_URL = '/';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  connect(token: string) {
    if (this.socket) return; // Prevent multiple socket instances from being created during Strict Mode mounting

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

  sendMessage(chatId: string, data: { clientTempId: string; type: string; textContent?: string; replyToMessageId?: string; attachmentId?: string }) {
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

  editMessage(chatId: string, messageId: string, textContent: string) {
    this.emit('chat:edit', { chatId, messageId, textContent });
  }

  reactToMessage(chatId: string, messageId: string, emoji: string | null) {
    this.emit('chat:react', { chatId, messageId, emoji });
  }

  requestKey(chatId: string, senderId: string) {
    this.emit('chat:key-request', { chatId, senderId });
  }

  async registerPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');

      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // We'll need the VAPID public key from the backend later
        // For now, we'll try to fetch it or use a placeholder if not available
        const response = await fetch('/api/v1/push/vapid-public-key');
        const { publicKey } = await response.json();

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey
        });
      }

      // Send subscription to backend
      await fetch('/api/v1/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(subscription)
      });
      console.log('Push subscription saved to backend');
    } catch (err) {
      console.error('Failed to register push notifications:', err);
    }
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
