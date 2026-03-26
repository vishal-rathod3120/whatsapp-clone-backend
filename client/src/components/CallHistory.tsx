import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './CallHistory.css';

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatCallTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (d.toDateString() === now.toDateString()) return time;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${time}`;
}

function formatDuration(startDate: string, endDate?: string) {
  if (!endDate) return '';
  const diff = Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}m ${s}s`;
}

interface CallHistoryProps {
  onClose: () => void;
}

export function CallHistory({ onClose }: CallHistoryProps) {
  const { user } = useAuth();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'missed'>('all');

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    setLoading(true);
    try {
      const data = await api.getCallHistory();
      setCalls(data.items || []);
    } catch (err) {
      console.error('Failed to load call history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = tab === 'missed'
    ? calls.filter(c => c.status === 'MISSED' || c.status === 'REJECTED')
    : calls;

  return (
    <div className="call-history-panel">
      <div className="call-history-header">
        <button className="call-history-back" onClick={onClose}>←</button>
        <h3>Calls</h3>
      </div>

      <div className="call-history-tabs">
        <button
          className={`call-history-tab ${tab === 'all' ? 'active' : ''}`}
          onClick={() => setTab('all')}
        >
          All
        </button>
        <button
          className={`call-history-tab ${tab === 'missed' ? 'active' : ''}`}
          onClick={() => setTab('missed')}
        >
          Missed
        </button>
      </div>

      <div className="call-history-list">
        {loading ? (
          <div className="call-history-empty">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="call-history-empty">
            {tab === 'missed' ? 'No missed calls' : 'No call history'}
          </div>
        ) : (
          filtered.map(call => {
            const isCaller = call.callerId === user?.id;
            const otherUser = isCaller
              ? call.chat?.members?.find((m: any) => m.userId !== user?.id)?.user
              : call.caller;
            const name = otherUser?.displayName || 'Unknown';
            const avatar = otherUser?.avatarUrl;
            const isMissed = call.status === 'MISSED' || call.status === 'REJECTED';
            const isIncoming = !isCaller;

            return (
              <div key={call.id} className="call-history-item">
                <div className="call-history-avatar">
                  {avatar ? <img src={avatar} alt="" /> : getInitials(name)}
                </div>
                <div className="call-history-info">
                  <div className={`call-history-name ${isMissed ? 'missed' : ''}`}>
                    {name}
                  </div>
                  <div className="call-history-meta">
                    <span className={`call-history-direction ${isMissed ? 'missed' : ''}`}>
                      {isMissed ? '↙' : isIncoming ? '↙' : '↗'}
                    </span>
                    <span>{formatCallTime(call.createdAt)}</span>
                    {call.endedAt && call.answeredAt && (
                      <span className="call-history-duration">
                        · {formatDuration(call.answeredAt, call.endedAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="call-history-type">
                  {call.type === 'VIDEO' ? '📹' : '📞'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
