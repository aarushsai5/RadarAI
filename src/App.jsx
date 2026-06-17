import { useState, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import UploadZone from './components/UploadZone';
import PreviewCard from './components/PreviewCard';
import ScanningAnimation from './components/ScanningAnimation';
import ResultsSection from './components/ResultsSection';
import ComparisonUploadZone from './components/ComparisonUploadZone';
import ComparisonResultsSection from './components/ComparisonResultsSection';
import HistoryPanel from './components/HistoryPanel';
import Footer from './components/Footer';

// ─── Medical-grade image preprocessing ─────────────────────────────────────────
function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1536; // Higher res for medical detail
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Medical contrast enhancement (lightweight CLAHE-like)
      const imageData = ctx.getImageData(0, 0, width, height);
      const d = imageData.data;
      let min = 255, max = 0;
      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
        if (lum < min) min = lum;
        if (lum > max) max = lum;
      }
      const range = max - min || 1;
      if (range < 200) { // Only enhance low-contrast images
        const scale = 245 / range;
        for (let i = 0; i < d.length; i += 4) {
          d[i]   = Math.min(255, Math.max(0, (d[i] - min) * scale + 5));
          d[i+1] = Math.min(255, Math.max(0, (d[i+1] - min) * scale + 5));
          d[i+2] = Math.min(255, Math.max(0, (d[i+2] - min) * scale + 5));
        }
        ctx.putImageData(imageData, 0, 0);
      }

      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };
    img.src = url;
  });
}

// ─── Clinical-grade X-ray prompt (upgraded — covers all body parts including Dental) ─
const MEDICAL_PROMPT = `You are a highly specialized radiologist AI with expert knowledge in diagnostic radiology. You have been trained on NIH ChestX-ray14 (112,000 images), CheXpert (224,000 images), RSNA Pneumonia Detection dataset, MURA Musculoskeletal dataset, VinBigData Chest X-ray dataset, and dental radiograph datasets.

Analyze this X-ray image with maximum precision. This may be a chest X-ray, abdominal X-ray, bone X-ray, spine X-ray, hand X-ray, foot X-ray, dental X-ray, or any other body part. Auto-detect the region and analyze accordingly.

For Chest X-Ray specifically check for: Atelectasis, Cardiomegaly, Effusion, Infiltration, Mass, Nodule, Pneumonia, Pneumothorax, Consolidation, Edema, Emphysema, Fibrosis, Pleural Thickening, Hernia, Tuberculosis.

For Bone X-Ray specifically check for: Fractures (hairline, compound, stress), Osteoporosis, Osteoarthritis, Bone tumors, Dislocations, Growth plate injuries, Osteomyelitis.

For Dental X-Ray specifically check for: Dental caries (cavities), Periapical abscess, Bone loss, Impacted teeth, Root fractures, Periodontal disease, Cysts, Tumors.

For Spine X-Ray specifically check for: Scoliosis, Kyphosis, Disc space narrowing, Vertebral fractures, Spondylolisthesis, Degenerative changes.

For Abdominal X-Ray specifically check for: Bowel obstruction, Free air, Calcifications, Organomegaly, Foreign bodies.

Return ONLY a valid JSON object — no markdown, no backticks, no extra text:

{
  "xray_type": "Auto-detected specific type e.g. Chest PA X-Ray, Dental Periapical X-Ray, Left Hand X-Ray, Lumbar Spine X-Ray",
  "severity": "None or Low or Medium or High",
  "conditions_detected": ["comprehensive list of all detected conditions with anatomical location, or No abnormality detected if clear"],
  "findings": "Extremely detailed clinical paragraph — describe opacity, density, contours, margins, calcifications, soft tissue, bone cortex, joint spaces, tooth structure, everything visible. Be as precise and detailed as a senior radiologist would be.",
  "recommendations": ["4 to 6 specific actionable medical recommendations"],
  "next_steps": "Specific specialist referral — pulmonologist, orthopedic, dentist, gastroenterologist etc.",
  "confidence": "Low or Medium or High",
  "disclaimer": "AI-assisted analysis for educational purposes only. Consult a licensed physician."
}`;

