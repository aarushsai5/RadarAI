export default function Footer() {
  return (
    <footer style={{
      position: 'relative',
      zIndex: 10,
      textAlign: 'center',
      padding: '2.5rem 1.5rem',
      borderTop: '1px solid var(--color-border)',
      background: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(24px)',
    }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--color-text-primary)',
          fontWeight: 600,
        }}>
          X-Ray · CT Scan · MRI Analysis · RadarAI © 2026
        </p>
      </div>
    </footer>
  );
}
