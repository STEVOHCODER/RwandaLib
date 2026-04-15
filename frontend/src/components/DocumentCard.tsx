import React from 'react';

interface DocumentCardProps {
  doc: any;
  onAction: (id: number, isRead: boolean) => void;
  isUnlocked?: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, onAction, isUnlocked }) => {
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'SCIENTIFIC_PAPER': return 'SCIENTIFIC PAPER';
      case 'PAST_PAPER': return 'PAST EXAM';
      case 'BOOK': return 'BOOK';
      default: return 'OTHER';
    }
  };

  const getCategoryClass = (cat: string) => {
    switch (cat) {
      case 'SCIENTIFIC_PAPER': return 'cat-paper';
      case 'PAST_PAPER': return 'cat-exam';
      case 'BOOK': return 'cat-book';
      default: return '';
    }
  };

  const getEducationLevelColor = (level: string) => {
    switch (level) {
      case 'UNIVERSITY': return { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' };
      case 'SECONDARY': return { bg: '#fce7f3', color: '#9d174d', border: '#f9a8d4' };
      case 'PRIMARY': return { bg: '#f0fdf4', color: '#166534', border: '#86efac' };
      default: return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
    }
  };

  const levelStyles = getEducationLevelColor(doc.educationLevel);

  return (
    <div className="book-card" style={{ display: 'flex', gap: '14px', padding: '16px 0', borderBottom: '1px solid var(--br)', position: 'relative', zIndex: 1 }}>
      <div 
        className="book-cover-ph" 
        style={{ 
          width: '80px', height: '110px', borderRadius: '4px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
          background: 'var(--gs)', border: '1px solid var(--br)'
        }}
      >
        {doc.category === 'BOOK' ? '📗' : doc.category === 'PAST_PAPER' ? '📘' : '🔬'}
      </div>

      <div className="book-info" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
          <span className={`badge ${getCategoryClass(doc.category)}`}>{getCategoryLabel(doc.category)}</span>
          {doc.educationLevel && (
            <span 
              className="badge" 
              style={{ background: levelStyles.bg, color: levelStyles.color, border: `1px solid ${levelStyles.border}` }}
            >
              {doc.educationLevel}
            </span>
          )}
        </div>

        <h3 className="book-title" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
          {doc.title}
        </h3>
        <p className="book-author" style={{ fontSize: '12px', color: 'var(--txm)', marginBottom: '6px' }}>
          {doc.uploader?.username || 'System'} · {doc.subject || 'General Resource'}
        </p>
        
        <div className="book-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--txl)' }}>
          <span>PDF</span>
          <span>·</span>
          <span>{doc.language || 'English'}</span>
          <span>·</span>
          <span>{doc.year || 'N/A'}</span>
          <span>·</span>
          <span>{(doc.fileSize / 1024 / 1024).toFixed(1)} MB</span>
        </div>

        <div className="book-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button 
            onClick={() => onAction(doc.id, true)}
            className="act-btn" 
            style={{ 
              padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
              background: 'transparent', color: 'var(--primary)', border: '1.5px solid var(--primary)',
              cursor: 'pointer'
            }}
          >
            Read Online
          </button>
          
          <button 
            onClick={() => onAction(doc.id, false)}
            className="act-btn" 
            style={{ 
              padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {isUnlocked ? 'Download Now' : '🔒 Unlock to Download'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