const SKIP_PHRASES = ['not found', 'not a valid', 'no endpoints', 'provider returned error', 'provider error', 'rate limit', 'quota'];

const CT_SCAN_PROMPT = `You are a highly specialized radiologist AI with expert knowledge in CT scan interpretation. Trained on large scale CT imaging datasets covering neurological, thoracic, abdominal, and musculoskeletal CT scans.

Analyze this CT scan image with maximum clinical precision. Auto-detect the body region and scan protocol.

For CT Brain check for: Hemorrhage (epidural, subdural, subarachnoid, intracerebral), Infarct, Tumor, Edema, Hydrocephalus, Midline shift, Herniation, White matter changes, Calcifications.

For CT Chest check for: Pulmonary embolism signs, Lung nodules, Ground glass opacities, Consolidation, Pleural effusion, Lymphadenopathy, Aortic abnormalities, Pericardial effusion.

For CT Abdomen/Pelvis check for: Organ enlargement, Masses, Calculi (kidney/gallbladder), Appendicitis signs, Free fluid, Bowel obstruction, Vascular abnormalities, Lymph nodes.

For CT Spine check for: Disc herniation, Spinal stenosis, Vertebral fractures, Cord compression, Spondylosis.

Describe Hounsfield unit ranges where relevant. Note enhancement patterns if contrast is visible.

Return ONLY a valid JSON object — no markdown, no backticks, no extra text:

{
  "xray_type": "Auto-detected specific type e.g. CT Brain Non-Contrast, CT Chest with Contrast, CT Abdomen Pelvis",
  "severity": "None or Low or Medium or High",
  "conditions_detected": ["comprehensive list of all detected conditions with precise anatomical location"],
  "findings": "Extremely detailed clinical paragraph — describe attenuation values, enhancement patterns, organ sizes, lesion characteristics, margins, density, any mass effect, vascular structures, bone windows findings. Be as precise as a senior radiologist.",
  "recommendations": ["4 to 6 specific actionable medical recommendations"],
  "next_steps": "Specific specialist referral and urgency level",
  "confidence": "Low or Medium or High",
  "disclaimer": "AI-assisted analysis for educational purposes only. Consult a licensed physician."
}`;

const MRI_PROMPT = `You are a highly specialized radiologist AI with expert knowledge in MRI interpretation across all sequences and body regions. Trained on large scale MRI datasets.

Analyze this MRI image with maximum clinical precision. Auto-detect the sequence type (T1, T2, FLAIR, DWI, GRE, STIR) and body region.

For MRI Brain check for: Tumors (glioma, meningioma, metastasis), MS plaques, Infarcts (DWI restriction), Hemorrhage, Hydrocephalus, White matter lesions, Cortical atrophy, Pituitary abnormalities.

For MRI Spine check for: Disc herniation, Cord signal changes, Syrinx, Tumor, Compression fractures, Ligament injury, Epidural abscess.

For MRI Knee check for: ACL/PCL/MCL/LCL tears, Meniscal tears, Cartilage loss, Bone marrow edema, Effusion, Baker's cyst.

For MRI Shoulder check for: Rotator cuff tears, Labral tears, Impingement, Bursitis, AC joint abnormality.

For MRI Cardiac check for: Myocardial infarction, Cardiomyopathy, Pericardial disease, Valve abnormalities.

Describe signal characteristics on each sequence. Note T1 hypointense/hyperintense, T2 signal, FLAIR suppression, DWI restriction where relevant.

Return ONLY a valid JSON object — no markdown, no backticks, no extra text:

{
  "xray_type": "Auto-detected specific type e.g. MRI Brain T2 FLAIR, MRI Right Knee, MRI Lumbar Spine T1",
  "severity": "None or Low or Medium or High",
  "conditions_detected": ["comprehensive list of all detected conditions with precise anatomical location and signal characteristics"],
  "findings": "Extremely detailed clinical paragraph — describe signal intensities on each visible sequence, lesion size, location, margins, surrounding edema, mass effect, enhancement if visible, normal structures for comparison. Be as precise as a senior radiologist.",
  "recommendations": ["4 to 6 specific actionable medical recommendations"],
  "next_steps": "Specific specialist referral and urgency level",
  "confidence": "Low or Medium or High",
  "disclaimer": "AI-assisted analysis for educational purposes only. Consult a licensed physician."
}`;

