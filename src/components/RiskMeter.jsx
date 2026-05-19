import { useState, useEffect } from 'react';

function calcRiskScore(severity, confidence) {
  const sevMap = { none: 5, low: 25, medium: 55, high: 85 };
  let score = sevMap[severity?.toLowerCase()] ?? 30;
  const conf = confidence?.toLowerCase();
  if (conf === 'low') score -= 10;
  if (conf === 'high') score += 5;
  return Math.max(0, Math.min(100, score));
}

function getRiskLabel(score) {
  if (score <= 20) return 'No Significant Risk Detected';
  if (score <= 40) return 'Low Risk — Monitor Condition';
  if (score <= 65) return 'Moderate Risk — Consult Doctor';
  if (score <= 85) return 'High Risk — Seek Medical Attention';
  return 'Critical Risk — Immediate Care Required';
}

function getArcColor(score) {
  if (score <= 30) return '#00e5ff';
  if (score <= 60) return '#ffd700';
  return '#ff3d71';
}

export default function RiskMeter({ severity, confidence }) {
  const finalScore = calcRiskScore(severity, confidence);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * finalScore);
      setAnimatedScore(current);
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [finalScore]);

  const arcColor = getArcColor(finalScore);
  const riskLabel = getRiskLabel(finalScore);

  // SVG arc math
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Arc from 225° to -45° (270° sweep, bottom-centered gap)
  const startAngle = 135;
  const totalSweep = 270;
  const fillSweep = (animatedScore / 100) * totalSweep;

  function polarToCartesian(angle) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function describeArc(sweep) {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(startAngle + sweep);
    const largeArc = sweep > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const bgArc = describeArc(totalSweep);
  const fillArc = fillSweep > 0.5 ? describeArc(fillSweep) : '';

  return (
    <div className="glass-card card-stagger-1 risk-meter-card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.5rem 1.5rem' }}>
      {/* SVG Gauge */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
          {/* Glow filter */}
          <defs>
            <filter id="arcGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background arc */}
          <path d={bgArc} fill="none" stroke="rgba(15, 76, 129, 0.12)" strokeWidth={strokeWidth} strokeLinecap="round" />
          {/* Filled arc */}
          {fillArc && (
            <path d={fillArc} fill="none" stroke={arcColor} strokeWidth={strokeWidth} strokeLinecap="round" filter="url(#arcGlow)" />
          )}
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          paddingTop: '10px',
        }}>
          <span className="risk-score-number" style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '3.2rem', fontWeight: 900,
            color: arcColor, lineHeight: 1,
            textShadow: `0 0 20px ${arcColor}44`,
          }}>{animatedScore}</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--color-text-secondary)', marginTop: '6px',
          }}>Risk Score</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.5rem',
            color: 'var(--color-text-secondary)', opacity: 0.6,
            marginTop: '2px',
          }}>out of 100</span>
        </div>
      </div>

      {/* Risk label */}
      <div style={{
        marginTop: '0.75rem', padding: '8px 20px',
        borderRadius: '10px',
        border: `1px solid ${arcColor}33`,
        background: `${arcColor}0a`,
      }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
          fontWeight: 600, color: arcColor,
          letterSpacing: '0.08em', textAlign: 'center',
        }}>{riskLabel}</p>
      </div>
    </div>
  );
}

export { calcRiskScore };
