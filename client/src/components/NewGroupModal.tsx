import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './NewGroupModal.css';

interface User {
  id: string;
  displayName: string;
  phoneNumber: string;
  avatarUrl?: string;
}

interface Props {
  onClose: () => void;
  onGroupCreated: (newChat: any) => void;
}

export function NewGroupModal({ onClose, onGroupCreated }: Props) {
  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // Handle user search
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await api.searchUsers(search);
        // Exclude already selected users from results
        const filtered = (users || []).filter((u: User) => !selectedUsers.find(su => su.id === u.id));
        setSearchResults(filtered);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, selectedUsers]);

  const toggleUser = (user: User) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
      setSearch(''); // Clear search after picking someone
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || selectedUsers.length === 0) {
      setError('Title and at least 1 member are required');
      return;
    }
    setError('');
    setIsCreating(true);
    try {
      const data = await api.createGroupChat(title.trim(), selectedUsers.map(u => u.id));
      const chat = data.chat || data.data || data;
      onGroupCreated(chat);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button className="icon-btn" onClick={onClose}>✖</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label>Group Subject</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Family, Friends, Work..." 
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>Add Members ({selectedUsers.length})</label>
            
            {/* Selected Users Chips */}
            {selectedUsers.length > 0 && (
              <div className="selected-users">
                {selectedUsers.map(u => (
                  <div key={u.id} className="user-chip">
                    <span>{u.displayName.split(' ')[0]}</span>
                    <button onClick={() => toggleUser(u)}>✖</button>
                  </div>
                ))}
              </div>
            )}

            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by name or number..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="search-results">
            {isSearching ? (
              <div className="search-msg">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="user-list">
                {searchResults.map(u => (
                  <div key={u.id} className="user-list-item" onClick={() => toggleUser(u)}>
                    <div className="user-avatar">{u.displayName[0].toUpperCase()}</div>
                    <div className="user-info">
                      <div className="user-name">{u.displayName}</div>
                      <div className="user-phone">{u.phoneNumber}</div>
                    </div>
                    <button className="add-btn">Add</button>
                  </div>
                ))}
              </div>
            ) : search.trim() ? (
              <div className="search-msg">No contacts found</div>
            ) : null}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn-primary" 
            onClick={handleCreate}
            disabled={isCreating || !title.trim() || selectedUsers.length === 0}
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