const ECG_PROMPT = `You are a highly specialized cardiologist AI with expert knowledge in ECG and EKG interpretation. You have been trained on large scale ECG datasets including PhysioNet, PTB-XL (21,837 ECGs), and CPSC 2018 datasets.

Analyze this ECG/EKG image with maximum clinical precision.

Check systematically for the following:

RATE: Calculate approximate heart rate from RR intervals.

RHYTHM: Sinus rhythm, Atrial fibrillation, Atrial flutter, Supraventricular tachycardia, Ventricular tachycardia, Ventricular fibrillation, Heart block (1st, 2nd Mobitz I, 2nd Mobitz II, 3rd degree), Junctional rhythm, Ectopic beats.

P WAVE: Presence, morphology, axis, duration, amplitude. P mitrale, P pulmonale.

PR INTERVAL: Normal (120-200ms), Short (WPW syndrome), Prolonged (heart block).

QRS COMPLEX: Duration, morphology, axis. Bundle branch blocks (LBBB, RBBB), Ventricular hypertrophy (LVH, RVH), Delta waves, Pathological Q waves.

ST SEGMENT: Elevation (STEMI — specify leads and territory), Depression (ischemia, NSTEMI), Reciprocal changes.

T WAVE: Inversion (specify leads), Hyperacute T waves, Flattening, Tall peaked T waves (hyperkalemia).

QT INTERVAL: Calculate QTc. Prolonged QTc (>440ms men, >460ms women) — risk of Torsades.

OTHER: Osborn waves (hypothermia), Epsilon waves (ARVC), Brugada pattern, Early repolarization.

Return ONLY a valid JSON object — no markdown, no backticks, no extra text:

{
  "xray_type": "ECG — specify type e.g. 12-Lead ECG, Rhythm Strip, Holter excerpt",
  "heart_rate": "Approximate BPM e.g. 72 bpm",
  "rhythm": "Primary rhythm identified",
  "severity": "None or Low or Medium or High",
  "conditions_detected": ["comprehensive list of all detected abnormalities with lead specific findings, or Normal Sinus Rhythm if no abnormality"],
  "findings": "Extremely detailed systematic analysis — rate, rhythm, P wave, PR interval, QRS, ST segment, T wave, QTc, axis, any other findings. Be as precise as a senior cardiologist.",
  "recommendations": ["4 to 6 specific actionable cardiac recommendations"],
  "next_steps": "Urgency level and specialist referral — cardiology, emergency, routine follow-up",
  "confidence": "Low or Medium or High",
  "disclaimer": "AI-assisted analysis for educational purposes only. Consult a licensed cardiologist or physician."
}`;

function getPromptForScanType(scanType, localPrediction = null) {
  let promptText = MEDICAL_PROMPT;
  if (scanType === 'ct') promptText = CT_SCAN_PROMPT;
  else if (scanType === 'mri') promptText = MRI_PROMPT;
  else if (scanType === 'ecg') promptText = ECG_PROMPT;

  if (localPrediction && localPrediction.predictions) {
    const predictionsSummary = localPrediction.predictions
      .map(p => `- ${p.label}: ${(p.probability * 100).toFixed(1)}%`)
      .join('\n');
    
    const localContext = `\n\n=== LOCAL ACCURACY CLASSIFIER (AMD GPU ACCELERATED) ===
Our local DirectML model analyzed this image and predicted:
${predictionsSummary}

IMPORTANT DIRECTIVE: Incorporate these probability scores in your final report. If a specific abnormality shows high probability (> 50%), evaluate the scan structure meticulously for that condition.
======================================================\n\n`;
    
    return localContext + promptText;
  }
  return promptText;
}

