import { useState, useRef, useEffect } from 'react';
import './EmojiPicker.css';

const EMOJI_CATEGORIES: { name: string; icon: string; emojis: string[] }[] = [
  {
    name: 'Smileys',
    icon: '😀',
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
      '😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
      '🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢',
      '🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏',
      '😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷',
      '🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠',
      '🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','😮',
      '😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😥',
      '😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱',
      '😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡',
      '👹','👺','👻','👽','👾','🤖',
    ],
  },
  {
    name: 'Gestures',
    icon: '👋',
    emojis: [
      '👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌',
      '🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉',
      '👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛',
      '🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅',
      '🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠',
      '🫀','🫁','🦷','🦴','👀','👁️','👅','👄',
    ],
  },
  {
    name: 'Hearts',
    icon: '❤️',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
      '❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💝','💘',
      '💟','♥️','💋','💌','💐','🌹','🥀','🌺','🌸','💮',
      '🏵️','🌻','🌼','🌷',
    ],
  },
  {
    name: 'Animals',
    icon: '🐶',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨',
      '🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒',
      '🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇',
      '🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞',
      '🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🐢','🐍','🦎',
      '🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳',
      '🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛',
    ],
  },
  {
    name: 'Food',
    icon: '🍔',
    emojis: [
      '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐',
      '🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑',
      '🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅',
      '🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳',
      '🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟',
      '🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘',
      '🫕','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤',
      '🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨',
      '🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿',
      '🍩','🍪','☕','🍵','🧃','🥤','🍶','🍺','🍻','🥂',
    ],
  },
  {
    name: 'Objects',
    icon: '⚽',
    emojis: [
      '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱',
      '🏓','🏸','🏒','🥅','⛳','🏹','🎣','🤿','🥊','🥋',
      '🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂',
      '🎮','🕹️','🎲','♟️','🎯','🎳','🎰','🎤','🎧','🎼',
      '🎹','🥁','🪘','🎷','🎺','🪗','🎸','🎻','🎬','🏆',
      '🥇','🥈','🥉','🏅','🎖️','🎗️','🎪','🎭','🎨','🎡',
    ],
  },
  {
    name: 'Symbols',
    icon: '✅',
    emojis: [
      '✅','❌','❓','❗','‼️','⁉️','💯','🔥','✨','⭐',
      '🌟','💫','💥','💢','💦','💨','🕳️','💣','💬','👁️‍🗨️',
      '🗨️','🗯️','💭','💤','🔔','🔕','🎵','🎶','🏳️','🏴',
      '🚩','🏁','♻️','⚠️','🚸','⛔','🚫','🚳','🚭','🚯',
      '📵','🔞','☢️','☣️','⬆️','↗️','➡️','↘️','⬇️','↙️',
      '⬅️','↖️','↕️','↔️','↩️','↪️','⤴️','⤵️','🔄','🔃',
      '🔀','🔁','🔂','▶️','⏩','⏭️','⏯️','◀️','⏪','⏮️',
      '🔼','⏫','🔽','⏬','⏸️','⏹️','⏺️','⏏️','🎦','🔅',
    ],
  },
];

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filteredEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis)
    : EMOJI_CATEGORIES[activeCategory].emojis;

  return (
    <div className="emoji-picker" ref={pickerRef}>
      {/* Search */}
      <div className="emoji-picker-search">
        <input
          autoFocus
          type="text"
          placeholder="Search emojis..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category tabs */}
      {!search.trim() && (
        <div className="emoji-picker-tabs">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              className={`emoji-tab ${activeCategory === i ? 'active' : ''}`}
              onClick={() => setActiveCategory(i)}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Category label */}
      <div className="emoji-picker-label">
        {search.trim() ? 'Search Results' : EMOJI_CATEGORIES[activeCategory].name}
      </div>

      {/* Emoji grid */}
      <div className="emoji-picker-grid">
        {filteredEmojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            className="emoji-item"
            onClick={() => onSelect(emoji)}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
        {filteredEmojis.length === 0 && (
          <div className="emoji-picker-empty">No emojis found</div>
        )}
      </div>
    </div>
  );
}
