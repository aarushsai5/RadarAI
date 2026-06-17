export default function Hero() {
  return (
    <section style={{
      width: '100%',
      padding: '5rem 1.5rem 3rem',
      textAlign: 'center',
      position: 'relative',
    }}>
      {/* ECG line decoration */}
      <svg
        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.1, pointerEvents: 'none', width: '90%' }}
        viewBox="0 0 800 80" preserveAspectRatio="none"
      >
        <polyline
          points="0,40 80,40 100,10 120,70 140,40 200,40 220,5 240,75 260,40 800,40"
          fill="none" stroke="var(--color-cyan)" strokeWidth="2"
          strokeDasharray="400" strokeDashoffset="400"
          style={{ animation: 'ecg-draw 3s ease-out 0.5s forwards' }}
        />
      </svg>

      {/* Pill badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <div className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-cyan)', display: 'inline-block', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
          AI-Powered Diagnostic System
        </div>
      </div>

      {/* Main heading */}
      <h1 style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 900,
        fontSize: 'clamp(2.2rem, 6vw, 4rem)',
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        marginBottom: '1.25rem',
      }}>
        <span style={{ color: 'var(--color-text-primary)' }}>Medical Scan </span>
        <span style={{
          background: 'linear-gradient(135deg, #0f4c81, #028090)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: 'none',
          filter: 'drop-shadow(0 4px 12px rgba(15, 76, 129, 0.2))',
        }}>Analyzer</span>
      </h1>

      {/* Subtitle */}
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
        color: 'var(--color-text-secondary)',
        maxWidth: '36rem',
        marginLeft: 'auto', marginRight: 'auto',
        lineHeight: 1.8,
        marginBottom: '1.5rem',
        letterSpacing: '0.02em',
      }}>
        Upload any X-ray, CT scan, MRI, or ECG. Get an instant AI-powered diagnostic report.
      </p>

      {/* Warning badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        background: 'rgba(211, 47, 47, 0.08)',
        border: '1px solid rgba(211, 47, 47, 0.2)',
        borderRadius: '10px',
        padding: '8px 18px',
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{ color: 'var(--color-red)', fontSize: '0.7rem' }}>⚠</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          color: 'var(--color-red)',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>For educational purposes only — not a substitute for professional medical advice</span>
      </div>
    </section>
  );
}