async function callLocalClassifier(file, scanType) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scan_type', scanType);

    const response = await fetch('http://127.0.0.1:8000/predict', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn('[ClarivueAI] Local classifier offline or model not trained:', err.message);
    return null;
  }
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
        { role: 'system', content: prompt === ECG_PROMPT ? 'You are a senior cardiologist providing clinical-grade ECG/EKG interpretation reports. Be precise, systematic, and never fabricate findings. If unsure, state uncertainty explicitly. Always use standard medical terminology.' : 'You are a senior radiologist providing clinical-grade diagnostic reports. Be precise, systematic, and never fabricate findings. If unsure, state uncertainty explicitly. Always use standard medical terminology.' },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 4000,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Groq HTTP ${response.status}`);

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty Groq response');

  // Better JSON extraction in case model wraps in markdown
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No valid JSON found in Groq response');
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error('Failed to parse Groq JSON response');
  }
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
        { role: 'system', content: prompt === ECG_PROMPT ? 'You are a senior cardiologist providing clinical-grade ECG/EKG interpretation reports. Be precise, systematic, and never fabricate findings. If unsure, state uncertainty explicitly. Always use standard medical terminology.' : 'You are a senior radiologist providing clinical-grade diagnostic reports. Be precise, systematic, and never fabricate findings. If unsure, state uncertainty explicitly. Always use standard medical terminology.' },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 4000,
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
  if (!jsonMatch) throw Object.assign(new Error('No valid JSON found in response'), { skip: true });
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw Object.assign(new Error('Failed to parse OpenRouter JSON response'), { skip: true });
  }
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

// ─── Comparison Prompt ──────────────────────────────────────────────────────────
const COMPARISON_PROMPT = `You are an expert radiologist AI. You are given two medical scan images of the same patient — Scan 1 is older and Scan 2 is more recent. Compare both scans and return ONLY a valid JSON object — no markdown, no backticks, no extra text:

{
  "scan_type": "e.g. Chest X-Ray, CT Brain, MRI Spine",
  "scan1_findings": "Detailed findings from the older scan",
  "scan2_findings": "Detailed findings from the recent scan",
  "comparison": "Detailed paragraph comparing both scans — what has changed, improved, worsened, or remained stable",
  "progression": "Improved or Stable or Worsened",
  "severity_now": "None or Low or Medium or High",
  "recommendations": ["3 to 5 recommendations based on progression"],
  "next_steps": "What patient should do next based on comparison",
  "confidence": "Low or Medium or High",
  "disclaimer": "AI-assisted analysis for educational purposes only. Consult a licensed physician."
}`;

// ─── Comparison API calls (two images in one request) ──────────────────────────
async function callGroqComparison(b64_1, mime1, b64_2, mime2, groqKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: 'You are a senior radiologist providing clinical-grade diagnostic comparison reports. Be precise, systematic, and never fabricate findings.' },
        { role: 'user', content: [
          { type: 'image_url', image_url: { url: `data:${mime1};base64,${b64_1}` } },
          { type: 'image_url', image_url: { url: `data:${mime2};base64,${b64_2}` } },
          { type: 'text', text: COMPARISON_PROMPT },
        ]},
      ],
      temperature: 0, max_tokens: 4000,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Groq HTTP ${response.status}`);
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty Groq response');
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No valid JSON in Groq response');
  try { return JSON.parse(jsonMatch[0]); } catch (e) { throw new Error('Failed to parse Groq comparison JSON'); }
}

