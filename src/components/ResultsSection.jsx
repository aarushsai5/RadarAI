function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
      letterSpacing: '0.2em', textTransform: 'uppercase',
      color: 'var(--color-text-secondary)', marginBottom: '0.6rem',
    }}>{children}</p>
  );
}

export default function ResultsSection({ result, onReset, scanType }) {
  const sev = result.severity?.toLowerCase();
  const sevColor = sev === 'high' ? 'var(--color-red)'
    : sev === 'medium' ? 'var(--color-yellow)'
    : 'var(--color-green)';
  const sevBadge = sev === 'high' ? 'badge-red' : sev === 'medium' ? 'badge-yellow' : 'badge-green';
  const confBadge = result.confidence?.toLowerCase() === 'high' ? 'badge-green'
    : result.confidence?.toLowerCase() === 'medium' ? 'badge-yellow' : 'badge-red';

  return (
    <div style={{ width: '100%', padding: '0 1.5rem 4rem' }} className="animate-fade-in-up">
      <div style={{ maxWidth: '56rem', marginLeft: 'auto', marginRight: 'auto' }}>

        {/* ── Layman Summary Banner ── */}
        {result.layman_summary && (() => {
          const borderColor = sev === 'high' ? 'var(--color-red)' : sev === 'medium' ? 'var(--color-yellow)' : 'var(--color-green)';
          const bgColor = sev === 'high' ? 'rgba(211, 47, 47, 0.08)' : sev === 'medium' ? 'rgba(245, 124, 0, 0.08)' : 'rgba(2, 136, 209, 0.08)';
          const icon = sev === 'high' ? '🔴' : sev === 'medium' ? '🟡' : '🟢';
          return (
            <div className="card-stagger-1" style={{
              borderLeft: `4px solid ${borderColor}`,
              background: bgColor,
              borderRadius: '14px', padding: '1.5rem 1.75rem',
              marginBottom: '1.5rem',
              display: 'flex', alignItems: 'flex-start', gap: '1rem',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${borderColor}33`,
              borderLeft: `4px solid ${borderColor}`,
              boxShadow: `0 0 30px ${borderColor}18`,
            }}>
              <span style={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>{icon}</span>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: borderColor, marginBottom: '0.5rem' }}>
                  Plain English Summary
                </p>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                  {result.layman_summary}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Section title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="glow-cyan-text" style={{
            fontFamily: 'var(--font-heading)', fontWeight: 800,
            fontSize: '1.5rem', color: 'var(--color-cyan)', marginBottom: '0.4rem',
          }}>Diagnostic Report</h2>
          <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg, transparent, var(--color-cyan), transparent)', margin: '0 auto' }} />
        </div>

        {/* ── Row 1: Severity + X-ray Type + Confidence ── */}
        <div className="card-stagger-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {/* Severity */}
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <SectionLabel>Severity</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: sevColor, boxShadow: `0 0 12px ${sevColor}`, animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
              <span className={`badge ${sevBadge}`}>{result.severity || 'Unknown'}</span>
            </div>
          </div>
          {/* X-Ray Type */}
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <SectionLabel>{scanType === 'ct' ? 'CT Scan Region Detected' : scanType === 'mri' ? 'MRI Sequence Detected' : 'X-Ray Type'}</SectionLabel>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-cyan)', fontWeight: 600 }}>
              {result.xray_type || '—'}
            </p>
          </div>
          {/* Confidence */}
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <SectionLabel>AI Confidence</SectionLabel>
            <span className={`badge ${confBadge}`}>{result.confidence || '—'}</span>
          </div>
        </div>

        {/* ── Conditions Detected ── */}
        <div className="glass-card card-stagger-3" style={{ marginBottom: '1rem' }}>
          <SectionLabel>⚡ Conditions Detected</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {(result.conditions_detected || []).map((c, i) => (
              <span key={i} className={`tag ${sev === 'none' || sev === 'low' ? 'tag-cyan' : 'tag-red'}`}>{c}</span>
            ))}
          </div>
        </div>

        {/* ── Findings ── */}
        <div className="glass-card card-stagger-4" style={{ marginBottom: '1rem' }}>
          <SectionLabel>🔬 Radiological Findings</SectionLabel>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
            color: 'var(--color-text-primary)', lineHeight: 1.9,
            letterSpacing: '0.01em',
          }}>{result.findings}</p>
        </div>

        {/* ── Recommendations ── */}
        <div className="glass-card card-stagger-5" style={{ marginBottom: '1rem' }}>
          <SectionLabel>📋 Recommendations</SectionLabel>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {(result.recommendations || []).map((r, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(15, 76, 129, 0.06)',
                  border: '1px solid rgba(15, 76, 129, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
                  color: 'var(--color-cyan)', flexShrink: 0, marginTop: '1px',
                }}>{i + 1}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-primary)', lineHeight: 1.7 }}>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Next Steps ── */}
        <div className="next-steps-box card-stagger-6" style={{ marginBottom: '1.5rem' }}>
          <SectionLabel>🏥 Next Steps</SectionLabel>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-primary)', lineHeight: 1.8 }}>
            {result.next_steps}
          </p>
        </div>

        {/* ── Disclaimer ── */}
        <div style={{
          background: 'rgba(211, 47, 47, 0.04)',
          border: '1px solid rgba(211, 47, 47, 0.15)',
          borderRadius: '10px', padding: '0.9rem 1.25rem',
          marginBottom: '2rem', backdropFilter: 'blur(8px)',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-red)', fontWeight: 600, lineHeight: 1.7, letterSpacing: '0.02em' }}>
            ⚠ {result.disclaimer}
          </p>
        </div>

        {/* ── Reset Button ── */}
        <div style={{ textAlign: 'center' }}>
          <button className="btn-cyan" onClick={onReset}>
            ↩ &nbsp; Analyze Another {scanType === 'ct' ? 'CT Scan' : scanType === 'mri' ? 'MRI' : 'X-Ray'}
          </button>
        </div>
      </div>
    </div>
  );
}
