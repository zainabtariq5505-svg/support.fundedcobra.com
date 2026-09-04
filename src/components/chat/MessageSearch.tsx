import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { C } from '@/lib/ds';

export default function MessageSearch({ 
  messages, 
  onResultClick 
}: { 
  messages: any[]; 
  onResultClick: (messageId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const filtered = messages.filter(msg => 
      msg.message?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setResults(filtered);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          border: `1px solid ${C.border}`,
          background: 'transparent',
          borderRadius: 6,
          padding: 8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          color: C.textSub,
        }}
        title="Search messages"
      >
        <Search size={18} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      width: 320,
      backgroundColor: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      zIndex: 1000,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <Search size={18} color={C.textMuted} />
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search messages..."
          autoFocus
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            color: C.text,
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          onClick={() => {
            setIsOpen(false);
            setQuery('');
            setResults([]);
          }}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 4,
            color: C.textMuted,
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {results.length === 0 && query.length >= 2 && (
          <div style={{
            padding: 24,
            textAlign: 'center',
            color: C.textMuted,
            fontSize: 13,
          }}>
            No messages found
          </div>
        )}
        {results.map(msg => (
          <div
            key={msg.id}
            onClick={() => {
              onResultClick(msg.id);
              setIsOpen(false);
              setQuery('');
              setResults([]);
            }}
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${C.border}`,
              cursor: 'pointer',
              backgroundColor: C.surface,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.backgroundColor = C.surface2;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.backgroundColor = C.surface;
            }}
          >
            <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>
              {msg.message?.slice(0, 100)}
              {msg.message?.length > 100 && '...'}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted }}>
              {msg.sender?.full_name || msg.sender?.email} • {new Date(msg.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
