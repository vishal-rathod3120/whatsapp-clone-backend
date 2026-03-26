import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './StatusPanel.css';

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const BG_COLORS = ['#00a884', '#075e54', '#128c7e', '#25d366', '#34b7f1', '#e91e63', '#9c27b0', '#ff5722', '#607d8b', '#1a237e'];

interface StatusPanelProps {
  onClose: () => void;
}

export function StatusPanel({ onClose }: StatusPanelProps) {
  const { user } = useAuth();
  const [myStatuses, setMyStatuses] = useState<any[]>([]);
  const [contactStatuses, setContactStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [viewIndex, setViewIndex] = useState(0);

  useEffect(() => { loadStatuses(); }, []);

  const loadStatuses = async () => {
    setLoading(true);
    try {
      const [mine, contacts] = await Promise.all([
        api.getMyStatuses(),
        api.getContactStatuses(),
      ]);
      setMyStatuses(mine);
      setContactStatuses(contacts);
    } catch (err) {
      console.error('Failed to load statuses:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="status-panel">
      <div className="status-header">
        <button className="status-back" onClick={onClose}>←</button>
        <h3>Status</h3>
      </div>

      {/* Create status section */}
      <div className="status-my-section" onClick={() => setShowCreate(true)}>
        <div className="status-my-avatar">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" />
          ) : (
            <span>{getInitials(user?.displayName)}</span>
          )}
          <div className="status-add-icon">+</div>
        </div>
        <div className="status-my-info">
          <div className="status-my-name">My status</div>
          <div className="status-my-hint">
            {myStatuses.length > 0
              ? `${myStatuses.length} update${myStatuses.length > 1 ? 's' : ''} · ${timeAgo(myStatuses[0].createdAt)}`
              : 'Tap to add status update'
            }
          </div>
        </div>
      </div>

      {/* Recent updates */}
      <div className="status-section-title">Recent updates</div>
      <div className="status-list">
        {loading ? (
          <div className="status-empty">Loading...</div>
        ) : contactStatuses.length === 0 ? (
          <div className="status-empty">No recent updates</div>
        ) : (
          contactStatuses.map((group: any) => (
            <div
              key={group.user.id}
              className="status-contact-item"
              onClick={() => { setViewingUser(group); setViewIndex(0); }}
            >
              <div className={`status-contact-ring ${group.hasUnviewed ? 'unviewed' : 'viewed'}`}>
                <div className="status-contact-avatar">
                  {group.user.avatarUrl ? (
                    <img src={group.user.avatarUrl} alt="" />
                  ) : (
                    <span>{getInitials(group.user.displayName)}</span>
                  )}
                </div>
              </div>
              <div className="status-contact-info">
                <div className="status-contact-name">{group.user.displayName}</div>
                <div className="status-contact-time">{timeAgo(group.statuses[group.statuses.length - 1].createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Status Creator Modal */}
      {showCreate && (
        <StatusCreator
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadStatuses(); }}
        />
      )}

      {/* Status Viewer */}
      {viewingUser && (
        <StatusViewer
          group={viewingUser}
          initialIndex={viewIndex}
          onClose={() => setViewingUser(null)}
        />
      )}
    </div>
  );
}

// Status Creator Component
function StatusCreator({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [sending, setSending] = useState(false);

  const handleCreate = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await api.createTextStatus(text.trim(), bgColor);
      onCreated();
    } catch (err) {
      console.error('Failed to create status:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="status-creator-overlay">
      <div className="status-creator-header">
        <button className="status-back" onClick={onClose}>✕</button>
        <span>Create status</span>
        <button className="status-send-btn" onClick={handleCreate} disabled={!text.trim() || sending}>
          {sending ? '...' : '➤'}
        </button>
      </div>
      <div className="status-creator-body" style={{ background: bgColor }}>
        <textarea
          className="status-text-input"
          placeholder="Type a status"
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={700}
          autoFocus
        />
      </div>
      <div className="status-color-picker">
        {BG_COLORS.map(c => (
          <button
            key={c}
            className={`status-color-swatch ${c === bgColor ? 'active' : ''}`}
            style={{ background: c }}
            onClick={() => setBgColor(c)}
          />
        ))}
      </div>
    </div>
  );
}

// Status Viewer Component
function StatusViewer({ group, initialIndex, onClose }: { group: any; initialIndex: number; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const progressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const status = group.statuses[currentIndex];

  useEffect(() => {
    // Mark as viewed
    if (status && !status.viewed) {
      api.markStatusViewed(status.id).catch(() => {});
    }

    // Auto-advance after 5 seconds
    progressRef.current = setTimeout(() => {
      if (currentIndex < group.statuses.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onClose();
      }
    }, 5000);

    return () => {
      if (progressRef.current) clearTimeout(progressRef.current);
    };
  }, [currentIndex, status]);

  if (!status) return null;

  const goNext = () => {
    if (currentIndex < group.statuses.length - 1) setCurrentIndex(prev => prev + 1);
    else onClose();
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  return (
    <div className="status-viewer-overlay" onClick={goNext}>
      {/* Progress bars */}
      <div className="status-viewer-progress">
        {group.statuses.map((_: any, i: number) => (
          <div key={i} className="status-progress-bar">
            <div
              className={`status-progress-fill ${i < currentIndex ? 'done' : i === currentIndex ? 'active' : ''}`}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="status-viewer-header">
        <div className="status-viewer-avatar">
          {group.user.avatarUrl ? (
            <img src={group.user.avatarUrl} alt="" />
          ) : (
            <span>{getInitials(group.user.displayName)}</span>
          )}
        </div>
        <div className="status-viewer-info">
          <div className="status-viewer-name">{group.user.displayName}</div>
          <div className="status-viewer-time">{timeAgo(status.createdAt)}</div>
        </div>
        <button className="status-viewer-close" onClick={(e) => { e.stopPropagation(); onClose(); }}>✕</button>
      </div>

      {/* Content */}
      <div
        className="status-viewer-content"
        style={status.type === 'TEXT' ? { background: status.bgColor || '#00a884' } : {}}
      >
        {status.type === 'TEXT' ? (
          <div className="status-viewer-text">{status.textContent}</div>
        ) : (
          <>
            <img src={status.imageUrl} alt="" className="status-viewer-image" />
            {status.caption && <div className="status-viewer-caption">{status.caption}</div>}
          </>
        )}
      </div>

      {/* Nav zones */}
      <div className="status-nav-prev" onClick={(e) => { e.stopPropagation(); goPrev(); }} />
    </div>
  );
}
