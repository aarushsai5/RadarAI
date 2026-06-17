export default function ScanningAnimation({ scanType }) {
  const label = scanType === 'ct' ? 'CT Scan' : scanType === 'mri' ? 'MRI' : scanType === 'ecg' ? 'ECG' : 'X-Ray';
  const emoji = scanType === 'ct' ? '🧠' : scanType === 'mri' ? '🫀' : scanType === 'ecg' ? '💓' : '🫁';
  return (
    <div style={{
      width: '100%', padding: '2rem 1.5rem 4rem',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem',
    }} className="animate-fade-in-up">

      {/* Spinning rings */}
      <div style={{ position: 'relative', width: 180, height: 180 }}>
        {/* Outer glow */}
        <div style={{
          position: 'absolute', inset: -20,
          background: 'radial-gradient(circle, rgba(15, 76, 129, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }} />
        {/* Ring 1 — cyan */}
        <div className="spin-slow" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: 'var(--color-cyan)', borderRightColor: 'rgba(15, 76, 129, 0.2)',
          boxShadow: '0 0 20px rgba(15, 76, 129, 0.1)',
        }} />
        {/* Ring 2 — green (teal) */}
        <div className="spin-reverse" style={{
          position: 'absolute', inset: 18, borderRadius: '50%',
          border: '1.5px solid transparent',
          borderTopColor: 'var(--color-green)', borderLeftColor: 'rgba(2, 136, 209, 0.2)',
          boxShadow: '0 0 12px rgba(2, 136, 209, 0.1)',
        }} />
        {/* Ring 3 — red */}
        <div className="spin-medium" style={{
          position: 'absolute', inset: 36, borderRadius: '50%',
          border: '1px solid transparent',
          borderBottomColor: 'var(--color-red)', borderRightColor: 'rgba(211, 47, 47, 0.2)',
        }} />
        {/* Center */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '4px',
        }}>
          <span style={{ fontSize: '2rem' }}>{emoji}</span>
          <div className="dot-pulse" style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--color-cyan)',
            boxShadow: '0 0 10px var(--color-cyan)',
          }} />
        </div>
      </div>

      {/* Status text */}
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.2rem', fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: '0.5rem',
        }}>Analyzing {label}</p>

        {/* Animated dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '1.25rem' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--color-cyan)',
              animation: `pulse-glow 1.4s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>

        {/* ECG-style animated line */}
        <svg width="280" height="40" viewBox="0 0 280 40" style={{ marginBottom: '1.25rem' }}>
          <polyline
            points="0,20 30,20 45,5 55,35 65,20 100,20 115,2 130,38 145,20 180,20 195,8 210,32 225,20 280,20"
            fill="none" stroke="rgba(15, 76, 129, 0.5)" strokeWidth="1.5"
            strokeDasharray="400" strokeDashoffset="400"
            style={{ animation: 'ecg-draw 2s linear infinite' }}
          />
        </svg>

        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--color-text-primary)',
          letterSpacing: '0.1em',
          fontWeight: 600,
        }}>
          Processing with AI — this may take a few seconds
        </p>
      </div>

      {/* Progress steps */}
      <div style={{
        display: 'flex', gap: '0.5rem', alignItems: 'center',
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {['Compressing Image', 'Connecting to AI', 'Running Diagnostics', 'Generating Report'].map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: i === 2 ? 'var(--color-cyan)' : 'var(--color-text-secondary)',
              letterSpacing: '0.08em',
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${i === 2 ? 'rgba(15, 76, 129, 0.3)' : 'rgba(15, 76, 129, 0.05)'}`,
              background: i === 2 ? 'rgba(15, 76, 129, 0.06)' : 'transparent',
              animation: i === 2 ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
            }}>{step}</div>
            {i < 3 && <span style={{ color: 'rgba(15, 76, 129, 0.2)', fontSize: '0.6rem' }}>›</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
