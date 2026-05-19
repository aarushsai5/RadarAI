import { useState, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import UploadZone from './components/UploadZone';
import PreviewCard from './components/PreviewCard';
import ScanningAnimation from './components/ScanningAnimation';
import ResultsSection from './components/ResultsSection';
import Footer from './components/Footer';

// ─── Image compression: max 1024px, JPEG 85% ──────────────────────────────────
function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };
    img.src = url;
  });
}

// ─── Clinical-grade X-ray prompt ────────────────────────────────────────────────
const MEDICAL_PROMPT = `You are a senior board-certified radiologist (FRCR/ABR) with 25+ years of clinical experience in diagnostic and interventional radiology, currently working at a top-tier academic medical center.

CRITICAL RULES — FOLLOW EXACTLY:
• NEVER hallucinate or fabricate findings. Only describe what you can DIRECTLY observe in this image.
• If you cannot determine something, say "Cannot be determined from this image" — never guess.
• If the image is not a medical image or is too low quality, state that clearly instead of inventing findings.
• Every finding MUST include precise anatomical location and standard radiological descriptors.
• Use ONLY established medical terminology consistent with ACR, RCR, and WHO standards.

SYSTEMATIC READING PROTOCOL — follow every step:
1. IMAGE IDENTIFICATION: Identify modality (plain film X-ray), view/projection (PA, AP, lateral, oblique, decubitus), and exact anatomical region. Note patient positioning, side markers if visible.
2. TECHNICAL QUALITY: Assess rotation (spinous processes, clavicle symmetry), degree of inspiration (rib count above diaphragm), penetration/exposure, and any artifacts or obscuring factors. State if quality limits interpretation.
3. STRUCTURE-BY-STRUCTURE EVALUATION:
   — CHEST: Airways (trachea, carina, bronchi) → Breathing (lung fields zone by zone — upper/mid/lower, both sides) → Cardiac (silhouette size, CTR measurement, borders, chambers) → Diaphragm (contour, costophrenic angles) → Everything else (mediastinum width and contour, hila, pleural spaces, bones, soft tissues, tubes/lines/devices)
   — BONE/JOINT: Alignment → Bones (cortex, medulla, trabecular pattern) → Cartilage/joint spaces → Soft tissues → Any hardware or foreign bodies
   — ABDOMINAL: Gas pattern → Solid organs (liver, spleen, kidneys if visible) → Calcifications → Bones → Soft tissues
4. FINDINGS: State each abnormality with exact location, size estimate if possible, morphology, and density descriptor. State normal findings explicitly too.
5. DIFFERENTIAL DIAGNOSIS: For each abnormal finding, provide the most likely diagnosis AND at least 1-2 differential diagnoses ranked by probability.
6. CLINICAL CORRELATION: Correlate all findings together into a coherent clinical picture.

Return ONLY a single valid JSON object. No markdown, no backticks, no extra text:

{
  "xray_type": "Specific projection and region — e.g. Chest PA Erect, Left Wrist AP/Lateral, Abdomen Supine, Cervical Spine Lateral",
  "severity": "None or Low or Medium or High",
  "conditions_detected": ["Use exact ICD-compatible medical terminology with anatomical specificity. E.g.: Right lower lobe consolidation consistent with community-acquired pneumonia, Moderate left-sided pleural effusion, Cardiomegaly (CTR approximately 0.6), Left apical pneumothorax, Displaced transverse fracture of distal radius with dorsal angulation, No acute cardiopulmonary abnormality"],
  "findings": "Write a comprehensive structured radiological report. Begin with technical quality assessment. Then describe EVERY anatomical structure systematically using the reading protocol above. Include measurements and size estimates where possible. Use precise location descriptors (right/left, upper/mid/lower, anterior/posterior, medial/lateral, proximal/distal). Describe density (opaque, lucent, ground-glass, consolidation, cavitation). Note both abnormal AND pertinent normal findings. This must read like an actual radiology report that a referring physician would receive.",
  "recommendations": ["5-7 specific, evidence-based clinical recommendations. Include: relevant lab tests (e.g. CBC, CRP, D-dimer, ABG), follow-up imaging with specific modality and timing (e.g. CT chest with IV contrast within 24 hours), specialist referrals with urgency level, and therapeutic considerations. Each recommendation must be actionable and clinically justified by the findings."],
  "next_steps": "Precise clinical pathway with urgency classification. Specify: (1) Urgency — routine/urgent/emergent, (2) Which specialist to consult — with rationale, (3) What investigations to order — in priority sequence, (4) Interim management considerations, (5) Follow-up timeline",
  "confidence": "Low or Medium or High — base this on image quality, clarity of findings, and diagnostic certainty. Low = ambiguous/poor quality, Medium = likely but differentials exist, High = classic/unambiguous presentation",
  "disclaimer": "AI-assisted radiological analysis for educational purposes only. This does not constitute a medical diagnosis. All findings must be correlated clinically and confirmed by a licensed radiologist or physician before any medical decision is made.",
  "layman_summary": "2-3 sentences in plain English a non-medical person can understand. Name the specific condition found (or state that everything looks normal). Explain what it means for the patient in simple terms. Indicate if it's urgent or not. Be direct and honest — never vague."
}`;

