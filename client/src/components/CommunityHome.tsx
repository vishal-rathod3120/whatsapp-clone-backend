import { useChat, type Community } from '../context/ChatContext';
import './CommunityHome.css';

interface Props {
  community: Community;
  onSelectChat: (chatId: string) => void;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function CommunityHome({ community, onSelectChat }: Props) {
  const { chats } = useChat();

  // Find the announcement channel
  const announcementChat = chats.find((c: any) => c.id === community.chats.find((ch: any) => ch.isAnnouncement)?.id);
  const subgroups = chats.filter((c: any) => c.communityId === community.id && !c.isAnnouncement);

  return (
    <div className="community-home-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Header Banner */}
      <div className="community-header" style={{ padding: '32px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div className="community-avatar" style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 600 }}>
          {community.avatarUrl ? <img src={community.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} /> : getInitials(community.name)}
        </div>
        <div>
          <h2 style={{ fontSize: 24, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{community.name}</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>Community • {community._count?.members || 1} members</p>
          {community.description && <p style={{ margin: '8px 0 0 0', fontSize: 15, color: 'var(--text-primary)', opacity: 0.9 }}>{community.description}</p>}
        </div>
      </div>

      {/* Announcements Card */}
      <div style={{ padding: 24 }}>
        <div 
          onClick={() => announcementChat && onSelectChat(announcementChat.id)}
          style={{ 
            background: 'var(--bg-panel)', 
            padding: 20, 
            borderRadius: 'var(--radius-lg)', 
            cursor: 'pointer',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
            transition: 'background 0.2s',
          }}
          className="hoverable-card"
        >
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: '#dcf8c6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            📢
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: 16 }}>Announcements</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Read official updates from the admins</p>
          </div>
        </div>

        {/* Subgroups */}
        <h3 style={{ fontSize: 18, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Groups</h3>
        
        {subgroups.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-panel)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            No groups have been linked to this community yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {subgroups.map((group: any) => (
              <div 
                key={group.id}
                onClick={() => onSelectChat(group.id)}
                style={{ 
                  background: 'var(--bg-panel)', 
                  padding: 16, 
                  borderRadius: 'var(--radius-md)', 
                  cursor: 'pointer',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
                className="hoverable-card"
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>
                  {group.avatarUrl ? <img src={group.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : getInitials(group.title || '?')}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{group.title}</div>
                  {group.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{group.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
