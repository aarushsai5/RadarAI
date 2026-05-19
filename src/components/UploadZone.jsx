const SCAN_CONFIG = {
  xray: { emoji: '🫁', subtext: 'Upload chest, bone, or abdominal X-ray', chips: ['Chest X-Ray', 'Bone X-Ray', 'Spine X-Ray', 'Abdominal X-Ray'] },
  ct:   { emoji: '🧠', subtext: 'Upload CT scan slice or exported image', chips: ['CT Brain', 'CT Chest', 'CT Abdomen', 'CT Pelvis'] },
  mri:  { emoji: '🫀', subtext: 'Upload MRI scan image', chips: ['MRI Brain', 'MRI Spine', 'MRI Knee', 'MRI Cardiac'] },
};

const SCAN_TABS = [
  { key: 'xray', label: 'X-Ray' },
  { key: 'ct',   label: 'CT Scan' },
  { key: 'mri',  label: 'MRI' },
];

export default function UploadZone({ onFileSelect, isDragging, setIsDragging, scanType, setScanType }) {
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const cfg = SCAN_CONFIG[scanType] || SCAN_CONFIG.xray;

  return (
    <div style={{ width: '100%', padding: '0 1.5rem 3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>

      {/* ── Scan Type Selector ── */}
      <div style={{
        display: 'flex', gap: '0.5rem',
        background: 'rgba(15, 76, 129, 0.04)',
        border: '1px solid rgba(15, 76, 129, 0.12)',
        borderRadius: '14px', padding: '5px',
        backdropFilter: 'blur(8px)',
      }}>
        {SCAN_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setScanType(key)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '10px 24px',
              borderRadius: '10px',
              border: scanType === key ? '1px solid var(--color-cyan)' : '1px solid transparent',
              background: scanType === key ? 'rgba(15, 76, 129, 0.1)' : 'transparent',
              color: scanType === key ? 'var(--color-cyan)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: scanType === key ? '0 0 16px rgba(15, 76, 129, 0.2)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Upload Zone ── */}
      <label
        htmlFor="xray-upload"
        className={`upload-zone${isDragging ? ' drag-over' : ''}`}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          width: '100%', maxWidth: '680px', minHeight: '320px',
          padding: '3.5rem 2rem', gap: '1.25rem',
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* Corner brackets */}
        <div className="corner corner-tl" />
        <div className="corner corner-tr" />
        <div className="corner corner-bl" />
        <div className="corner corner-br" />
        {/* Scan sweep line */}
        <div className="scan-sweep" />

        {/* Icon with animated ring */}
        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
          <div className="lung-breathe" style={{
            position: 'absolute', inset: -20,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(15, 76, 129, 0.08) 0%, transparent 70%)',
          }} />
          <div style={{
            width: 72, height: 72,
            background: 'rgba(15, 76, 129, 0.04)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(15, 76, 129, 0.15)',
            fontSize: '2.2rem',
            position: 'relative', zIndex: 1,
            backdropFilter: 'blur(8px)',
          }}>
            {cfg.emoji}
          </div>
        </div>

        {/* Text */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1rem',
            color: 'var(--color-text-primary)',
            marginBottom: '0.4rem',
          }}>
            Drag & drop your scan here or{' '}
            <span style={{
              color: 'var(--color-cyan)',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textUnderlineOffset: '4px',
              cursor: 'pointer',
            }}>click to browse</span>
          </p>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.1em',
            marginBottom: '0.3rem',
          }}>
            {cfg.subtext}
          </p>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.1em',
          }}>
            JPEG · PNG · Max 10MB
          </p>
        </div>

        {/* Feature chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
          {cfg.chips.map(t => (
            <span key={t} style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              padding: '4px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(15, 76, 129, 0.15)',
              color: 'var(--color-cyan)',
              background: 'rgba(15, 76, 129, 0.05)',
              letterSpacing: '0.05em',
            }}>{t}</span>
          ))}
        </div>

        <input id="xray-upload" type="file" accept="image/jpeg,image/png" style={{ display: 'none' }}
          onChange={e => { if (e.target.files[0]) onFileSelect(e.target.files[0]); }} />
      </label>
    </div>
  );
}