const SKIP_PHRASES = ['not found', 'not a valid', 'no endpoints', 'provider returned error', 'provider error', 'rate limit', 'quota'];

const CT_SCAN_PROMPT = `You are a senior board-certified radiologist (FRCR/ABR) with 25+ years of clinical experience specializing in cross-sectional imaging and CT interpretation, currently working at a top-tier academic medical center.

CRITICAL RULES — FOLLOW EXACTLY:
• NEVER hallucinate or fabricate findings. Only describe what you can DIRECTLY observe in this image.
• If you cannot determine something, say "Cannot be determined from this image" — never guess.
• If the image is not a CT scan or is too low quality, state that clearly instead of inventing findings.
• Every finding MUST include precise anatomical location, size estimates, and density descriptors.
• Use ONLY established medical terminology consistent with ACR, RSNA, and WHO standards.

SYSTEMATIC CT READING PROTOCOL — follow every step:
1. IMAGE IDENTIFICATION: Identify scan type (non-contrast CT, contrast-enhanced CT, CT angiography), anatomical region (brain, chest, abdomen, pelvis, spine, extremity), and plane (axial, coronal, sagittal). Note slice thickness if determinable, and phase of contrast if applicable (arterial, portal venous, delayed).
2. TECHNICAL QUALITY: Assess for motion artifact, beam hardening, incomplete coverage, contrast timing, and any factors limiting interpretation.
3. SYSTEMATIC EVALUATION:
   — CT BRAIN: Calvarium and scalp → Extra-axial spaces (epidural, subdural, subarachnoid) → Brain parenchyma (grey-white matter differentiation, each lobe systematically) → Ventricles (size, symmetry, obstruction) → Midline shift → Posterior fossa → Sella/parasellar → Orbits → Sinuses → Mastoid air cells → Vascular structures
   — CT CHEST: Lungs (each lobe, ground-glass vs consolidation vs nodules, window settings) → Airways (trachea, bronchi) → Mediastinum (lymph nodes with short-axis measurement) → Heart and pericardium → Great vessels (aorta dimensions) → Pleural spaces → Chest wall → Bones → Upper abdomen if included
   — CT ABDOMEN/PELVIS: Liver (size, density, focal lesions with segment location) → Gallbladder and biliary → Pancreas → Spleen → Adrenals → Kidneys and ureters → Bladder → Bowel (stomach through rectum) → Mesentery and peritoneum → Lymph nodes → Vessels (aorta, IVC) → Musculoskeletal → Pelvic organs
4. MEASUREMENTS: Provide Hounsfield unit estimates where relevant (e.g., hyperdense blood ~60-80 HU, fluid ~0-20 HU). Measure lesion sizes in at least two dimensions.
5. DIFFERENTIAL DIAGNOSIS: For each abnormal finding, provide the most likely diagnosis AND 2-3 differential diagnoses ranked by probability.
6. CLINICAL CORRELATION: Synthesize all findings into a coherent clinical assessment.

Return ONLY a single valid JSON object — no markdown, no backticks, no extra text:

{
  "xray_type": "CT Scan — specify exact type and region, e.g. Non-contrast CT Brain, Contrast-enhanced CT Chest/Abdomen/Pelvis, CT Pulmonary Angiography, CT Cervical Spine",
  "severity": "None or Low or Medium or High",
  "conditions_detected": ["Use exact ICD-compatible medical terminology. E.g.: Acute right MCA territory infarct, 3.2cm right hepatic lobe hypodense lesion suspicious for metastasis, Acute appendicitis with periappendiceal fat stranding, No acute intracranial abnormality"],
  "findings": "Write a comprehensive structured CT report. Begin with technical assessment and scan parameters. Then systematically describe EVERY structure using the protocol above. Include Hounsfield unit estimates, precise measurements, enhancement patterns, and anatomical relationships. Note both abnormal AND pertinent negative findings. This must read like an actual radiology report from an academic medical center.",
  "recommendations": ["5-7 specific evidence-based recommendations. Include: relevant lab correlations, follow-up imaging with modality/timing/protocol, specialist referrals with urgency, and therapeutic considerations. Each must be justified by findings."],
  "next_steps": "Precise clinical pathway: (1) Urgency — routine/urgent/emergent, (2) Specialist to consult and why, (3) Investigations in priority order, (4) Interim management, (5) Follow-up timeline",
  "confidence": "Low or Medium or High — based on image quality, slice selection, and diagnostic certainty",
  "disclaimer": "AI-assisted analysis for educational purposes only. Consult a licensed radiologist or physician.",
  "layman_summary": "2-3 sentences in plain English. Name the condition found or state everything looks normal. Explain what it means simply. Indicate urgency. Be direct and honest."
}`;

