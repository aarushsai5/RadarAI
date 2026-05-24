export default function UrgencyAlert({ severity }) {
  const sev = severity?.toLowerCase();

  if (sev === 'high') {
    return (
      <div style={{
        width: '100%',
        background: '#ff3d71',
        borderRadius: '14px',
        padding: '1.25rem 1.75rem',
        marginBottom: '1.5rem',
        animation: 'urgency-pulse 1.5s ease-in-out infinite',
        boxShadow: '0 0 30px rgba(255, 61, 113, 0.3)',
      }}>
        <p style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.95rem',
          fontWeight: 800,
          color: '#ffffff',
          textAlign: 'center',
          lineHeight: 1.6,
          letterSpacing: '0.02em',
        }}>
          ⚠️ URGENT — This scan indicates a high severity condition. Please seek immediate medical attention.
        </p>
      </div>
    );
  }

  if (sev === 'medium') {
    return (
      <div style={{
        width: '100%',
        background: 'rgba(217, 120, 0, 0.08)',
        border: '1.5px solid var(--color-yellow)',
        borderRadius: '14px',
        padding: '1.25rem 1.75rem',
        marginBottom: '1.5rem',
      }}>
        <p style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.9rem',
          fontWeight: 700,
          color: 'var(--color-yellow)',
          textAlign: 'center',
          lineHeight: 1.6,
          letterSpacing: '0.02em',
        }}>
          ⚠️ This scan indicates a moderate condition. Please consult a doctor at the earliest.
        </p>
      </div>
    );
  }

  return null;
}
