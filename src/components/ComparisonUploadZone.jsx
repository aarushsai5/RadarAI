export default function ComparisonUploadZone({
  onFileSelect1, onFileSelect2, file1, file2, imageUrl1, imageUrl2,
  isDragging1, setIsDragging1, isDragging2, setIsDragging2,
  onCompare, isAnalyzing, scanType,
}) {
  const scanEmoji = scanType === 'ct' ? '🧠' : scanType === 'mri' ? '🫀' : scanType === 'ecg' ? '💓' : '🫁';

  function renderZone(id, file, imageUrl, isDragging, setIsDragging, onFileSelect, label, browseLabel) {
    return (
      <div style={{ flex: '1 1 380px', maxWidth: '430px', minWidth: '280px' }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em',
          textTransform: 'uppercase', color: 'var(--color-cyan)', marginBottom: '0.75rem',
          textAlign: 'center', fontWeight: 700,
        }}>{label}</p>
        <label
          htmlFor={id}
          className={`upload-zone${isDragging ? ' drag-over' : ''}`}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            width: '100%', minHeight: file ? '180px' : '260px', padding: '2rem 1.5rem', gap: '0.75rem',
            position: 'relative',
          }}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) onFileSelect(e.dataTransfer.files[0]); }}
        >
          <div className="corner corner-tl" /><div className="corner corner-tr" />
          <div className="corner corner-bl" /><div className="corner corner-br" />
          <div className="scan-sweep" />
          {file && imageUrl ? (
            <div style={{ textAlign: 'center' }}>
              <img src={imageUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '10px', border: '1px solid var(--color-border)', marginBottom: '0.5rem' }} />
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--color-green)', letterSpacing: '0.1em' }}>
                ✓ {file.name.length > 25 ? file.name.slice(0, 25) + '...' : file.name}
              </p>
            </div>
          ) : (
            <>
              <span style={{ fontSize: '1.8rem' }}>{scanEmoji}</span>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--color-text-primary)', textAlign: 'center' }}>
                Drop {browseLabel} or <span style={{ color: 'var(--color-cyan)', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '4px' }}>browse</span>
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--color-text-secondary)', letterSpacing: '0.08em' }}>JPEG · PNG</p>
            </>
          )}
          <input id={id} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) onFileSelect(e.target.files[0]); }} />
        </label>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '0 1.5rem 3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
      <div className="comparison-zones" style={{ display: 'flex', gap: '1.25rem', width: '100%', maxWidth: '880px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {renderZone('compare-upload-1', file1, imageUrl1, isDragging1, setIsDragging1, onFileSelect1, 'Scan 1 — Previous / Older', 'older scan')}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-cyan)', background: 'rgba(15, 76, 129, 0.06)', border: '1px solid rgba(15, 76, 129, 0.15)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>VS</div>
        </div>
        {renderZone('compare-upload-2', file2, imageUrl2, isDragging2, setIsDragging2, onFileSelect2, 'Scan 2 — Current / Recent', 'recent scan')}
      </div>
      <button className="btn-cyan" onClick={onCompare} disabled={!file1 || !file2 || isAnalyzing}
        style={{ width: '100%', maxWidth: '880px', fontSize: '0.9rem', padding: '18px', letterSpacing: '2px', opacity: (!file1 || !file2) ? 0.5 : 1 }}>
        🔬 &nbsp; Compare & Analyze
      </button>
      {(!file1 || !file2) && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-secondary)', letterSpacing: '0.08em', textAlign: 'center', opacity: 0.7 }}>
          Upload both scans to enable comparison
        </p>
      )}
    </div>
  );
}