const MRI_PROMPT = `You are a senior board-certified radiologist (FRCR/ABR) with 25+ years of clinical experience specializing in MRI interpretation and neuroradiology/musculoskeletal imaging, currently working at a top-tier academic medical center.

CRITICAL RULES — FOLLOW EXACTLY:
• NEVER hallucinate or fabricate findings. Only describe what you can DIRECTLY observe in this image.
• If you cannot determine something, say "Cannot be determined from this image" — never guess.
• If the image is not an MRI scan or is too low quality, state that clearly instead of inventing findings.
• Every finding MUST include precise anatomical location, signal characteristics, and size estimates.
• Use ONLY established medical terminology consistent with ACR, RSNA, and WHO standards.

SYSTEMATIC MRI READING PROTOCOL — follow every step:
1. IMAGE IDENTIFICATION: Identify the MRI sequence (T1-weighted, T2-weighted, FLAIR, DWI/ADC, T1 post-contrast, STIR, GRE/SWI, MRA), anatomical region, and imaging plane (axial, coronal, sagittal). Note if contrast has been administered.
2. SIGNAL ANALYSIS: For each finding, describe signal intensity relative to the sequence:
   — T1: Is it hyperintense (bright = fat, blood products, melanin, protein) or hypointense (dark = fluid, most pathology)?
   — T2: Is it hyperintense (bright = fluid, edema, most pathology) or hypointense (dark = calcium, hemosiderin, fibrous tissue)?
   — FLAIR: Hyperintense lesions suggest pathology (edema, gliosis, demyelination); CSF is suppressed
   — DWI/ADC: Restricted diffusion (DWI bright + ADC dark) = acute ischemia, abscess, hypercellular tumor
3. SYSTEMATIC EVALUATION:
   — MRI BRAIN: Scalp and calvarium → Extra-axial spaces → Cortical grey matter (each lobe) → White matter (periventricular, subcortical, deep) → Basal ganglia and thalami → Internal capsule → Brainstem (midbrain, pons, medulla) → Cerebellum → Ventricles and CSF spaces → Sella/pituitary → Cranial nerves → Vascular flow voids → Orbits and sinuses
   — MRI SPINE: Vertebral body alignment and height → Disc morphology (each level — hydration, bulge, protrusion, extrusion, sequestration) → Spinal cord signal and caliber → Neural foramina → Facet joints → Paraspinal soft tissues → Conus and cauda equina
   — MRI MUSCULOSKELETAL: Bones (marrow signal, fractures, AVN) → Cartilage (thickness, defects) → Ligaments (each major ligament — intact/partial tear/complete tear) → Tendons → Menisci (if knee) → Labrum (if shoulder/hip) → Muscles → Joint effusion → Soft tissues
4. MEASUREMENTS: Measure lesion sizes in at least two dimensions. Note multiplicity and distribution pattern.
5. DIFFERENTIAL DIAGNOSIS: For each abnormal finding, provide the most likely diagnosis AND 2-3 differential diagnoses ranked by probability based on signal characteristics and morphology.
6. CLINICAL CORRELATION: Synthesize all findings. Correlate signal characteristics across sequences if multiple sequences are visible.

Return ONLY a single valid JSON object — no markdown, no backticks, no extra text:

{
  "xray_type": "MRI — specify sequence and region, e.g. MRI Brain T2 FLAIR Axial, MRI Lumbar Spine T2 Sagittal, MRI Right Knee PD Fat-Sat, MRI Cardiac Cine SSFP",
  "severity": "None or Low or Medium or High",
  "conditions_detected": ["Use exact ICD-compatible medical terminology. E.g.: Multiple periventricular T2/FLAIR hyperintense lesions consistent with demyelination (MS), L4-L5 posterolateral disc extrusion with left S1 nerve root compression, Complete ACL tear with associated bone marrow edema pattern, Grade III chondromalacia of medial femoral condyle"],
  "findings": "Write a comprehensive structured MRI report. Begin with sequence identification and technical quality. Describe signal intensity characteristics for each finding (T1/T2/FLAIR/DWI behavior). Systematically evaluate every structure using the protocol above. Include precise measurements, enhancement patterns if post-contrast, and morphological descriptors. Note both abnormal AND pertinent negative findings. This must read like an actual MRI report from an academic medical center.",
  "recommendations": ["5-7 specific evidence-based recommendations. Include: additional MRI sequences or contrast if needed, correlative imaging, relevant lab tests, specialist referrals with urgency, and therapeutic considerations. Each must be justified by findings."],
  "next_steps": "Precise clinical pathway: (1) Urgency — routine/urgent/emergent, (2) Specialist to consult and why, (3) Investigations in priority order, (4) Interim management, (5) Follow-up timeline",
  "confidence": "Low or Medium or High — based on image quality, sequence availability, and diagnostic certainty",
  "disclaimer": "AI-assisted analysis for educational purposes only. Consult a licensed radiologist or physician.",
  "layman_summary": "2-3 sentences in plain English. Name the condition found or state everything looks normal. Explain what it means simply. Indicate urgency. Be direct and honest."
}`;

