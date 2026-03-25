import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './ProfilePanel.css';

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

interface Props {
  onClose: () => void;
}

export function ProfilePanel({ onClose }: Props) {
  const { user } = useAuth();
  const [editingField, setEditingField] = useState<'name' | 'about' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEdit = (field: 'name' | 'about') => {
    setEditingField(field);
    setEditValue(field === 'name' ? (user?.displayName || '') : (user?.aboutText || ''));
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingField) return;
    setSaving(true);
    try {
      const payload = editingField === 'name'
        ? { displayName: editValue.trim() }
        : { aboutText: editValue.trim() };
      await api.updateProfile(payload);
      window.location.reload();
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
      setEditingField(null);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      await api.uploadAvatar(file);
      // Reload to reflect the new avatar everywhere
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      console.error('Failed to upload avatar', err);
      setAvatarPreview(null);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const displayAvatar = avatarPreview || user?.avatarUrl;

  return (
    <div className="profile-panel">
      <div className="profile-panel-header">
        <button onClick={onClose}>←</button>
        <h3>Profile</h3>
      </div>

      <div className="profile-panel-body">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Avatar */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper" onClick={handleAvatarClick}>
            {displayAvatar ? (
              <img src={displayAvatar} alt="Profile" />
            ) : (
              <span className="profile-avatar-initials">{getInitials(user?.displayName)}</span>
            )}
            <div className="profile-avatar-overlay">
              {uploading ? (
                <>
                  <span style={{ fontSize: 24 }}>⏳</span>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span>📷</span>
                  <span>Change</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div className="profile-field">
          <div className="profile-field-label">Your name</div>
          {editingField === 'name' ? (
            <>
              <input
                className="profile-edit-input"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                maxLength={25}
                autoFocus
              />
              <div className="profile-edit-actions">
                <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                <button className="save-btn" onClick={saveEdit} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          ) : (
            <div className="profile-field-row">
              <span className="profile-field-value">{user?.displayName || 'Unknown'}</span>
              <button className="profile-field-edit-btn" onClick={() => startEdit('name')}>✏️</button>
            </div>
          )}
        </div>

        <div className="profile-info-text">
          This is not your username or PIN. This name will be visible to your WhatsApp contacts.
        </div>

        {/* About */}
        <div className="profile-field">
          <div className="profile-field-label">About</div>
          {editingField === 'about' ? (
            <>
              <input
                className="profile-edit-input"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                maxLength={140}
                autoFocus
              />
              <div className="profile-edit-actions">
                <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                <button className="save-btn" onClick={saveEdit} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          ) : (
            <div className="profile-field-row">
              <span className="profile-field-value">{user?.aboutText || 'Hey there! I am using WhatsApp'}</span>
              <button className="profile-field-edit-btn" onClick={() => startEdit('about')}>✏️</button>
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="profile-phone-section">
          <div className="profile-phone-label">Phone</div>
          <div className="profile-phone-value">{user?.phoneNumber || '—'}</div>
        </div>
      </div>
    </div>
  );
}
