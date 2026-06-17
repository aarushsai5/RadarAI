import RiskMeter, { calcRiskScore } from './RiskMeter';
import UrgencyAlert from './UrgencyAlert';

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
      letterSpacing: '0.2em', textTransform: 'uppercase',
      color: 'var(--color-text-secondary)', marginBottom: '0.6rem',
    }}>{children}</p>
  );
}

function handleDownloadPDF(result, scanType) {
  const scanLabel = scanType === 'ct' ? 'CT Scan' : scanType === 'mri' ? 'MRI' : scanType === 'ecg' ? 'ECG' : 'X-Ray';
  const riskScore = calcRiskScore(result.severity, result.confidence);
  const sev = result.severity?.toLowerCase();

  let urgencyHTML = '';
  if (sev === 'high') {
    urgencyHTML = `<div style="background:#ff3d71;color:#fff;padding:12px 16px;border-radius:6px;margin-bottom:20px;text-align:center;font-weight:bold;">⚠️ URGENT — This scan indicates a high severity condition. Please seek immediate medical attention.</div>`;
  } else if (sev === 'medium') {
    urgencyHTML = `<div style="border:2px solid #d97800;color:#d97800;padding:12px 16px;border-radius:6px;margin-bottom:20px;text-align:center;font-weight:bold;">⚠️ This scan indicates a moderate condition. Please consult a doctor at the earliest.</div>`;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const conditions = (result.conditions_detected || []).map((c, i) => `<li>${i + 1}. ${c}</li>`).join('');
  const recommendations = (result.recommendations || []).map((r, i) => `<li>${i + 1}. ${r}</li>`).join('');

  const printHTML = `
    <html>
    <head>
      <title>ClarivueAI Diagnostic Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #0f4c81; }
        .header h1 { font-size: 28px; color: #0f4c81; margin-bottom: 4px; }
        .header .subtitle { font-size: 12px; color: #666; letter-spacing: 2px; text-transform: uppercase; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 24px; padding: 12px 16px; background: #f5f7fa; border-radius: 8px; }
        .meta-item { text-align: center; }
        .meta-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
        .meta-value { font-size: 14px; font-weight: 700; color: #1a1a2e; }
        .section { margin-bottom: 20px; page-break-inside: avoid; }
        .section-title { font-size: 13px; font-weight: 700; color: #0f4c81; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e0e6ed; }
        .section p, .section li { font-size: 13px; color: #333; line-height: 1.8; }
        .section ul { list-style: none; padding: 0; }
        .section ul li { padding: 4px 0; }
        .disclaimer { margin-top: 28px; padding: 12px 16px; background: #fff5f5; border: 1px solid #fecdd3; border-radius: 6px; font-size: 11px; color: #b91c1c; }
        .footer { margin-top: 32px; text-align: center; padding-top: 16px; border-top: 1px solid #e0e6ed; font-size: 10px; color: #999; letter-spacing: 1px; }
        @media print {
          body { padding: 20px; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ClarivueAI</h1>
        <div class="subtitle">AI-Powered Medical Scan Analysis Report</div>
      </div>
      ${urgencyHTML}
      <div class="meta">
        <div class="meta-item">
          <div class="meta-label">Date</div>
          <div class="meta-value">${dateStr}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Time</div>
          <div class="meta-value">${timeStr}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Scan Type</div>
          <div class="meta-value">${result.xray_type || scanLabel}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Risk Score</div>
          <div class="meta-value">${riskScore} / 100</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Severity</div>
          <div class="meta-value">${result.severity || 'N/A'}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Conditions Detected</div>
        <ul>${conditions || '<li>None detected</li>'}</ul>
      </div>
      <div class="section">
        <div class="section-title">Radiological Findings</div>
        <p>${result.findings || 'N/A'}</p>
      </div>
      <div class="section">
        <div class="section-title">Recommendations</div>
        <ul>${recommendations || '<li>None</li>'}</ul>
      </div>
      ${scanType === 'ecg' ? `<div class="section">
        <div class="section-title">Heart Rate & Rhythm</div>
        <p><strong>Heart Rate:</strong> ${result.heart_rate || 'N/A'}</p>
        <p><strong>Rhythm:</strong> ${result.rhythm || 'N/A'}</p>
      </div>` : ''}
      <div class="section">
        <div class="section-title">Next Steps</div>
        <p>${result.next_steps || 'N/A'}</p>
      </div>
      <div class="disclaimer">
        ⚠ ${result.disclaimer || 'AI-assisted analysis for educational purposes only. Consult a licensed physician.'}
      </div>
      <div class="footer">
        Generated by ClarivueAI — For educational and research purposes only
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(printHTML);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };
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

        {/* ── Urgency Alert ── */}
        <UrgencyAlert severity={result.severity} />

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

        {/* ── Risk Meter (FIRST CARD) ── */}
        <RiskMeter severity={result.severity} confidence={result.confidence} />

        {/* ── Local GPU Classifier Meta (if present) ── */}
        {result.local_model_meta && (
          <div className="glass-card card-stagger-1" style={{
            border: '1px solid rgba(0, 242, 254, 0.25)',
            background: 'rgba(0, 242, 254, 0.03)',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.8rem 1.25rem',
            borderRadius: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⚡</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-cyan)', marginBottom: '0.1rem' }}>
                  Local hardware acceleration active
                </p>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  AMD GPU Classifier Model ({result.local_model_meta.device || 'DirectML'})
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Top Classification</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-cyan)' }}>
                {result.local_model_meta.prediction} ({(result.local_model_meta.confidence * 100).toFixed(1)}%)
              </p>
            </div>
          </div>
        )}

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
            <SectionLabel>{scanType === 'ct' ? 'CT Scan Region Detected' : scanType === 'mri' ? 'MRI Sequence Detected' : scanType === 'ecg' ? 'ECG Type Detected' : 'X-Ray Type'}</SectionLabel>
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

        {/* ── Heart Rate & Rhythm (ECG only) ── */}
        {scanType === 'ecg' && (result.heart_rate || result.rhythm) && (
          <div className="glass-card card-stagger-2" style={{ marginBottom: '1rem' }}>
            <SectionLabel>💓 Heart Rate & Rhythm</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{
                background: 'rgba(15, 76, 129, 0.04)',
                border: '1px solid rgba(15, 76, 129, 0.1)',
                borderRadius: '10px', padding: '1rem 1.25rem',
                textAlign: 'center',
              }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Heart Rate</p>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-cyan)' }}>{result.heart_rate || '—'}</p>
              </div>
              <div style={{
                background: 'rgba(15, 76, 129, 0.04)',
                border: '1px solid rgba(15, 76, 129, 0.1)',
                borderRadius: '10px', padding: '1rem 1.25rem',
                textAlign: 'center',
              }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Rhythm</p>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-cyan)' }}>{result.rhythm || '—'}</p>
              </div>
            </div>
          </div>
        )}

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

        {/* ── Download PDF Button ── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => handleDownloadPDF(result, scanType)}
            style={{
              width: '100%',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--color-cyan)',
              background: 'rgba(15, 76, 129, 0.06)',
              border: '1.5px solid rgba(15, 76, 129, 0.3)',
              borderRadius: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(15, 76, 129, 0.12)';
              e.currentTarget.style.borderColor = 'var(--color-cyan)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(15, 76, 129, 0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(15, 76, 129, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(15, 76, 129, 0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ⬇️ &nbsp; Download Full Report as PDF
          </button>
        </div>

        {/* ── Reset Button ── */}
        <div style={{ textAlign: 'center' }}>
          <button className="btn-cyan" onClick={onReset}>
            ↩ &nbsp; Analyze Another {scanType === 'ct' ? 'CT Scan' : scanType === 'mri' ? 'MRI' : scanType === 'ecg' ? 'ECG' : 'X-Ray'}
          </button>
        </div>
      </div>
    </div>
  );
}