async function callOpenRouterComparison(model, b64_1, mime1, b64_2, mime2, orKey) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${orKey}`, 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'ClarivueAI' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a senior radiologist providing clinical-grade diagnostic comparison reports. Be precise, systematic, and never fabricate findings.' },
        { role: 'user', content: [
          { type: 'image_url', image_url: { url: `data:${mime1};base64,${b64_1}` } },
          { type: 'image_url', image_url: { url: `data:${mime2};base64,${b64_2}` } },
          { type: 'text', text: COMPARISON_PROMPT },
        ]},
      ],
      temperature: 0, max_tokens: 4000,
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
  if (!jsonMatch) throw Object.assign(new Error('No valid JSON in response'), { skip: true });
  try { return JSON.parse(jsonMatch[0]); } catch (e) { throw Object.assign(new Error('Failed to parse comparison JSON'), { skip: true }); }
}

async function analyzeComparisonWithFallback(b64_1, mime1, b64_2, mime2, groqKey, orKey) {
  if (groqKey) {
    try {
      console.log('[ClarivueAI] Comparison: Trying Groq...');
      const result = await callGroqComparison(b64_1, mime1, b64_2, mime2, groqKey);
      console.log('[ClarivueAI] ✅ Groq comparison success');
      return result;
    } catch (err) { console.warn('[ClarivueAI] Groq comparison failed:', err.message); }
  }
  if (orKey) {
    for (const model of OR_FREE_MODELS) {
      try {
        console.log(`[ClarivueAI] Comparison: Trying OpenRouter: ${model}`);
        const result = await callOpenRouterComparison(model, b64_1, mime1, b64_2, mime2, orKey);
        console.log(`[ClarivueAI] ✅ OpenRouter comparison success: ${model}`);
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

// ─── History helpers ────────────────────────────────────────────────────────────
function saveToHistory(result, scanType, isComparison = false) {
  try {
    const history = JSON.parse(localStorage.getItem('clarivue_history') || '[]');
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      scanType,
      severity: isComparison ? result.severity_now : result.severity,
      conditions: isComparison
        ? [result.progression || 'Comparison']
        : (result.conditions_detected || []),
      isComparison,
      result,
    };
    history.unshift(entry);
    if (history.length > 10) history.pop();
    localStorage.setItem('clarivue_history', JSON.stringify(history));
  } catch (e) { console.warn('[ClarivueAI] History save failed:', e); }
}

// ─── App ───────────────────────────────────────────────────────────────────────
function App() {
  // ── Existing single-scan state ──
  const [scanType, setScanType] = useState('xray');
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // ── Feature 1: Comparison Mode ──
  const [compareMode, setCompareMode] = useState(false);
  const [file2, setFile2] = useState(null);
  const [imageUrl2, setImageUrl2] = useState(null);
  const [isDragging2, setIsDragging2] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  // ── Feature 2: History ──
  const [showHistory, setShowHistory] = useState(false);

  // ── Existing handlers (unchanged) ──
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

      // 1. Call local classifier (runs fast and fails silently if offline)
      console.log('[ClarivueAI] Querying local AMD GPU classifier...');
      const localAnalysis = await callLocalClassifier(file, scanType);
      
      // 2. Compress image and call LLM with local predictions integrated in prompt
      const { base64, mimeType } = await compressImage(file);
      const prompt = getPromptForScanType(scanType, localAnalysis);
      const parsed = await analyzeWithFallback(base64, mimeType, groqKey, orKey, prompt);

      if (localAnalysis) {
        parsed.local_model_meta = localAnalysis;
        console.log('[ClarivueAI] Local classifier results successfully merged into report.');
      }

      setResult(parsed);
      saveToHistory(parsed, scanType, false);
    } catch (err) {
      console.error('[ClarivueAI] Fatal error:', err);
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [file, scanType]);

  // ── Comparison handlers ──
  const handleFileSelect2 = useCallback((selectedFile) => {
    if (!selectedFile) return;
    if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
      setError('Please upload a JPEG or PNG image.');
      return;
    }
    setError(null);
    setFile2(selectedFile);
    setImageUrl2(URL.createObjectURL(selectedFile));
  }, []);

  const handleCompare = useCallback(async () => {
    if (!file || !file2) return;
    setIsAnalyzing(true);
    setError(null);
    setComparisonResult(null);

    try {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      const orKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!groqKey && !orKey) throw new Error('No API key configured. Set VITE_GROQ_API_KEY in .env');

      const img1 = await compressImage(file);
      const img2 = await compressImage(file2);
      const parsed = await analyzeComparisonWithFallback(
        img1.base64, img1.mimeType, img2.base64, img2.mimeType, groqKey, orKey
      );
      setComparisonResult(parsed);
      saveToHistory(parsed, scanType, true);
    } catch (err) {
      console.error('[ClarivueAI] Comparison error:', err);
      setError(err.message || 'Comparison failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [file, file2, scanType]);

  const handleResetComparison = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (imageUrl2) URL.revokeObjectURL(imageUrl2);
    setFile(null); setFile2(null);
    setImageUrl(null); setImageUrl2(null);
    setComparisonResult(null);
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [imageUrl, imageUrl2]);

  // ── Mode toggle handler ──
  const handleModeSwitch = useCallback((mode) => {
    if (mode === compareMode) return;
    // Clean up when switching modes
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (imageUrl2) URL.revokeObjectURL(imageUrl2);
    setFile(null); setFile2(null);
    setImageUrl(null); setImageUrl2(null);
    setResult(null); setComparisonResult(null);
    setError(null);
    setCompareMode(mode);
  }, [compareMode, imageUrl, imageUrl2]);

  // ── History handlers ──
  const handleViewHistory = useCallback((item) => {
    if (item.isComparison) {
      setCompareMode(true);
      setComparisonResult(item.result);
      setResult(null);
    } else {
      setCompareMode(false);
      setResult(item.result);
      setComparisonResult(null);
    }
    // Clear file states since we're viewing from history
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (imageUrl2) URL.revokeObjectURL(imageUrl2);
    setFile(null); setFile2(null);
    setImageUrl(null); setImageUrl2(null);
    setError(null);
    setShowHistory(false);
  }, [imageUrl, imageUrl2]);

  // Determine if we're in an active state (has files or results)
  const hasNoContent = !file && !result && !comparisonResult;

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
        <Header showHistory={showHistory} onToggleHistory={() => setShowHistory(h => !h)} />

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

          {/* ── Mode Toggle (shown when no active analysis) ── */}
          {hasNoContent && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div className="mode-toggle">
                <button
                  className={`mode-toggle-btn${!compareMode ? ' active' : ''}`}
                  onClick={() => handleModeSwitch(false)}
                >📄 Single Scan</button>
                <button
                  className={`mode-toggle-btn${compareMode ? ' active' : ''}`}
                  onClick={() => handleModeSwitch(true)}
                >🔄 Compare Scans</button>
              </div>
            </div>
          )}

          {/* ── History Panel ── */}
          {showHistory && (
            <div style={{ width: '100%', padding: '0 1.5rem' }}>
              <HistoryPanel
                onViewResult={handleViewHistory}
                onClose={() => setShowHistory(false)}
              />
            </div>
          )}

          {/* ── SINGLE SCAN MODE (existing behavior, untouched) ── */}
          {!compareMode && (
            <>
              {!file && !result && (
                <UploadZone onFileSelect={handleFileSelect} isDragging={isDragging} setIsDragging={setIsDragging} scanType={scanType} setScanType={setScanType} />
              )}

              {file && !isAnalyzing && !result && (
                <PreviewCard file={file} imageUrl={imageUrl} onAnalyze={handleAnalyze} onRemove={handleRemove} isAnalyzing={isAnalyzing} scanType={scanType} />
              )}

              {isAnalyzing && <ScanningAnimation scanType={scanType} />}

              {result && <ResultsSection result={result} onReset={handleReset} scanType={scanType} />}
            </>
          )}

          {/* ── COMPARISON MODE ── */}
          {compareMode && (
            <>
              {!comparisonResult && !isAnalyzing && (
                <ComparisonUploadZone
                  onFileSelect1={handleFileSelect}
                  onFileSelect2={handleFileSelect2}
                  file1={file} file2={file2}
                  imageUrl1={imageUrl} imageUrl2={imageUrl2}
                  isDragging1={isDragging} setIsDragging1={setIsDragging}
                  isDragging2={isDragging2} setIsDragging2={setIsDragging2}
                  onCompare={handleCompare}
                  isAnalyzing={isAnalyzing}
                  scanType={scanType}
                />
              )}

              {isAnalyzing && <ScanningAnimation scanType={scanType} />}

              {comparisonResult && (
                <ComparisonResultsSection result={comparisonResult} onReset={handleResetComparison} />
              )}
            </>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;

