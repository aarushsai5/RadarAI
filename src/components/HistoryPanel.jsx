export default function HistoryPanel({ onViewResult, onClose }) {
  const history = getHistory();

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem('clarivue_history') || '[]');
    } catch {
      return [];
    }
  }

  function clearHistory() {
    localStorage.removeItem('clarivue_history');
    // Force re-render by closing and user can reopen
    onClose();
  }

  function getSevColor(severity) {
    const sev = severity?.toLowerCase();
    if (sev === 'high') return 'var(--color-red)';
    if (sev === 'medium') return 'var(--color-yellow)';
    return 'var(--color-green)';
  }

  function getSevBadge(severity) {
    const sev = severity?.toLowerCase();
    if (sev === 'high') return 'badge-red';
    if (sev === 'medium') return 'badge-yellow';
    return 'badge-green';
  }

  function getScanEmoji(scanType) {
    if (scanType === 'ct') return '🧠';
    if (scanType === 'mri') return '🫀';
    if (scanType === 'ecg') return '💓';
    return '🫁';
  }

  function getScanLabel(scanType, isComparison) {
    let label = scanType === 'ct' ? 'CT Scan' : scanType === 'mri' ? 'MRI' : scanType === 'ecg' ? 'ECG' : 'X-Ray';
    if (isComparison) label += ' (Comparison)';
    return label;
  }

  function formatDate(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' — ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="glass-card animate-fade-in-up" style={{
      width: '100%', maxWidth: '56rem',
      marginLeft: 'auto', marginRight: 'auto',
      marginBottom: '2rem',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🕘</span>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1rem', fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}>Recent Analyses</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'var(--color-text-secondary)',
            background: 'rgba(15, 76, 129, 0.06)',
            border: '1px solid rgba(15, 76, 129, 0.15)',
            borderRadius: '10px',
            padding: '3px 10px',
            letterSpacing: '0.1em',
          }}>{history.length} / 10</span>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
          padding: '4px 8px',
        }}>✕</button>
      </div>

      {/* History Items */}
      {history.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '2rem 1rem',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
            color: 'var(--color-text-secondary)', opacity: 0.6,
            letterSpacing: '0.05em',
          }}>No analyses yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {history.map((item, idx) => (
            <div key={item.id || idx} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.9rem 0.5rem',
              borderTop: idx > 0 ? '1px solid rgba(15, 76, 129, 0.08)' : 'none',
              flexWrap: 'wrap',
            }}>
              {/* Scan Type Emoji */}
              <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
                {getScanEmoji(item.scanType)}
              </span>

              {/* Info */}
              <div style={{ flex: 1, minWidth: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-heading)', fontSize: '0.85rem',
                    fontWeight: 700, color: 'var(--color-text-primary)',
                  }}>{getScanLabel(item.scanType, item.isComparison)}</span>
                  <span className={`badge ${getSevBadge(item.severity)}`} style={{ fontSize: '0.55rem', padding: '3px 10px' }}>
                    {item.severity || 'Unknown'}
                  </span>
                </div>
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                  color: 'var(--color-text-secondary)', letterSpacing: '0.05em',
                  marginBottom: '0.2rem',
                }}>{formatDate(item.timestamp)}</p>
                {item.conditions && item.conditions.length > 0 && (
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                    color: 'var(--color-cyan)', letterSpacing: '0.03em',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', maxWidth: '350px',
                  }}>
                    {item.conditions.slice(0, 2).join(' • ')}
                    {item.conditions.length > 2 ? ' …' : ''}
                  </p>
                )}
              </div>

              {/* View Button */}
              <button
                onClick={() => onViewResult(item)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem', fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--color-cyan)',
                  background: 'rgba(15, 76, 129, 0.06)',
                  border: '1px solid rgba(15, 76, 129, 0.2)',
                  borderRadius: '10px',
                  padding: '7px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(15, 76, 129, 0.12)';
                  e.currentTarget.style.borderColor = 'var(--color-cyan)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(15, 76, 129, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(15, 76, 129, 0.2)';
                }}
              >View</button>
            </div>
          ))}
        </div>
      )}

      {/* Clear History */}
      {history.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(15, 76, 129, 0.08)' }}>
          <button
            onClick={clearHistory}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
              color: 'var(--color-red)', fontWeight: 600,
              letterSpacing: '0.05em',
              opacity: 0.7,
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; }}
          >Clear History</button>
        </div>
      )}
    </div>
  );
}
