import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import './Chat.css';

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ===== SIDEBAR COMPONENT =====
function Sidebar() {
  const { user, logout } = useAuth();
  const { chats, loadChats, selectChat, activeChat, isLoadingChats } = useChat();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => { loadChats(); }, [loadChats]);

  // Handle user search when input changes
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await api.searchUsers(search);
        setSearchResults(users || []);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStartChat = async (userId: string) => {
    try {
      const data = await api.createDirectChat(userId);
      // The backend returns a complex response depending on the previous codebase,
      // it might be { message: "...", data: Chat } or just the Chat.
      const newChat = data.chat || data.data || data;
      await loadChats();
      // Find the loaded chat object and select it
      const chatsAfterLoad = await api.getChatList();
      const loaded = (chatsAfterLoad.items || chatsAfterLoad).find((c: any) => c.id === newChat.id);
      if (loaded) selectChat(loaded);
      setSearch('');
    } catch (err) {
      console.error('Failed to start chat', err);
    }
  };

  const filtered = chats.filter(c =>
    !search || (c.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <div className="chat-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : getInitials(user?.displayName)}
          </div>
          <h2>Chats</h2>
        </div>
        <div className="sidebar-header-actions">
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="icon-btn" title="New chat">💬</button>
          <button className="icon-btn" onClick={logout} title="Logout">🚪</button>
        </div>
      </div>

      <div className="search-container">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search or start new chat"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="chat-list">
        {search.trim() ? (
          // Search Results View
          <>
            <div style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>
              Contacts
            </div>
            {isSearching ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)' }}>Searching...</div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)' }}>No contacts found</div>
            ) : (
              searchResults.map(userItem => (
                <div key={userItem.id} className="chat-list-item" onClick={() => handleStartChat(userItem.id)}>
                  <div className="chat-avatar">
                    {userItem.avatarUrl ? <img src={userItem.avatarUrl} alt="" /> : getInitials(userItem.displayName)}
                  </div>
                  <div className="chat-info">
                    <div className="chat-info-top">
                      <span className="chat-name">{userItem.displayName}</span>
                    </div>
                    <div className="chat-preview">
                      <span className="chat-last-message">{userItem.phoneNumber}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
            {filtered.length > 0 && (
              <div style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', borderTop: '1px solid var(--border-light)', marginTop: 8 }}>
                Existing Chats
              </div>
            )}
            {filtered.map(chat => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={activeChat?.id === chat.id}
                onClick={() => selectChat(chat)}
              />
            ))}
          </>
        ) : (
          // Normal Chat List View
          isLoadingChats ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading chats...
            </div>
          ) : chats.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No conversations yet
            </div>
          ) : (
            chats.map(chat => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={activeChat?.id === chat.id}
                onClick={() => selectChat(chat)}
              />
            ))
          )
        )}
      </div>
    </div>
  );
}

function ChatListItem({ chat, isActive, onClick }: { chat: any; isActive: boolean; onClick: () => void }) {
  const { typingUsers } = useChat();
  const typingInChat = typingUsers[chat.id] || [];

  return (
    <div className={`chat-list-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="chat-avatar">
        {chat.avatarUrl ? <img src={chat.avatarUrl} alt="" /> : getInitials(chat.title)}
      </div>
      <div className="chat-info">
        <div className="chat-info-top">
          <span className="chat-name">{chat.title || 'Unknown'}</span>
          {chat.lastMessageAt && (
            <span className={`chat-time ${chat.unreadCount > 0 ? 'unread' : ''}`}>
              {formatTime(chat.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="chat-preview">
          <span className="chat-last-message">
            {typingInChat.length > 0 ? (
              <span style={{ color: 'var(--accent)' }}>typing...</span>
            ) : chat.lastMessage ? (
              chat.lastMessage.textContent || `📎 Media`
            ) : (
              'Start chatting!'
            )}
          </span>
          {chat.unreadCount > 0 && (
            <span className="unread-badge">{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== CONVERSATION COMPONENT =====
function Conversation() {
  const { activeChat, messages, loadMessages, sendMessage, typingUsers } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const chatMessages = activeChat ? (messages[activeChat.id] || []) : [];
  const typingInChat = activeChat ? (typingUsers[activeChat.id] || []) : [];

  useEffect(() => {
    if (activeChat) loadMessages(activeChat.id);
  }, [activeChat, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleSend = () => {
    if (!input.trim() || !activeChat) return;
    sendMessage(activeChat.id, input.trim());
    setInput('');
    socketService.stopTyping(activeChat.id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (activeChat && value.trim()) {
      socketService.startTyping(activeChat.id);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socketService.stopTyping(activeChat.id);
      }, 3000);
    }
  };

  if (!activeChat) {
    return (
      <div className="conversation-panel">
        <div className="empty-chat">
          <div className="empty-chat-icon">💬</div>
          <h3>WhatsApp Clone</h3>
          <p>Send and receive messages instantly. Select a conversation from the sidebar or start a new one.</p>
        </div>
      </div>
    );
  }

  // Group messages by date
  let lastDate = '';

  return (
    <div className="conversation-panel">
      <div className="conv-header">
        <div className="chat-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
          {activeChat.avatarUrl ? <img src={activeChat.avatarUrl} alt="" /> : getInitials(activeChat.title)}
        </div>
        <div className="conv-header-info">
          <div className="conv-header-name">{activeChat.title || 'Unknown'}</div>
          <div className={`conv-header-status ${typingInChat.length > 0 ? 'typing' : ''}`}>
            {typingInChat.length > 0
              ? 'typing...'
              : activeChat.type === 'GROUP'
                ? `${activeChat.members.length} members`
                : 'online'}
          </div>
        </div>
        <div className="sidebar-header-actions">
          <button className="icon-btn">🔍</button>
          <button className="icon-btn">⋮</button>
        </div>
      </div>

      <div className="messages-area">
        {chatMessages.map((msg, i) => {
          const msgDate = formatDate(msg.createdAt);
          const showDate = msgDate !== lastDate;
          lastDate = msgDate;
          const isSent = msg.senderId === user?.id || msg.senderId === 'me';

          return (
            <div key={msg.id || msg.clientTempId || i}>
              {showDate && (
                <div className="date-separator">
                  <span>{msgDate}</span>
                </div>
              )}
              <div className={`message-row ${isSent ? 'sent' : 'received'}`}>
                <div className="message-bubble">
                  {msg.isDeleted ? (
                    <span className="message-deleted">🚫 This message was deleted</span>
                  ) : (
                    <>
                      <span className="message-text">{msg.textContent}</span>
                      <span className="message-meta">
                        {msg.editedAt && <span className="message-edited">edited</span>}
                        <span className="message-time">{formatTime(msg.createdAt)}</span>
                        {isSent && (
                          <span className={`message-status ${msg.status || 'sent'}`}>
                            {msg.status === 'sending' ? '🕐' : msg.status === 'read' ? '✓✓' : '✓'}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {typingInChat.length > 0 && (
          <div className="message-row received">
            <div className="message-bubble" style={{ padding: '12px 16px' }}>
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-area">
        <button className="icon-btn">😀</button>
        <button className="icon-btn">📎</button>
        <div className="message-input-box">
          <input
            type="text"
            placeholder="Type a message"
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button className="send-btn" onClick={handleSend}>
          ➤
        </button>
      </div>
    </div>
  );
}

// ===== MAIN CHAT PAGE =====
export function ChatPage() {
  const { activeChat } = useChat();

  return (
    <div className={`chat-layout ${activeChat ? 'chat-open' : ''}`}>
      <Sidebar />
      <Conversation />
    </div>
  );
}
