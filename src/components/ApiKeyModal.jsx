import React, { useState } from 'react';

export default function ApiKeyModal({ isOpen, onClose, onKeySaved }) {
  const currentEnvKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  const storedKey = localStorage.getItem('clarivue_openrouter_api_key') || '';
  const activeKey = storedKey || currentEnvKey;

  const [inputKey, setInputKey] = useState(storedKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    const keyToTest = inputKey.trim() || currentEnvKey;
    if (!keyToTest) {
      setTestResult({ success: false, message: 'Please enter an OpenRouter API key.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Test key live against primary Nemotron model
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyToTest}`,
          'HTTP-Referer': 'https://clarivue-ai.vercel.app',
          'X-Title': 'ClarivueAI-KeyTest',
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3.5-super-vl:free',
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        if (inputKey.trim()) {
          localStorage.setItem('clarivue_openrouter_api_key', inputKey.trim());
        }
        setTestResult({
          success: true,
          message: '✅ Success! Key is active and Nemotron 3.5 is responding.',
        });
        if (onKeySaved) onKeySaved(inputKey.trim());
      } else {
        const errMsg = data?.error?.message || `HTTP ${res.status}`;
        setTestResult({
          success: false,
          message: `❌ ${errMsg}`,
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: `❌ Network error: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClearCustom = () => {
    localStorage.removeItem('clarivue_openrouter_api_key');
    setInputKey('');
    setTestResult({ success: true, message: 'Reset to default .env API key.' });
    if (onKeySaved) onKeySaved('');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(7, 16, 32, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        maxWidth: '32rem',
        width: '100%',
        padding: '2rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--color-border)',
        position: 'relative',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.25rem', right: '1.25rem',
            background: 'none', border: 'none', fontSize: '1.25rem',
            cursor: 'pointer', color: 'var(--color-text-secondary)',
          }}
        >✕</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🔑</span>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
          }}>AI Provider & API Key Settings</h2>
        </div>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
          marginBottom: '1.25rem',
        }}>
          ClarivueAI uses <strong>NVIDIA Nemotron 3.5 Super VL</strong> via OpenRouter. Free accounts have an account-wide daily limit (<code>free-models-per-day</code>) that resets at 00:00 UTC. If rate-limited, paste a fresh key or one with credits below.
        </p>

        {/* Current Key Status */}
        <div style={{
          background: 'rgba(15, 76, 129, 0.04)',
          border: '1px solid rgba(15, 76, 129, 0.12)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-mono)',
        }}>
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
            Current Active Key:
          </div>
          <div style={{ color: 'var(--color-text)', fontWeight: 600 }}>
            {activeKey ? `${activeKey.slice(0, 10)}...${activeKey.slice(-6)}` : 'None configured'}
            {storedKey && <span style={{ marginLeft: '0.5rem', color: 'var(--color-cyan)', fontSize: '0.7rem' }}>(Custom Override)</span>}
          </div>
        </div>

        {/* Key Input */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: '0.5rem',
          }}>
            Enter OpenRouter API Key (sk-or-v1-...):
          </label>
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="Paste your key here (stored locally in browser)"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            background: testResult.success ? 'rgba(46, 196, 182, 0.1)' : 'rgba(201, 24, 74, 0.08)',
            border: `1px solid ${testResult.success ? 'var(--color-cyan)' : 'var(--color-red)'}`,
            color: testResult.success ? 'var(--color-cyan)' : 'var(--color-red)',
          }}>
            {testResult.message}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          {storedKey && (
            <button
              onClick={handleClearCustom}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: '#f8f9fa',
                color: 'var(--color-text-secondary)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              Reset to Default
            </button>
          )}

          <button
            onClick={handleTestAndSave}
            disabled={testing}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #0f4c81, #028090)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              cursor: testing ? 'not-allowed' : 'pointer',
              opacity: testing ? 0.7 : 1,
            }}
          >
            {testing ? 'Testing Key...' : 'Save & Test Key'}
          </button>
        </div>
      </div>
    </div>
  );
}
