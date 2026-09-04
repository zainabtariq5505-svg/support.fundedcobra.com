import { useState } from 'react';
import { Zap, Search } from 'lucide-react';
import { C } from '@/lib/ds';

const CANNED_RESPONSES = [
  {
    title: 'Welcome',
    content: 'Hi {{customer_name}}, thanks for reaching out! I\'m here to help. Could you provide more details about your issue?',
    tags: ['greeting', 'start'],
  },
  {
    title: 'Investigating',
    content: 'I\'m looking into this now. I\'ll update you shortly with what I find. Estimated time: {{time}} minutes.',
    tags: ['progress', 'update'],
  },
  {
    title: 'Need More Info',
    content: 'To help resolve this faster, could you provide:\n1. {{detail_1}}\n2. {{detail_2}}\n3. Screenshot if possible',
    tags: ['question', 'info'],
  },
  {
    title: 'Fixed',
    content: 'Great news! This has been resolved. The issue was {{cause}}. Please let me know if you experience any other problems.',
    tags: ['resolution', 'close'],
  },
  {
    title: 'Escalated',
    content: 'I\'ve escalated this to our {{team}} team. They\'ll reach out within {{time}} hours with specialized assistance.',
    tags: ['escalation'],
  },
  {
    title: 'Follow Up',
    content: 'Just checking in – is everything working as expected now? Feel free to reopen if you need anything else!',
    tags: ['followup', 'check'],
  },
];

export default function CannedResponses({ 
  onSelect, 
  customerName 
}: { 
  onSelect: (content: string) => void;
  customerName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredResponses = CANNED_RESPONSES.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.tags.some(tag => tag.includes(search.toLowerCase()))
  );

  const handleSelect = (content: string) => {
    // Replace variables
    let processed = content
      .replace('{{customer_name}}', customerName || 'there')
      .replace('{{time}}', '_____')
      .replace('{{detail_1}}', '_____')
      .replace('{{detail_2}}', '_____')
      .replace('{{cause}}', '_____')
      .replace('{{team}}', '_____');
    
    onSelect(processed);
    setIsOpen(false);
    setSearch('');
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
        title="Quick replies"
      >
        <Zap size={18} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '100%',
      left: 0,
      marginBottom: 8,
      width: 360,
      backgroundColor: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      zIndex: 1000,
    }}>
      <div style={{
        padding: 12,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <Search size={16} color={C.textMuted} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search quick replies..."
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            color: C.text,
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={() => setIsOpen(false)}
          style={{
            border: 'none',
            background: 'transparent',
            color: C.textMuted,
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {filteredResponses.map((response, idx) => (
          <div
            key={idx}
            onClick={() => handleSelect(response.content)}
            style={{
              padding: 12,
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
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.text,
              marginBottom: 4,
            }}>
              {response.title}
            </div>
            <div style={{
              fontSize: 12,
              color: C.textMuted,
              whiteSpace: 'pre-wrap',
            }}>
              {response.content.slice(0, 100)}
              {response.content.length > 100 && '...'}
            </div>
            <div style={{
              display: 'flex',
              gap: 6,
              marginTop: 6,
            }}>
              {response.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    backgroundColor: C.surface3,
                    color: C.textSub,
                    borderRadius: 4,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
