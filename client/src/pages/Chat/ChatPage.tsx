import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { NewGroupModal } from '../../components/NewGroupModal';
import { ProfilePanel } from '../../components/ProfilePanel';
import { ContactInfoPanel } from '../../components/ContactInfoPanel';
import { EmojiPicker } from '../../components/EmojiPicker';
import { CallHistory } from '../../components/CallHistory';
import { StatusPanel } from '../../components/StatusPanel';
import { StarredMessagesPanel } from '../../components/StarredMessagesPanel';
import { CommunityHome } from '../../components/CommunityHome';
import { useCall } from '../../context/CallContext';
import { useDecryptedMedia } from '../../hooks/useDecryptedMedia';
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
  const { chats, communities, loadChats, selectChat, selectCommunity, activeChat, activeCommunity, isLoadingChats } = useChat();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'chats' | 'communities'>('chats');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [showStarredPanel, setShowStarredPanel] = useState(false);

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

  const filteredChats = chats.filter(c =>
    !search || (c.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredCommunities = communities?.filter(c =>
    !search || (c.name || '').toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <div className="chat-avatar" style={{ width: 36, height: 36, fontSize: 14, cursor: 'pointer' }} onClick={() => setShowProfile(true)}>
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : getInitials(user?.displayName)}
          </div>
          <h2>Chats</h2>
        </div>
        <div className="sidebar-header-actions">
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="icon-btn" onClick={() => setShowStatusPanel(true)} title="Status">⭕</button>
          <button className="icon-btn" onClick={() => setShowCallHistory(true)} title="Call History">📞</button>
          <button className="icon-btn" onClick={() => setShowStarredPanel(true)} title="Starred Messages">⭐</button>
          <button className="icon-btn" onClick={() => setShowGroupModal(true)} title="New Group">👥</button>
          <button className="icon-btn" onClick={logout} title="Logout">🚪</button>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', padding: '0 16px', gap: '24px' }}>
        <button 
          style={{ flex: 1, padding: '12px 0', border: 'none', background: 'none', color: activeTab === 'chats' ? 'var(--brand-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'chats' ? 600 : 500, cursor: 'pointer', borderBottom: activeTab === 'chats' ? '3px solid var(--brand-primary)' : '3px solid transparent' }}
          onClick={() => setActiveTab('chats')}
        >
          Chats
        </button>
        <button 
          style={{ flex: 1, padding: '12px 0', border: 'none', background: 'none', color: activeTab === 'communities' ? 'var(--brand-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'communities' ? 600 : 500, cursor: 'pointer', borderBottom: activeTab === 'communities' ? '3px solid var(--brand-primary)' : '3px solid transparent' }}
          onClick={() => setActiveTab('communities')}
        >
          Communities
        </button>
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
        {activeTab === 'communities' ? (
          filteredCommunities.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No communities found
            </div>
          ) : (
            filteredCommunities.map((comm: any) => (
              <div 
                key={comm.id} 
                className={`chat-list-item ${activeCommunity?.id === comm.id ? 'active' : ''}`}
                onClick={() => selectCommunity(comm)}
              >
                <div className="chat-avatar" style={{ borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {comm.avatarUrl ? <img src={comm.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} /> : getInitials(comm.name)}
                </div>
                <div className="chat-info">
                  <div className="chat-info-top">
                    <span className="chat-name">{comm.name}</span>
                  </div>
                  <div className="chat-preview">
                    <span className="chat-last-message">Community</span>
                  </div>
                </div>
              </div>
            ))
          )
        ) : search.trim() ? (
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
            {filteredChats.length > 0 && (
              <div style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', borderTop: '1px solid var(--border-light)', marginTop: 8 }}>
                Existing Chats
              </div>
            )}
            {filteredChats.map(chat => (
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

      {showGroupModal && (
        <NewGroupModal
          onClose={() => setShowGroupModal(false)}
          onGroupCreated={async (newChat) => {
            await loadChats();
            const loaded = (await api.getChatList()).find((c: any) => c.id === newChat.id);
            if (loaded) selectChat(loaded);
          }}
        />
      )}

      {showProfile && (
        <ProfilePanel onClose={() => setShowProfile(false)} />
      )}

      {showCallHistory && (
        <CallHistory onClose={() => setShowCallHistory(false)} />
      )}

      {showStatusPanel && (
        <StatusPanel onClose={() => setShowStatusPanel(false)} />
      )}
      {showStarredPanel && (
        <StarredMessagesPanel onClose={() => setShowStarredPanel(false)} onImageClick={(_) => {}} />
      )}
    </div>
  );
}

function ChatListItem({ chat, isActive, onClick }: { chat: any; isActive: boolean; onClick: () => void }) {
  const { typingUsers, togglePin, updateMute } = useChat();
  const typingInChat = typingUsers[chat.id] || [];
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  useEffect(() => {
    const hide = () => setShowMenu(false);
    window.addEventListener('click', hide);
    return () => window.removeEventListener('click', hide);
  }, []);

  return (
    <div 
      className={`chat-list-item ${isActive ? 'active' : ''}`} 
      onClick={onClick}
      onContextMenu={handleContextMenu}
    >
      <div className="chat-avatar">
        {chat.avatarUrl ? <img src={chat.avatarUrl} alt="" /> : getInitials(chat.title)}
      </div>
      <div className="chat-info">
        <div className="chat-info-top">
          <span className="chat-name">
            {chat.isPinned && <span className="pin-icon">📌 </span>}
            {chat.title || 'Unknown'}
          </span>
          {chat.lastMessageAt && (
            <span className={`chat-time ${chat.unreadCount > 0 ? 'unread' : ''}`}>
              {formatTime(chat.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="chat-preview">
          <span className="chat-last-message">
            {chat.isMuted && <span className="mute-icon">🔕 </span>}
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

      {showMenu && (
        <div 
          className="chat-item-context-menu" 
          style={{ top: menuPos.y, left: menuPos.x }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => { togglePin(chat.id, !chat.isPinned); setShowMenu(false); }}>
            {chat.isPinned ? '📌 Unpin Chat' : '📌 Pin Chat'}
          </button>
          <button onClick={() => { updateMute(chat.id, !chat.isMuted); setShowMenu(false); }}>
            {chat.isMuted ? '🔊 Unmute' : '🔕 Mute'}
          </button>
        </div>
      )}
    </div>
  );
}

// ===== LINK PREVIEW COMPONENT =====
function LinkPreview({ url, chatId }: { url: string; chatId: string }) {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getLinkPreview(chatId, url)
      .then(data => {
        if (active && data && data.title) {
          setPreview(data);
        }
      })
      .catch()
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [url, chatId]);

  if (loading || !preview) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="link-preview-card" onClick={e => e.stopPropagation()}>
      {preview.images?.length > 0 && typeof preview.images[0] === 'string' && (
        <img src={preview.images[0]} alt="" className="link-preview-img" />
      )}
      <div className="link-preview-content">
        <div className="link-preview-title">{preview.title}</div>
        <div className="link-preview-desc">{preview.description || preview.siteName}</div>
        <div className="link-preview-domain">
          {new URL(url).hostname.replace(/^www\./, '')}
        </div>
      </div>
    </a>
  );
}

function MessageText({ content, chatId }: { content: string; chatId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = content.length > 500;
  const displayContent = isLong && !isExpanded ? content.slice(0, 500) + '...' : content;

  return (
    <div className="message-text">
      <span>{displayContent}</span>
      {isLong && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--accent)', 
            marginLeft: 4, 
            fontWeight: 500, 
            fontSize: 13,
            padding: 0,
            cursor: 'pointer'
          }}
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      )}
      {/* Link Preview logic */}
      {(() => {
        const match = content.match(/https?:\/\/[^\s]+/);
        if (match) {
          return <LinkPreview url={match[0]} chatId={chatId} />;
        }
        return null;
      })()}
    </div>
  );
}

// ===== ENCRYPTED MEDIA VIEWER =====
function EncryptedMediaViewer({ msg, onImageClick }: { msg: any; onImageClick?: (url: string) => void }) {
  const isImage = msg.type === 'IMAGE' || msg.attachment?.mimeType?.startsWith('image/');
  const isAudio = msg.type === 'AUDIO';
  
  const rawUrl = msg.attachmentUrl || (msg.attachment?.storageKey ? `http://localhost:3000/uploads/${msg.attachment.storageKey}` : null);
  
  const { decryptedUrl, loading, error } = useDecryptedMedia(
    rawUrl,
    msg.mediaKey,
    msg.mediaIv,
    msg.attachmentMimeType || msg.attachment?.mimeType || (isImage ? 'image/jpeg' : 'audio/webm')
  );

  if (loading) return <div style={{ padding: 10, fontSize: 13, color: 'var(--text-secondary)' }}>Decrypting secure media...</div>;
  if (error) return <div style={{ padding: 10, fontSize: 13, color: '#ff2e74' }}>🔒 Failed to load secure media</div>;
  if (!decryptedUrl) return null;

  if (isImage) {
    return (
      <div className="message-media-container" onClick={() => onImageClick?.(decryptedUrl)} style={{ cursor: 'pointer' }}>
        <img 
          src={decryptedUrl} 
          alt="Attachment" 
          className="message-image" 
          style={{ filter: msg.status === 'sending' ? 'brightness(0.7)' : 'none' }}
        />
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="voice-message-player">
        <span className="voice-msg-icon">🎤</span>
        <audio controls preload="metadata" src={decryptedUrl} className="voice-audio-element" />
      </div>
    );
  }

  return null;
}

// ===== CONVERSATION COMPONENT =====
function Conversation() {
  const { 
    activeChat, 
    chats,
    messages, 
    loadMessages, 
    sendMessage, 
    sendMediaMessage, 
    deleteMessage, 
    deleteGroup,
    deselectChat,
    typingUsers,
    userPresence,
    starMessage,
    unstarMessage
  } = useChat();
  const { user } = useAuth();
  const { initiateCall } = useCall();
  const [input, setInput] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [forwardingMsg, setForwardingMsg] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMsg, setEditingMsg] = useState<any>(null);
  const [editInput, setEditInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatMessages = activeChat ? (messages[activeChat.id] || []) : [];
  const typingInChat = activeChat ? (typingUsers[activeChat.id] || []) : [];
  
  // Filtered messages for search
  const filteredMessages = searchQuery.trim()
    ? chatMessages.filter((msg: any) => 
        msg.textContent?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chatMessages;

  useEffect(() => {
    if (activeChat) loadMessages(activeChat.id);
  }, [activeChat, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleSend = () => {
    if (!input.trim() || !activeChat) return;
    sendMessage(activeChat.id, input.trim(), replyingTo?.id);
    setInput('');
    setReplyingTo(null);
    socketService.stopTyping(activeChat.id);
  };

  const handleEdit = () => {
    if (!editInput.trim() || !activeChat || !editingMsg) return;
    socketService.editMessage(activeChat.id, editingMsg.id, editInput.trim());
    setEditingMsg(null);
    setEditInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMsg) {
        handleEdit();
      } else {
        handleSend();
      }
    } else if (e.key === 'Escape' && editingMsg) {
      setEditingMsg(null);
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

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recordingChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      console.error('Mic access denied:', err);
      alert('Please allow microphone access to record voice messages.');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !activeChat) return;
    const recorder = mediaRecorderRef.current;
    recorder.onstop = () => {
      recorder.stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
      const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
      sendMediaMessage(activeChat.id, file, 'AUDIO');
      recordingChunksRef.current = [];
    };
    recorder.stop();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  };

  const cancelRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current.stop();
    recordingChunksRef.current = [];
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatRecordingTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Determine type
    let type: 'IMAGE' | 'VIDEO' | 'FILE' = 'FILE';
    if (file.type.startsWith('image/')) type = 'IMAGE';
    else if (file.type.startsWith('video/')) type = 'VIDEO';
    
    // Validate bounds (e.g. 15MB)
    if (file.size > 15 * 1024 * 1024) {
      alert('File is too large. Limit is 15MB.');
      return;
    }

    sendMediaMessage(activeChat.id, file, type);
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

  const isRestrictedChannel = activeChat && 
    (activeChat.type === 'CHANNEL' || (activeChat as any).isAnnouncement) && 
    activeChat.members?.find((m: any) => m.userId === user?.id)?.role === 'MEMBER';

  return (
    <>
    <div className="conversation-panel">
      <div className="conv-header">
        <button className="icon-btn mobile-back-btn" onClick={() => deselectChat()}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <div className="chat-avatar" style={{ width: 40, height: 40, fontSize: 16, cursor: 'pointer', marginRight: '12px' }} onClick={() => setShowContactInfo(!showContactInfo)}>
          {activeChat.avatarUrl ? <img src={activeChat.avatarUrl} alt="" /> : getInitials(activeChat.title)}
        </div>
        <div className="conv-header-info" style={{ cursor: 'pointer' }} onClick={() => setShowContactInfo(!showContactInfo)}>
          <div className="conv-header-name">{activeChat.title || 'Unknown'}</div>
          <div className={`conv-header-status ${typingInChat.length > 0 ? 'typing' : ''}`}>
            {typingInChat.length > 0
              ? 'typing...'
              : activeChat.type === 'GROUP'
                ? `${activeChat.members.length} members`
                : (() => {
                    const otherId = activeChat.members?.find((m: any) => m.userId !== user?.id)?.userId;
                    const presence = otherId ? userPresence[otherId] : null;
                    if (presence?.status === 'online') return 'online';
                    if (presence?.lastSeen) {
                      const d = new Date(presence.lastSeen);
                      return `last seen at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    }
                    return 'offline';
                  })()}
          </div>
        </div>
        <div className="sidebar-header-actions" style={{ position: 'relative' }}>
          <button className="icon-btn">🔍</button>
          <button className="icon-btn" onClick={() => setShowHeaderMenu(!showHeaderMenu)}>⋮</button>
          {showHeaderMenu && (
            <div className="message-menu" style={{ top: '100%', right: 0, minWidth: 150 }}>
              {activeChat.type === 'GROUP' && (
                <>
                  <button onClick={() => { setShowContactInfo(true); setShowHeaderMenu(false); }}>Group Info</button>
                  {activeChat.members.find((m: any) => m.userId === user?.id)?.role === 'OWNER' && (
                    <button 
                      style={{ color: '#ff2e74', position: 'relative', zIndex: 1000 }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        console.log('Delete Group MOUSE DOWN');
                      }}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Delete Group CLICKED. activeChat.id:', activeChat.id);
                        if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                          console.log('User confirmed deletion');
                          try {
                            await deleteGroup(activeChat.id);
                            console.log('Delete group task completed');
                          } catch (err) {
                            console.error('Delete group failed error:', err);
                          }
                          setShowHeaderMenu(false);
                        } else {
                          console.log('User cancelled deletion');
                          setShowHeaderMenu(false);
                        }
                      }}
                    >
                      Delete Group
                    </button>
                  )}
                </>
              )}
              {activeChat.type === 'DIRECT' && (
                <button onClick={() => { /* Block User */ setShowHeaderMenu(false); }}>Block</button>
              )}
            </div>
          )}
        </div>

        {/* Call buttons (direct + group chats) */}
        <>
          <button
            className="icon-btn"
            title="Voice call"
            onClick={() => {
              const other = activeChat.type === 'DIRECT'
                ? activeChat.members?.find((m: any) => m.userId !== user?.id)
                : null;
              initiateCall(
                activeChat.id, 'AUDIO',
                other?.displayName || activeChat.title || 'Unknown',
                other?.avatarUrl || activeChat.avatarUrl
              );
            }}
          >
            📞
          </button>
          <button
            className="icon-btn"
            title="Video call"
            onClick={() => {
              const other = activeChat.type === 'DIRECT'
                ? activeChat.members?.find((m: any) => m.userId !== user?.id)
                : null;
              initiateCall(
                activeChat.id, 'VIDEO',
                other?.displayName || activeChat.title || 'Unknown',
                other?.avatarUrl || activeChat.avatarUrl
              );
            }}
          >
            📹
          </button>
        </>

        {/* Search button in header */}
        <button className="icon-btn" style={{ marginLeft: 'auto', marginRight: 8 }} onClick={() => setShowSearch(!showSearch)}>
          🔍
        </button>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="message-search-bar">
          <input
            autoFocus
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="message-search-input"
          />
          <span className="message-search-count">
            {searchQuery.trim() ? `${filteredMessages.length} found` : ''}
          </span>
          <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>✕</button>
        </div>
      )}

      <div 
        className="messages-area" 
        style={activeChat?.wallpaperUrl ? {
          background: activeChat.wallpaperUrl.startsWith('#') ? activeChat.wallpaperUrl : `url(${activeChat.wallpaperUrl})`,
          backgroundSize: activeChat.wallpaperUrl.startsWith('#') ? 'auto' : 'cover'
        } : {}}
      >
        {filteredMessages.map((msg, i) => {
          const msgDate = formatDate(msg.createdAt);
          const showDate = msgDate !== lastDate;
          lastDate = msgDate;
          const isSent = msg.senderId === user?.id || msg.senderId === 'me';
          
          const prevMsg = i > 0 ? filteredMessages[i - 1] : null;
          const isFirstInGroup = !prevMsg || 
            prevMsg.senderId !== msg.senderId || 
            new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60 * 1000 ||
            showDate;

          return (
            <div key={msg.id || msg.clientTempId || i} id={`msg-${msg.id}`}>
              {showDate && (
                <div className="date-separator">
                  <span>{msgDate}</span>
                </div>
              )}
              <div className={`message-row ${isSent ? 'sent' : 'received'} ${isFirstInGroup ? 'first-in-group' : ''}`}>
                <div className={`message-bubble ${msg.type === 'IMAGE' || (msg as any).attachment ? 'media-bubble' : ''} ${msg.textContent ? 'has-text' : ''}`}>
                  {!isSent && activeChat.type === 'GROUP' && isFirstInGroup && (
                    <div className="message-sender-name" style={{
                      color: `hsl(${Math.abs(msg.senderId.split('').reduce((a:number, b:string) => a + b.charCodeAt(0), 0)) % 360}, 60%, 45%)`,
                      fontSize: '12.5px', fontWeight: 600, marginBottom: '2px', cursor: 'pointer'
                    }}>
                      {msg.sender?.displayName || 'Unknown'}
                    </div>
                  )}
                  {msg.isDeleted ? (
                    <span className="message-deleted">🚫 This message was deleted</span>
                  ) : (
                    <>
                      {/* Reply Preview */}
                      {(msg as any).replyToMessage && (
                        <div
                          className="message-reply-preview"
                          onClick={() => {
                            const el = document.getElementById(`msg-${(msg as any).replyToMessage.id}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              el.classList.add('highlight-msg');
                              setTimeout(() => el.classList.remove('highlight-msg'), 1500);
                            }
                          }}
                        >
                          <div className="reply-preview-sender">
                            {(msg as any).replyToMessage.sender?.displayName || 'You'}
                          </div>
                          <div className="reply-preview-text">
                            {(msg as any).replyToMessage.type === 'IMAGE' ? '📷 Photo' : 
                             (msg as any).replyToMessage.textContent || 'Message'}
                          </div>
                        </div>
                      )}
                      {/* Media Rendering */}
                      {(msg.type === 'IMAGE' || (msg as any).attachment?.mimeType?.startsWith('image/') || msg.type === 'AUDIO') && (
                        <EncryptedMediaViewer msg={msg} onImageClick={setPreviewImageUrl} />
                      )}

                      {msg.textContent && (
                        editingMsg?.id === msg.id ? (
                          <div className="message-edit-container">
                            <input
                              autoFocus
                              type="text"
                              value={editInput}
                              onChange={(e) => setEditInput(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="message-edit-input"
                            />
                            <div className="message-edit-actions">
                              <button onClick={() => setEditingMsg(null)}>✕</button>
                              <button onClick={handleEdit}>✓</button>
                            </div>
                          </div>
                        ) : (
                          <MessageText content={msg.textContent} chatId={activeChat.id} />
                        )
                      )}
                      <span className="message-meta">
                        {msg.isStarred && <span className="message-starred" style={{ marginRight: 4 }}>⭐</span>}
                        {msg.editedAt && <span className="message-edited">edited</span>}
                        <span className="message-time">{formatTime(msg.createdAt)}</span>
                            {isSent && !msg.isDeleted && (
                              <span className={`message-status ${msg.status?.toLowerCase()}`}>
                                {msg.status === 'read' ? (
                                  <svg viewBox="0 0 16 11" width="16" height="11" fill="currentColor">
                                    <path d="M15.01 1.91c-.34-.33-.9-.33-1.24 0L5.27 10.41 1.23 6.37c-.34-.34-.9-.34-1.24 0-.34.34-.34.9 0 1.24l4.66 4.66c.34.34.9.34 1.24 0l9.12-9.12c.34-.34.34-.9 0-1.24zM11.29 1.91c-.34-.33-.9-.33-1.24 0l-1.24 1.24 1.24 1.24 1.24-1.24c.34-.33.34-.9 0-1.24z"/>
                                  </svg>
                                ) : msg.status === 'delivered' ? (
                                  <svg viewBox="0 0 16 11" width="16" height="11" fill="currentColor">
                                    <path d="M15.01 1.91c-.34-.33-.9-.33-1.24 0L5.27 10.41 1.23 6.37c-.34-.34-.9-.34-1.24 0-.34.34-.34.9 0 1.24l4.66 4.66c.34.34.9.34 1.24 0l9.12-9.12c.34-.34.34-.9 0-1.24zM11.29 1.91c-.34-.33-.9-.33-1.24 0l-1.24 1.24 1.24 1.24 1.24-1.24c.34-.33.34-.9 0-1.24z" opacity="0.6"/>
                                  </svg>
                                ) : msg.status === 'sending' ? '🕐' : (
                                  <svg viewBox="0 0 16 11" width="16" height="11" fill="currentColor">
                                    <path d="M11.23 6.37c-.34-.33-.9-.33-1.24 0l-4.66 4.66-1.23-1.24c-.34-.33-.9-.33-1.24 0-.34.33-.34.9 0 1.24l1.85 1.85c.34.34.9.34 1.24 0l5.28-5.27c.34-.34.34-.9 0-1.24z" opacity="0.6"/>
                                  </svg>
                                )}
                              </span>
                            )}
                        <button 
                          className="message-options-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === msg.id ? null : msg.id);
                          }}
                        >
                          ⌄
                        </button>
                        {openMenuId === msg.id && (
                          <div className="message-menu">
                            <div className="reaction-quick-bar">
                              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                <button
                                  key={emoji}
                                  className="reaction-emoji-btn"
                                  onClick={() => {
                                    socketService.reactToMessage(activeChat!.id, msg.id, emoji);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                            <button onClick={() => { setReplyingTo(msg); setOpenMenuId(null); setTimeout(() => inputRef.current?.focus(), 100); }}>
                              ↩️ Reply
                            </button>
                            <button onClick={() => { setForwardingMsg(msg); setOpenMenuId(null); }}>
                              ↗️ Forward
                            </button>
                            <button onClick={() => {
                              msg.isStarred ? unstarMessage(activeChat!.id, msg.id) : starMessage(activeChat!.id, msg.id);
                              setOpenMenuId(null);
                            }}>
                              {msg.isStarred ? '⭐ Unstar' : '⭐ Star'}
                            </button>
                            {isSent && !msg.isDeleted && msg.type === 'TEXT' && (
                              <button onClick={() => { setEditingMsg(msg); setEditInput(msg.textContent || ''); setOpenMenuId(null); }}>
                                ✏️ Edit
                              </button>
                            )}
                            <button 
                              disabled={msg.status === 'sending'}
                              onClick={() => { if (msg.status !== 'sending') { deleteMessage(activeChat!.id, msg.id, false); setOpenMenuId(null); } }}
                            >
                              Delete for me
                            </button>
                            {isSent && !msg.isDeleted && (
                              <button 
                                disabled={msg.status === 'sending'}
                                onClick={() => { if (msg.status !== 'sending') { deleteMessage(activeChat!.id, msg.id, true); setOpenMenuId(null); } }}
                              >
                                Delete for everyone
                              </button>
                            )}
                          </div>
                        )}
                      </span>
                    </>
                  )}
                  {/* Reaction display */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="message-reactions-row">
                      {Object.entries(
                        msg.reactions.reduce((acc: Record<string, { count: number; users: string[] }>, r: any) => {
                          if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [] };
                          acc[r.emoji].count++;
                          acc[r.emoji].users.push(r.user?.displayName || 'Unknown');
                          return acc;
                        }, {})
                      ).map(([emoji, data]: [string, any]) => (
                        <button
                          key={emoji}
                          className={`message-reaction-pill ${data.users.some((n: string) => n === user?.displayName) ? 'mine' : ''}`}
                          title={data.users.join(', ')}
                          onClick={() => {
                            const myReaction = msg.reactions?.find((r: any) => r.userId === user?.id);
                            if (myReaction?.emoji === emoji) {
                              socketService.reactToMessage(activeChat!.id, msg.id, null);
                            } else {
                              socketService.reactToMessage(activeChat!.id, msg.id, emoji);
                            }
                          }}
                        >
                          {emoji} {data.count > 1 ? data.count : ''}
                        </button>
                      ))}
                    </div>
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
        {isRestrictedChannel ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '16px', background: 'var(--bg-panel)', color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>
            Only admins can send messages.
          </div>
        ) : (
          <>
            {/* Reply Preview Bar */}
            {replyingTo && (
              <div className="reply-bar">
                <div className="reply-bar-content">
                  <div className="reply-bar-sender">
                    {replyingTo.sender?.displayName || (replyingTo.senderId === 'me' || replyingTo.senderId === user?.id ? 'You' : 'Unknown')}
                  </div>
                  <div className="reply-bar-text">
                    {replyingTo.type === 'IMAGE' ? '📷 Photo' : replyingTo.textContent || 'Message'}
                  </div>
                </div>
                <button className="reply-bar-close" onClick={() => setReplyingTo(null)}>✕</button>
              </div>
            )}
            <div className="message-input-row" style={{ position: 'relative' }}>
              {showEmojiPicker && (
                <EmojiPicker
                  onSelect={(emoji) => {
                    setInput(prev => prev + emoji);
                    inputRef.current?.focus();
                  }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
              <button className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😀</button>
              <button className="icon-btn" onClick={handleAttachmentClick}>📎</button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*,video/*"
                onChange={handleFileChange}
              />

              <div className="message-input-box">
                <input
                  ref={inputRef}
                  type="text"
              placeholder="Type a message"
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          {isRecording ? (
            <div className="recording-bar">
              <button className="recording-cancel-btn" onClick={cancelRecording}>✕</button>
              <div className="recording-indicator">
                <span className="recording-dot" />
                <span className="recording-time">{formatRecordingTime(recordingTime)}</span>
              </div>
              <button className="recording-send-btn" onClick={stopRecording}>➤</button>
            </div>
          ) : (
            <>
              {input.trim() ? (
                <button className="send-btn" onClick={handleSend}>➤</button>
              ) : (
                <button className="mic-btn" onClick={startRecording} title="Record voice message">🎤</button>
              )}
            </>
          )}
        </div>
        </>
      )}
      </div>

      {/* Lightbox */}
      {previewImageUrl && (
        <div className="lightbox-overlay" onClick={() => setPreviewImageUrl(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={previewImageUrl} alt="Preview" />
            <button className="lightbox-close" onClick={() => setPreviewImageUrl(null)}>✕</button>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {forwardingMsg && (
        <div className="forward-modal-overlay" onClick={() => setForwardingMsg(null)}>
          <div className="forward-modal" onClick={e => e.stopPropagation()}>
            <div className="forward-modal-header">
              <h3>Forward message to</h3>
              <button onClick={() => setForwardingMsg(null)}>✕</button>
            </div>
            <div className="forward-modal-list">
              {chats.filter((c: any) => c.id !== activeChat?.id).map((c: any) => (
                <div 
                  key={c.id} 
                  className="forward-modal-item"
                  onClick={async () => {
                    const text = forwardingMsg.textContent ? `↗️ Forwarded: ${forwardingMsg.textContent}` : '↗️ Forwarded message';
                    sendMessage(c.id, text);
                    setForwardingMsg(null);
                  }}
                >
                  <div className="chat-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>
                    {c.avatarUrl ? <img src={c.avatarUrl} alt="" /> : getInitials(c.title)}
                  </div>
                  <span>{c.title || 'Chat'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Contact Info Panel - renders alongside conversation */}
    {showContactInfo && activeChat && (
      <ContactInfoPanel
        chat={activeChat}
        onClose={() => setShowContactInfo(false)}
        onImageClick={(url) => setPreviewImageUrl(url)}
      />
    )}
    </>
  );
}

// ===== MAIN CHAT PAGE =====
export function ChatPage() {
  const { activeChat, activeCommunity, selectChat, deselectChat, chats } = useChat();

  // Mobile back button support via History API
  useEffect(() => {
    if (!activeChat && !activeCommunity) return;

    // Push state so browser back navigates to chat list
    window.history.pushState({ chatOpen: true }, '');

    const handlePopState = () => {
      deselectChat();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeChat, activeCommunity, deselectChat]);

  return (
    <div className={`chat-layout ${activeChat || activeCommunity ? 'chat-open' : ''}`}>
      <Sidebar />
      {activeCommunity ? (
        <CommunityHome 
          community={activeCommunity} 
          onSelectChat={(chatId) => {
            const chat = chats.find((c: any) => c.id === chatId);
            if (chat) selectChat(chat);
          }} 
        />
      ) : (
        <Conversation />
      )}
    </div>
  );
}
