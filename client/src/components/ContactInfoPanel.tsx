import { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './ContactInfoPanel.css';

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Block/Unblock Button Component
function BlockButton({ userId, displayName }: { userId: string; displayName?: string }) {
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const action = blocked ? 'unblock' : 'block';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${displayName || 'this contact'}?`)) return;
    setLoading(true);
    try {
      if (blocked) {
        await api.unblockUser(userId);
        setBlocked(false);
      } else {
        await api.blockUser(userId);
        setBlocked(true);
      }
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`contact-info-action-btn ${blocked ? 'success' : 'danger'}`}
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? '...' : blocked ? '✅ Unblock Contact' : '🚫 Block Contact'}
    </button>
  );
}

interface Props {
  chat: any;
  onClose: () => void;
  onImageClick: (url: string) => void;
}

export function ContactInfoPanel({ chat, onClose, onImageClick }: Props) {
  const { user } = useAuth();
  const { messages, deleteGroup, addGroupMembers, removeGroupMember, updateMemberRole, updateGroupInfo, updateMute, updateWallpaper } = useChat();
  const chatMessages = messages[chat.id] || [];

  // Local UI state
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(chat.title || '');
  const [saving, setSaving] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [memberMenuId, setMemberMenuId] = useState<string | null>(null);

  // Current user's role in group
  const myMember = chat.type === 'GROUP'
    ? chat.members?.find((m: any) => m.userId === user?.id)
    : null;
  const isOwner = myMember?.role === 'OWNER';
  const isAdmin = myMember?.role === 'ADMIN';
  const canManage = isOwner || isAdmin;

  // Extract media messages (images)
  const mediaMessages = chatMessages.filter((msg: any) => {
    if (msg.isDeleted) return false;
    if (msg.type === 'IMAGE') return true;
    if (msg.attachment?.mimeType?.startsWith('image/')) return true;
    if (msg.attachmentUrl && msg.attachmentMimeType?.startsWith('image/')) return true;
    return false;
  });

  const getImageUrl = (msg: any) => {
    return msg.attachmentUrl ||
      (msg.attachment?.storageKey ? `http://localhost:3000/uploads/${msg.attachment.storageKey}` : null);
  };

  // For DIRECT chats, find the other member's info
  const otherMember = chat.type === 'DIRECT'
    ? chat.members?.find((m: any) => m.userId !== user?.id) || chat.members?.[0]
    : null;

  // Handlers
  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim() === chat.title) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    try {
      await updateGroupInfo(chat.id, { title: newName.trim() });
      setEditingName(false);
    } catch (err) {
      alert('Failed to update group name');
    } finally {
      setSaving(false);
    }
  };

  const handleSearchUsers = async (q: string) => {
    setMemberSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const results = await api.searchUsers(q);
      const existingIds = new Set(chat.members?.map((m: any) => m.userId) || []);
      setSearchResults(
        (results || []).filter((u: any) => !existingIds.has(u.id))
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await addGroupMembers(chat.id, [userId]);
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      setMemberSearch('');
      setSearchResults([]);
    } catch (err) {
      alert('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      await removeGroupMember(chat.id, userId);
      setMemberMenuId(null);
    } catch (err) {
      alert('Failed to remove member');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await updateMemberRole(chat.id, userId, newRole);
      setMemberMenuId(null);
    } catch (err) {
      alert('Failed to change role');
    }
  };

  return (
    <div className="contact-info-panel">
      {/* Header */}
      <div className="contact-info-header">
        <button onClick={onClose}>✕</button>
        <h3>{chat.type === 'GROUP' ? 'Group Info' : 'Contact Info'}</h3>
      </div>

      {/* Body */}
      <div className="contact-info-body">
        {/* Avatar & Name */}
        <div className="contact-info-avatar-section">
          <div className="contact-info-avatar">
            {chat.avatarUrl ? (
              <img src={chat.avatarUrl} alt="" />
            ) : (
              <span className="contact-info-avatar-initials">{getInitials(chat.title)}</span>
            )}
          </div>

          {/* Editable Group Name */}
          {chat.type === 'GROUP' && editingName ? (
            <div className="contact-info-edit-name">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                maxLength={50}
                className="contact-info-name-input"
              />
              <div className="contact-info-edit-actions">
                <button onClick={() => { setEditingName(false); setNewName(chat.title || ''); }}>Cancel</button>
                <button className="save" onClick={handleSaveName} disabled={saving}>
                  {saving ? '...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="contact-info-name" onClick={() => {
              if (chat.type === 'GROUP' && canManage) {
                setEditingName(true);
                setNewName(chat.title || '');
              }
            }} style={chat.type === 'GROUP' && canManage ? { cursor: 'pointer' } : {}}>
              {chat.title || 'Unknown'}
              {chat.type === 'GROUP' && canManage && <span className="contact-info-edit-icon"> ✏️</span>}
            </div>
          )}

          <div className="contact-info-subtitle">
            {chat.type === 'GROUP'
              ? `Group · ${chat.members?.length || 0} members`
              : <span className="contact-info-online-badge">Online</span>
            }
          </div>
        </div>

        <div className="contact-info-divider" />

        {/* About / Description - Direct chats */}
        {chat.type === 'DIRECT' && otherMember && (
          <>
            <div className="contact-info-section">
              <div className="contact-info-field">
                <div className="contact-info-field-label">About</div>
                <div className="contact-info-field-value">
                  {otherMember.aboutText || 'Hey there! I am using WhatsApp'}
                </div>
              </div>
              {otherMember.phoneNumber && (
                <div className="contact-info-field">
                  <div className="contact-info-field-label">Phone</div>
                  <div className="contact-info-field-value">{otherMember.phoneNumber}</div>
                </div>
              )}
            </div>
            <div className="contact-info-divider" />
          </>
        )}

        {/* Disappearing Messages Toggle */}
        <div className="contact-info-section">
          <div className="contact-info-field">
            <div className="contact-info-field-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              ⏱️ Disappearing Messages
            </div>
            <select
              value={chat.disappearingTimer || ''}
              onChange={async (e) => {
                const val = e.target.value;
                const timer = val ? parseInt(val, 10) : null;
                try {
                  await api.updateDisappearingTimer(chat.id, timer);
                } catch (err) {
                  console.error('Failed to update timer', err);
                  alert('Error updating disappearing messages timer');
                }
              }}
              style={{
                width: '100%',
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer'
              }}
            >
              <option value="">Off</option>
              <option value="86400">24 hours</option>
              <option value="604800">7 days</option>
              <option value="7776000">90 days</option>
            </select>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
              Make messages in this chat disappear after the selected time.
            </div>
          </div>
        </div>
        <div className="contact-info-divider" />

        {/* Mute Notifications */}
        <div className="contact-info-section">
          <div className="contact-info-field">
            <div className="contact-info-field-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              🔕 Mute Notifications
            </div>
            <select
              value={chat.isMuted ? (chat.mutedUntil || 'always') : 'none'}
              onChange={async (e) => {
                const val = e.target.value;
                if (val === 'none') {
                  await updateMute(chat.id, false, null);
                } else {
                  const until = val === 'always' ? null : val;
                  await updateMute(chat.id, true, until);
                }
              }}
              style={{
                width: '100%',
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer'
              }}
            >
              <option value="none">Off</option>
              <option value={new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()}>8 hours</option>
              <option value={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}>1 week</option>
              <option value="always">Always</option>
            </select>
          </div>
        </div>
        <div className="contact-info-divider" />

        {/* Chat Wallpaper */}
        <div className="contact-info-section">
          <div className="contact-info-field">
            <div className="contact-info-field-label">🖼️ Chat Wallpaper</div>
            <select
              value={chat.wallpaperUrl || ''}
              onChange={async (e) => {
                const val = e.target.value || null;
                await updateWallpaper(chat.id, val);
              }}
              style={{
                width: '100%',
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer'
              }}
            >
              <option value="">Default</option>
              <option value="#f0f2f5">Light Gray</option>
              <option value="#e5ddd5">Classic WhatsApp</option>
              <option value="#0b141a">Obsidian</option>
              <option value="#2c3e50">Midnight Blue</option>
              <option value="#27ae60">Forest Green</option>
            </select>
          </div>
        </div>
        <div className="contact-info-divider" />

        {/* Shared Media */}
        <div className="contact-info-section">
          <div className="contact-info-section-title">
            Shared Media ({mediaMessages.length})
          </div>
        </div>
        {mediaMessages.length > 0 ? (
          <div className="contact-info-media-grid">
            {mediaMessages.slice(0, 9).map((msg: any) => {
              const imgUrl = getImageUrl(msg);
              if (!imgUrl) return null;
              return (
                <div
                  key={msg.id}
                  className="contact-info-media-item"
                  onClick={() => onImageClick(imgUrl)}
                >
                  <img src={imgUrl} alt="Shared media" loading="lazy" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="contact-info-media-empty">
            No shared media yet
          </div>
        )}

        <div className="contact-info-divider" />

        {/* Group Members */}
        {chat.type === 'GROUP' && chat.members && (
          <>
            <div className="contact-info-members-header">
              <span>{chat.members.length} Members</span>
              {canManage && (
                <button
                  className="contact-info-add-member-btn"
                  onClick={() => setShowAddMember(!showAddMember)}
                >
                  {showAddMember ? '✕' : '+ Add'}
                </button>
              )}
            </div>

            {/* Add Member Search */}
            {showAddMember && (
              <div className="contact-info-add-member-section">
                <input
                  className="contact-info-search-input"
                  placeholder="Search users to add..."
                  value={memberSearch}
                  onChange={e => handleSearchUsers(e.target.value)}
                  autoFocus
                />
                {searching && <div className="contact-info-searching">Searching...</div>}
                {searchResults.map((u: any) => (
                  <div key={u.id} className="contact-info-member-item contact-info-search-result" onClick={() => handleAddMember(u.id)}>
                    <div className="contact-info-member-avatar">
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" /> : <span>{getInitials(u.displayName)}</span>}
                    </div>
                    <div className="contact-info-member-details">
                      <div className="contact-info-member-name">{u.displayName}</div>
                    </div>
                    <span className="contact-info-add-icon">+</span>
                  </div>
                ))}
                {memberSearch.length >= 2 && !searching && searchResults.length === 0 && (
                  <div className="contact-info-media-empty">No users found</div>
                )}
              </div>
            )}

            {/* Members List */}
            {chat.members.map((member: any) => (
              <div
                key={member.userId}
                className="contact-info-member-item"
                style={{ position: 'relative' }}
                onClick={() => {
                  if (canManage && member.userId !== user?.id && member.role !== 'OWNER') {
                    setMemberMenuId(memberMenuId === member.userId ? null : member.userId);
                  }
                }}
              >
                <div className="contact-info-member-avatar">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" />
                  ) : (
                    <span>{getInitials(member.displayName)}</span>
                  )}
                </div>
                <div className="contact-info-member-details">
                  <div className="contact-info-member-name">
                    {member.displayName || 'Unknown'}
                    {member.userId === user?.id && <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}> (You)</span>}
                  </div>
                </div>
                {(member.role === 'OWNER' || member.role === 'ADMIN') && (
                  <span className="contact-info-member-role">{member.role}</span>
                )}

                {/* Member Context Menu */}
                {memberMenuId === member.userId && (
                  <div className="contact-info-member-menu" onClick={e => e.stopPropagation()}>
                    {isOwner && member.role === 'MEMBER' && (
                      <button onClick={() => handleChangeRole(member.userId, 'ADMIN')}>
                        ⬆️ Make Admin
                      </button>
                    )}
                    {isOwner && member.role === 'ADMIN' && (
                      <button onClick={() => handleChangeRole(member.userId, 'MEMBER')}>
                        ⬇️ Remove Admin
                      </button>
                    )}
                    <button className="danger" onClick={() => handleRemoveMember(member.userId)}>
                      🚫 Remove from Group
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div className="contact-info-divider" />
          </>
        )}

        {/* Actions */}
        <div className="contact-info-actions">
          {chat.type === 'GROUP' && isOwner && (
            <button
              className="contact-info-action-btn danger"
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                  await deleteGroup(chat.id);
                }
              }}
            >
              🗑️ Delete Group
            </button>
          )}
          {chat.type === 'GROUP' && !isOwner && (
            <button
              className="contact-info-action-btn danger"
              onClick={async () => {
                if (window.confirm('Leave this group?')) {
                  await removeGroupMember(chat.id, user?.id || '');
                }
              }}
            >
              🚪 Leave Group
            </button>
          )}
          {chat.type === 'DIRECT' && otherMember && (
            <BlockButton userId={otherMember.userId} displayName={otherMember.displayName} />
          )}
        </div>
      </div>
    </div>
  );
}
