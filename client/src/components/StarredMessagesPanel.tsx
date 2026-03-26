import { useEffect } from 'react';
import { useChat } from '../context/ChatContext';

interface Props {
  onClose: () => void;
  onImageClick: (url: string) => void;
}

export function StarredMessagesPanel({ onClose, onImageClick }: Props) {
  const { starredMessages, fetchStarredMessages, unstarMessage } = useChat();

  useEffect(() => {
    fetchStarredMessages();
  }, [fetchStarredMessages]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (isoDate: string) => {
    const date = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="call-history-overlay">
      <div className="call-history-panel" style={{ width: 400 }}>
        <div className="call-history-header">
          <button className="back-btn" onClick={onClose}>←</button>
          <h2>Starred Messages</h2>
        </div>

        <div className="call-history-list" style={{ padding: 16 }}>
          {starredMessages.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
              <h3>No starred messages</h3>
              <p style={{ marginTop: 8, fontSize: 14 }}>Hover over a message and click the arrow to star it.</p>
            </div>
          ) : (
            starredMessages.map((msg: any) => (
              <div key={msg.id} style={{ 
                background: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius-md)', 
                padding: 12, 
                marginBottom: 12,
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {msg.chatAvatar ? (
                      <img src={msg.chatAvatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                        {msg.chatTitle?.substring(0, 1).toUpperCase() || '?'}
                      </div>
                    )}
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{msg.chatTitle || 'Unknown Chat'}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>· {formatDateLabel(msg.createdAt)}</span>
                  </div>
                  <button 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex' }}
                    onClick={() => unstarMessage(msg.chatId, msg.id)}
                    title="Unstar message"
                  >
                    ⭐
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 500, color: 'var(--accent)' }}>{msg.sender?.displayName || 'Unknown'}</span>
                </div>

                <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {msg.type === 'TEXT' && (
                    <span style={{ wordBreak: 'break-word' }}>{msg.textContent}</span>
                  )}
                  {msg.type === 'IMAGE' && (
                     <div style={{ cursor: 'pointer' }} onClick={() => onImageClick(msg.attachmentUrl)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                          <span>🖼️ Photo</span>
                        </div>
                     </div>
                  )}
                  {msg.type === 'VIDEO' && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                        <span>🎥 Video</span>
                     </div>
                  )}
                  {msg.type === 'AUDIO' && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                        <span>🎤 Voice message</span>
                     </div>
                  )}
                  {msg.type === 'FILE' && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                        <span>📄 File</span>
                     </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
