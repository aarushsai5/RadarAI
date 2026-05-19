export default function Header() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--color-surface)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--color-border)',
      boxShadow: '0 4px 20px rgba(15, 30, 60, 0.05)',
      overflow: 'hidden',
    }}>
      {/* Animated top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
        background: 'linear-gradient(90deg, #0f4c81 0%, #028090 30%, #1d6a96 70%, #0f4c81 100%)',
        opacity: 0.9,
      }} />
      {/* Shimmer sweep */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(15, 76, 129, 0.05), transparent)',
        animation: 'header-glow-slide 4s linear infinite',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto',
        padding: '0.85rem 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ fontSize: '1.5rem' }}>🫁</span>
            <div style={{
              position: 'absolute', inset: -3,
              border: '1px solid rgba(15, 76, 129, 0.4)',
              borderRadius: '50%',
              animation: 'pulse-glow 2.5s ease-in-out infinite',
            }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '1.25rem',
            background: 'linear-gradient(135deg, #0f4c81, #028090)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.02em',
          }}>ClarivueAI</span>
        </div>

        {/* Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(2, 128, 144, 0.08)',
          border: '1px solid rgba(2, 128, 144, 0.25)',
          borderRadius: '20px',
          padding: '5px 14px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--color-green)',
            boxShadow: '0 0 8px var(--color-green)',
            animation: 'pulse-glow 1.5s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'var(--color-cyan)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>Medical Imaging v1.0</span>
        </div>
      </div>
    </header>
  );
}
