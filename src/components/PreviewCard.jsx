export default function PreviewCard({ file, imageUrl, onAnalyze, onRemove, isAnalyzing, scanType }) {
  const sizeMB = file ? (file.size / 1024 / 1024).toFixed(2) : 0;
  const btnText = scanType === 'ct' ? 'Analyze CT Scan' : scanType === 'mri' ? 'Analyze MRI' : 'Analyze X-Ray';

  return (
    <div style={{ width: '100%', padding: '0 1.5rem 3rem', display: 'flex', justifyContent: 'center' }} className="animate-fade-in-up">
      <div className="glass-card" style={{ width: '100%', maxWidth: '680px' }}>

        {/* Card header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: 'var(--color-green)',
              boxShadow: '0 0 10px var(--color-green)',
              animation: 'pulse-glow 1.5s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-green)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Image Loaded
            </span>
          </div>
          <button className="btn-red" onClick={onRemove}>✕ Remove</button>
        </div>

        {/* Image preview */}
        <div style={{
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          marginBottom: '1.25rem',
          background: '#000',
          position: 'relative',
        }}>
          {/* Corner brackets on image */}
          <div style={{ position: 'absolute', top: 10, left: 10, width: 18, height: 18, borderTop: '2px solid rgba(255, 255, 255, 0.6)', borderLeft: '2px solid rgba(255, 255, 255, 0.6)', borderRadius: '2px 0 0 0', zIndex: 2 }} />
          <div style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderTop: '2px solid rgba(255, 255, 255, 0.6)', borderRight: '2px solid rgba(255, 255, 255, 0.6)', borderRadius: '0 2px 0 0', zIndex: 2 }} />
          <div style={{ position: 'absolute', bottom: 10, left: 10, width: 18, height: 18, borderBottom: '2px solid rgba(255, 255, 255, 0.6)', borderLeft: '2px solid rgba(255, 255, 255, 0.6)', borderRadius: '0 0 0 2px', zIndex: 2 }} />
          <div style={{ position: 'absolute', bottom: 10, right: 10, width: 18, height: 18, borderBottom: '2px solid rgba(255, 255, 255, 0.6)', borderRight: '2px solid rgba(255, 255, 255, 0.6)', borderRadius: '0 0 2px 0', zIndex: 2 }} />
          <img
            src={imageUrl} alt="X-ray preview"
            style={{
              width: '100%', maxHeight: '340px',
              objectFit: 'contain', display: 'block',
              filter: 'brightness(1.1) contrast(1.1) grayscale(0.1)',
            }}
          />
          {/* Scan type overlay */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            padding: '1.5rem 1rem 0.75rem',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: '0.15em' }}>
              DICOM PREVIEW — {file?.name?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* File meta */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.75rem', marginBottom: '1.5rem',
        }}>
          {[
            { label: 'File Name', value: file?.name?.length > 20 ? file.name.slice(0, 20) + '...' : file?.name },
            { label: 'File Size', value: `${sizeMB} MB` },
            { label: 'Format', value: file?.type?.split('/')[1]?.toUpperCase() },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'rgba(15, 76, 129, 0.04)',
              border: '1px solid rgba(15, 76, 129, 0.1)',
              borderRadius: '10px', padding: '0.65rem 0.9rem',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--color-text-secondary)', letterSpacing: '0.1em', marginBottom: '4px', textTransform: 'uppercase' }}>{label}</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-cyan)', fontWeight: 600 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Analyze button */}
        <button
          className="btn-cyan"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          style={{ width: '100%', fontSize: '0.85rem', padding: '16px', letterSpacing: '2px' }}
        >
          🔬 &nbsp; {btnText}
        </button>
      </div>
    </div>
  );
}