function getPromptForScanType(scanType) {
  if (scanType === 'ct') return CT_SCAN_PROMPT;
  if (scanType === 'mri') return MRI_PROMPT;
  return MEDICAL_PROMPT;
}

// ─── Groq: 100% free, 14,400 req/day, ~3-5s, works from India ─────────────────
async function callGroq(base64, mimeType, groqKey, prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct', // free vision model on Groq
      messages: [
        { role: 'system', content: 'You are a senior radiologist providing clinical-grade diagnostic reports. Be precise, systematic, and never fabricate findings. If unsure, state uncertainty explicitly. Always use standard medical terminology.' },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 1800,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Groq HTTP ${response.status}`);

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty Groq response');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Groq response');
  return JSON.parse(jsonMatch[0]);
}

// ─── OpenRouter: free fallback models ─────────────────────────────────────────
const OR_FREE_MODELS = [
  'google/gemma-4-27b-it:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
];

async function callOpenRouter(model, base64, mimeType, orKey, prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${orKey}`,
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'ClarivueAI',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a senior radiologist providing clinical-grade diagnostic reports. Be precise, systematic, and never fabricate findings. If unsure, state uncertainty explicitly. Always use standard medical terminology.' },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 1800,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const msg = data?.error?.message || `HTTP ${response.status}`;
    if (SKIP_PHRASES.some(p => msg.toLowerCase().includes(p.toLowerCase())))
      throw Object.assign(new Error(msg), { skip: true });
    throw new Error(msg);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw Object.assign(new Error('Empty response'), { skip: true });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw Object.assign(new Error('No JSON in response'), { skip: true });
  return JSON.parse(jsonMatch[0]);
}

// ─── Master analysis: Groq first, OpenRouter free models as fallback ───────────
async function analyzeWithFallback(base64, mimeType, groqKey, orKey, prompt) {
  // 1. Try Groq (fastest, completely free)
  if (groqKey) {
    try {
      console.log('[ClarivueAI] Trying Groq (Llama 4 Scout)...');
      const result = await callGroq(base64, mimeType, groqKey, prompt);
      console.log('[ClarivueAI] ✅ Groq success');
      return result;
    } catch (err) {
      console.warn('[ClarivueAI] Groq failed:', err.message);
    }
  }

  // 2. Fallback to OpenRouter free models
  if (orKey) {
    for (const model of OR_FREE_MODELS) {
      try {
        console.log(`[ClarivueAI] Trying OpenRouter: ${model}`);
        const result = await callOpenRouter(model, base64, mimeType, orKey, prompt);
        console.log(`[ClarivueAI] ✅ OpenRouter success: ${model}`);
        return result;
      } catch (err) {
        console.warn(`[ClarivueAI] ❌ ${model}:`, err.message);
        if (err.skip) continue;
        throw err;
      }
    }
  }

  throw new Error('All providers failed. Check your API keys and try again.');
}

// ─── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [scanType, setScanType] = useState('xray');
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return;
    if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
      setError('Please upload a JPEG or PNG image.');
      return;
    }
    setError(null);
    setFile(selectedFile);
    setResult(null);
    setImageUrl(URL.createObjectURL(selectedFile));
  }, []);

  const handleRemove = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setFile(null);
    setImageUrl(null);
    setResult(null);
    setError(null);
  }, [imageUrl]);

  const handleReset = useCallback(() => {
    handleRemove();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [handleRemove]);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      const orKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!groqKey && !orKey) throw new Error('No API key configured. Set VITE_GROQ_API_KEY in .env');

      const { base64, mimeType } = await compressImage(file);
      const prompt = getPromptForScanType(scanType);
      const parsed = await analyzeWithFallback(base64, mimeType, groqKey, orKey, prompt);
      setResult(parsed);
    } catch (err) {
      console.error('[ClarivueAI] Fatal error:', err);
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [file, scanType]);

  return (
    <div style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
      {/* Animated background layers */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div className="grid-bg" />
      <div className="scanline-overlay" />
      <div className="medical-icons">
        {/* Heartbeat */}
        <svg className="med-icon" viewBox="0 0 24 24"><path d="M19.32 8.75c-.32-.24-.76-.32-1.15-.22l-4.14 1.1-2.48-6.19a1.25 1.25 0 0 0-2.35 0l-3.36 8.4-1.54-.77a1.25 1.25 0 0 0-1.12 2.24l3 1.5c.34.17.75.14 1.05-.09l2.2-1.65 2.19 5.48c.19.47.65.78 1.16.78.02 0 .04 0 .06 0 .52-.03.96-.38 1.12-.87l2.84-8.52 1.83-.48c.67-.18 1.07-.87.89-1.54-.14-.5-.6-.82-1.1-.82-.03 0-.07 0-.1 0z"/></svg>
        {/* Medical Cross */}
        <svg className="med-icon" viewBox="0 0 24 24"><path d="M19 10h-5V5c0-1.1-.9-2-2-2h-0c-1.1 0-2 .9-2 2v5H5c-1.1 0-2 .9-2 2h0c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h0c1.1 0 2-.9 2-2v-5h5c1.1 0 2-.9 2-2h0c0-1.1-.9-2-2-2z"/></svg>
        {/* DNA */}
        <svg className="med-icon" viewBox="0 0 24 24"><path d="M15.5 8c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5S16.88 8 15.5 8zm-7 0C7.12 8 6 9.12 6 10.5S7.12 13 8.5 13 11 11.88 11 10.5 9.88 8 8.5 8zm7 6c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zm-7 0C7.12 14 6 15.12 6 16.5S7.12 19 8.5 19 11 17.88 11 16.5 9.88 14 8.5 14zM22 2v20h-2V2h2zm-18 0v20H2V2h2z"/></svg>
        {/* Pill */}
        <svg className="med-icon" viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.6 2l-6.9 6.9c-2 2-2 5.24 0 7.24 1 1 2.31 1.5 3.62 1.5s2.62-.5 3.62-1.5l6.9-6.9c1.19-1.19 2-2.86 2-4.6s-.81-3.41-2-4.6c-1.19-1.19-2.86-2-4.6-2zm-1.8 11.4l-7.1 7.1c-.8.8-2 .8-2.8 0s-.8-2 0-2.8l7.1-7.1 2.8 2.8zm4.2-4.2l-1.4 1.4-2.8-2.8 1.4-1.4c.8-.8 2-.8 2.8 0s.8 2 0 2.8z"/></svg>
        {/* Plus */}
        <svg className="med-icon" viewBox="0 0 24 24"><path d="M19 10h-5V5c0-1.1-.9-2-2-2h-0c-1.1 0-2 .9-2 2v5H5c-1.1 0-2 .9-2 2h0c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h0c1.1 0 2-.9 2-2v-5h5c1.1 0 2-.9 2-2h0c0-1.1-.9-2-2-2z"/></svg>
        {/* Heart */}
        <svg className="med-icon" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />

        <main style={{ flex: 1, width: '100%' }}>
          <Hero />

          {error && (
            <div style={{ width: '100%', padding: '0 1.5rem 1.5rem' }}>
              <div style={{
                maxWidth: '48rem', marginLeft: 'auto', marginRight: 'auto',
                background: 'rgba(201, 24, 74, 0.06)', border: '1px solid rgba(201, 24, 74, 0.25)',
                borderRadius: '12px', padding: '1rem 1.5rem', textAlign: 'center',
              }}>
                <p style={{ color: 'var(--color-red)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  ⚠ {error}
                </p>
              </div>
            </div>
          )}

          {!file && !result && (
            <UploadZone onFileSelect={handleFileSelect} isDragging={isDragging} setIsDragging={setIsDragging} scanType={scanType} setScanType={setScanType} />
          )}

          {file && !isAnalyzing && !result && (
            <PreviewCard file={file} imageUrl={imageUrl} onAnalyze={handleAnalyze} onRemove={handleRemove} isAnalyzing={isAnalyzing} scanType={scanType} />
          )}

          {isAnalyzing && <ScanningAnimation scanType={scanType} />}

          {result && <ResultsSection result={result} onReset={handleReset} scanType={scanType} />}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
