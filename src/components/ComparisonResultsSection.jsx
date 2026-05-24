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

function handleComparisonPDF(result) {
  const riskScore = calcRiskScore(result.severity_now, result.confidence);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const recommendations = (result.recommendations || []).map((r, i) => `<li>${i + 1}. ${r}</li>`).join('');
  const sev = result.severity_now?.toLowerCase();

  let urgencyHTML = '';
  if (sev === 'high') {
    urgencyHTML = `<div style="background:#ff3d71;color:#fff;padding:12px 16px;border-radius:6px;margin-bottom:20px;text-align:center;font-weight:bold;">⚠️ URGENT — This scan indicates a high severity condition. Please seek immediate medical attention.</div>`;
  } else if (sev === 'medium') {
    urgencyHTML = `<div style="border:2px solid #d97800;color:#d97800;padding:12px 16px;border-radius:6px;margin-bottom:20px;text-align:center;font-weight:bold;">⚠️ This scan indicates a moderate condition. Please consult a doctor at the earliest.</div>`;
  }

  const printHTML = `<html><head><title>ClarivueAI Comparison Report</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Segoe UI',Arial,sans-serif; color:#1a1a2e; background:#fff; padding:40px; line-height:1.6; }
      .header { text-align:center; margin-bottom:32px; padding-bottom:20px; border-bottom:2px solid #0f4c81; }
      .header h1 { font-size:28px; color:#0f4c81; margin-bottom:4px; }
      .header .subtitle { font-size:12px; color:#666; letter-spacing:2px; text-transform:uppercase; }
      .meta { display:flex; justify-content:space-between; margin-bottom:24px; padding:12px 16px; background:#f5f7fa; border-radius:8px; flex-wrap:wrap; gap:8px; }
      .meta-item { text-align:center; flex:1; min-width:100px; }
      .meta-label { font-size:10px; color:#888; text-transform:uppercase; letter-spacing:1px; }
      .meta-value { font-size:14px; font-weight:700; color:#1a1a2e; }
      .section { margin-bottom:20px; page-break-inside:avoid; }
      .section-title { font-size:13px; font-weight:700; color:#0f4c81; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:8px; padding-bottom:4px; border-bottom:1px solid #e0e6ed; }
      .section p,.section li { font-size:13px; color:#333; line-height:1.8; }
      .section ul { list-style:none; padding:0; }
      .section ul li { padding:4px 0; }
      .comparison-box { border-left:4px solid #0f4c81; padding:12px 16px; background:#f0f7ff; border-radius:0 8px 8px 0; margin-bottom:20px; }
      .disclaimer { margin-top:28px; padding:12px 16px; background:#fff5f5; border:1px solid #fecdd3; border-radius:6px; font-size:11px; color:#b91c1c; }
      .footer { margin-top:32px; text-align:center; padding-top:16px; border-top:1px solid #e0e6ed; font-size:10px; color:#999; letter-spacing:1px; }
      @media print { body { padding:20px; } .section { page-break-inside:avoid; } }
    </style></head><body>
    <div class="header"><h1>ClarivueAI</h1><div class="subtitle">AI-Powered Scan Comparison Report</div></div>
    ${urgencyHTML}
    <div class="meta">
      <div class="meta-item"><div class="meta-label">Date</div><div class="meta-value">${dateStr}</div></div>
      <div class="meta-item"><div class="meta-label">Time</div><div class="meta-value">${timeStr}</div></div>
      <div class="meta-item"><div class="meta-label">Scan Type</div><div class="meta-value">${result.scan_type || 'N/A'}</div></div>
      <div class="meta-item"><div class="meta-label">Risk Score</div><div class="meta-value">${riskScore} / 100</div></div>
      <div class="meta-item"><div class="meta-label">Progression</div><div class="meta-value">${result.progression || 'N/A'}</div></div>
    </div>
    <div class="section"><div class="section-title">Scan 1 Findings (Older)</div><p>${result.scan1_findings || 'N/A'}</p></div>
    <div class="section"><div class="section-title">Scan 2 Findings (Recent)</div><p>${result.scan2_findings || 'N/A'}</p></div>
    <div class="comparison-box"><div class="section-title" style="border:none;margin:0 0 8px 0;">Comparison Summary</div><p style="font-size:13px;color:#333;line-height:1.8;">${result.comparison || 'N/A'}</p></div>
    <div class="section"><div class="section-title">Recommendations</div><ul>${recommendations || '<li>None</li>'}</ul></div>
    <div class="section"><div class="section-title">Next Steps</div><p>${result.next_steps || 'N/A'}</p></div>
    <div class="disclaimer">⚠ ${result.disclaimer || 'AI-assisted analysis for educational purposes only. Consult a licensed physician.'}</div>
    <div class="footer">Generated by ClarivueAI — For educational and research purposes only</div>
  </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(printHTML);
  w.document.close();
  w.onload = () => { w.print(); w.onafterprint = () => w.close(); };
}

export default function ComparisonResultsSection({ result, onReset }) {
  const prog = result.progression?.toLowerCase();
  const progColor = prog === 'improved' ? 'var(--color-green)' : prog === 'worsened' ? 'var(--color-red)' : 'var(--color-yellow)';
  const progBadge = prog === 'improved' ? 'badge-green' : prog === 'worsened' ? 'badge-red' : 'badge-yellow';

  const sev = result.severity_now?.toLowerCase();
  const sevColor = sev === 'high' ? 'var(--color-red)' : sev === 'medium' ? 'var(--color-yellow)' : 'var(--color-green)';
  const sevBadge = sev === 'high' ? 'badge-red' : sev === 'medium' ? 'badge-yellow' : 'badge-green';
  const confBadge = result.confidence?.toLowerCase() === 'high' ? 'badge-green' : result.confidence?.toLowerCase() === 'medium' ? 'badge-yellow' : 'badge-red';

  return (
    <div style={{ width: '100%', padding: '0 1.5rem 4rem' }} className="animate-fade-in-up">
      <div style={{ maxWidth: '56rem', marginLeft: 'auto', marginRight: 'auto' }}>

        {/* Urgency Alert */}
        <UrgencyAlert severity={result.severity_now} />

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="glow-cyan-text" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.4rem' }}>
            Comparison Report
          </h2>
          <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg, transparent, var(--color-cyan), transparent)', margin: '0 auto' }} />
        </div>

        {/* Progression Badge */}
        <div className="glass-card card-stagger-1" style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1.5rem' }}>
          <SectionLabel>Progression</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: progColor, boxShadow: `0 0 14px ${progColor}`, animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
            <span className={`badge ${progBadge}`} style={{ fontSize: '0.75rem', padding: '8px 24px' }}>{result.progression || 'Unknown'}</span>
          </div>
        </div>

        {/* Risk Meter */}
        <RiskMeter severity={result.severity_now} confidence={result.confidence} />

        {/* Row: Severity + Scan Type + Confidence */}
        <div className="card-stagger-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <SectionLabel>Current Severity</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: sevColor, boxShadow: `0 0 12px ${sevColor}` }} />
              <span className={`badge ${sevBadge}`}>{result.severity_now || 'Unknown'}</span>
            </div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <SectionLabel>Scan Type</SectionLabel>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-cyan)', fontWeight: 600 }}>{result.scan_type || '—'}</p>
          </div>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <SectionLabel>AI Confidence</SectionLabel>
            <span className={`badge ${confBadge}`}>{result.confidence || '—'}</span>
          </div>
        </div>

        {/* Scan 1 Findings */}
        <div className="glass-card card-stagger-3" style={{ marginBottom: '1rem' }}>
          <SectionLabel>📄 Scan 1 Findings (Older)</SectionLabel>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-primary)', lineHeight: 1.9 }}>{result.scan1_findings}</p>
        </div>

        {/* Scan 2 Findings */}
        <div className="glass-card card-stagger-4" style={{ marginBottom: '1rem' }}>
          <SectionLabel>📄 Scan 2 Findings (Recent)</SectionLabel>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-primary)', lineHeight: 1.9 }}>{result.scan2_findings}</p>
        </div>

        {/* Comparison Summary — highlight card */}
        <div className="glass-card card-stagger-5" style={{
          marginBottom: '1rem',
          borderLeft: '4px solid var(--color-cyan)',
          boxShadow: '0 0 30px rgba(15, 76, 129, 0.08)',
        }}>
          <SectionLabel>🔍 Comparison Summary</SectionLabel>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-primary)', lineHeight: 1.9 }}>{result.comparison}</p>
        </div>

        {/* Recommendations */}
        <div className="glass-card card-stagger-5" style={{ marginBottom: '1rem' }}>
          <SectionLabel>📋 Recommendations</SectionLabel>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {(result.recommendations || []).map((r, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(15, 76, 129, 0.06)', border: '1px solid rgba(15, 76, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--color-cyan)', flexShrink: 0, marginTop: '1px' }}>{i + 1}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-primary)', lineHeight: 1.7 }}>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next Steps */}
        <div className="next-steps-box card-stagger-6" style={{ marginBottom: '1.5rem' }}>
          <SectionLabel>🏥 Next Steps</SectionLabel>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-primary)', lineHeight: 1.8 }}>{result.next_steps}</p>
        </div>

        {/* Disclaimer */}
        <div style={{ background: 'rgba(211, 47, 47, 0.04)', border: '1px solid rgba(211, 47, 47, 0.15)', borderRadius: '10px', padding: '0.9rem 1.25rem', marginBottom: '2rem', backdropFilter: 'blur(8px)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-red)', fontWeight: 600, lineHeight: 1.7, letterSpacing: '0.02em' }}>
            ⚠ {result.disclaimer}
          </p>
        </div>

        {/* PDF Download */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button onClick={() => handleComparisonPDF(result)} style={{
            width: '100%', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700,
            letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-cyan)',
            background: 'rgba(15, 76, 129, 0.06)', border: '1.5px solid rgba(15, 76, 129, 0.3)',
            borderRadius: '14px', cursor: 'pointer', transition: 'all 0.3s ease', backdropFilter: 'blur(8px)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15, 76, 129, 0.12)'; e.currentTarget.style.borderColor = 'var(--color-cyan)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(15, 76, 129, 0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15, 76, 129, 0.06)'; e.currentTarget.style.borderColor = 'rgba(15, 76, 129, 0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
          >⬇️ &nbsp; Download Comparison Report as PDF</button>
        </div>

        {/* Reset */}
        <div style={{ textAlign: 'center' }}>
          <button className="btn-cyan" onClick={onReset}>↩ &nbsp; New Analysis</button>
        </div>
      </div>
    </div>
  );
}
