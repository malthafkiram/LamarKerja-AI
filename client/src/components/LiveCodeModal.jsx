import React, { useState, useEffect, useRef } from 'react';
import { 
  Code2, Play, Sparkles, CheckCircle2, XCircle, Clock, AlertTriangle, 
  RefreshCw, Award, Copy, Check, Terminal, BookOpen, Layers, Lightbulb, 
  X, ExternalLink, ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { stripMarkdownForPlainText } from '../utils/plainText.js';

export default function LiveCodeModal({ isOpen, onClose, jobDetails, profile }) {
  if (!isOpen) return null;

  const [challenge, setChallenge] = useState(null);
  const [difficulty, setDifficulty] = useState('Mid');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Live Runner State
  const [testResults, setTestResults] = useState([]);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [executionError, setExecutionError] = useState(null);
  const [allTestsPassed, setAllTestsPassed] = useState(false);

  // Review State
  const [isReviewing, setIsReviewing] = useState(false);
  const [aiReview, setAiReview] = useState(null);

  const textareaRef = useRef(null);

  const position = jobDetails?.position || jobDetails?.title || '';
  const companyName = jobDetails?.company_name || jobDetails?.company || '';
  const techStack = (jobDetails?.requirements || []).join(', ');

  useEffect(() => {
    if (isOpen) {
      handleLoadChallenge(difficulty);
    }
  }, [isOpen, jobDetails]);

  const handleLoadChallenge = async (diff = difficulty) => {
    setIsLoading(true);
    setTestResults([]);
    setConsoleLogs([]);
    setExecutionError(null);
    setAiReview(null);
    setAllTestsPassed(false);

    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/livecode/generate-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          position,
          companyName,
          techStack,
          difficulty: diff,
          topic: 'Kebutuhan Posisi ' + position
        })
      });

      const data = await res.json();
      if (data.success && data.challenge) {
        setChallenge(data.challenge);
        setCode(data.challenge.starter_code || '// Tuliskan fungsi Anda di sini\nfunction solution() {\n  \n}');
      }
    } catch (err) {
      console.error('Failed to load challenge:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleRunCodeTests = () => {
    setIsRunningTests(true);
    setExecutionError(null);
    setConsoleLogs([]);

    const capturedLogs = [];
    const customConsole = {
      log: (...args) => capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      warn: (...args) => capturedLogs.push('[WARN] ' + args.join(' ')),
      error: (...args) => capturedLogs.push('[ERROR] ' + args.join(' '))
    };

    try {
      const testCases = challenge?.test_cases || [];
      const funcName = challenge?.function_name || 'solution';

      const sandboxFn = new Function('console', `
        ${code}
        if (typeof ${funcName} !== 'function') {
          throw new Error("Fungsi '${funcName}' tidak ditemukan atau belum dideklarasikan!");
        }
        return ${funcName};
      `);

      const userFunction = sandboxFn(customConsole);

      const results = testCases.map((tc, index) => {
        const tcStart = performance.now();
        try {
          const inputArgs = Array.isArray(tc.input_args) ? tc.input_args : [tc.input_args];
          const clonedArgs = JSON.parse(JSON.stringify(inputArgs));
          const actualOutput = userFunction(...clonedArgs);
          const tcEnd = performance.now();

          const expectedStr = JSON.stringify(tc.expected_output);
          const actualStr = JSON.stringify(actualOutput);
          const isPassed = expectedStr === actualStr;

          return {
            id: tc.id || index + 1,
            description: tc.description || `Test Case #${index + 1}`,
            inputArgs: tc.input_args,
            expectedOutput: tc.expected_output,
            actualOutput,
            isPassed,
            durationMs: (tcEnd - tcStart).toFixed(2),
            error: null
          };
        } catch (tcErr) {
          return {
            id: tc.id || index + 1,
            description: tc.description || `Test Case #${index + 1}`,
            inputArgs: tc.input_args,
            expectedOutput: tc.expected_output,
            actualOutput: null,
            isPassed: false,
            durationMs: 0,
            error: tcErr.message
          };
        }
      });

      setTestResults(results);
      setConsoleLogs(capturedLogs);
      const allPass = results.length > 0 && results.every(r => r.isPassed);
      setAllTestsPassed(allPass);

      if (allPass) {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } catch {}
      }
    } catch (err) {
      setExecutionError(err.message);
      setConsoleLogs(capturedLogs);
      setAllTestsPassed(false);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleSubmitReview = async () => {
    setIsReviewing(true);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/livecode/review-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          challengeTitle: challenge?.title,
          problemStatement: challenge?.problem_statement,
          candidateCode: code,
          language: 'javascript',
          testResults
        })
      });

      const data = await res.json();
      if (data.success && data.review) {
        setAiReview(data.review);
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
        } catch {}
      }
    } catch (err) {
      console.error('Failed to review code:', err);
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(12px)',
      zIndex: 130,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '1080px',
        maxHeight: '94vh',
        overflowY: 'auto',
        background: '#0B0F19',
        border: '1px solid rgba(14, 165, 233, 0.4)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-cyan">Simulasi Live Code Loker Ini</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{companyName} • {position}</span>
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0 0 0', color: '#F8FAFC' }}>
                {challenge?.title || 'Tes Teknis & Koding Interview'}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              {['Junior', 'Mid', 'Senior'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => {
                    setDifficulty(lvl);
                    handleLoadChallenge(lvl);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: difficulty === lvl ? '#0EA5E9' : 'transparent',
                    color: difficulty === lvl ? '#fff' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}>✕</button>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#0EA5E9', margin: '0 auto 10px auto' }} />
            <p style={{ margin: 0 }}>Merancang Soal Tes Teknis Khusus untuk {position} di {companyName}...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '16px' }}>
            
            {/* Left: Problem Statement & Test Specs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', maxHeight: '550px', overflowY: 'auto' }}>
              <div>
                <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>{challenge?.topic || 'Algoritma & Data'}</span>
                <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#CBD5E1', marginTop: '8px', whiteSpace: 'pre-line' }}>
                  {stripMarkdownForPlainText(challenge?.problem_statement)}
                </div>
              </div>

              {challenge?.examples?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Contoh Kasus:</div>
                  {challenge.examples.map((ex, i) => (
                    <div key={i} style={{ background: '#070A12', padding: '8px 10px', borderRadius: '6px', fontSize: '0.76rem', fontFamily: 'monospace', marginBottom: '6px' }}>
                      <div><b style={{ color: '#38BDF8' }}>In:</b> {ex.input}</div>
                      <div><b style={{ color: '#34D399' }}>Out:</b> {ex.output}</div>
                    </div>
                  ))}
                </div>
              )}

              {challenge?.hint && (
                <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  <button
                    onClick={() => setShowHint(!showHint)}
                    style={{ background: 'none', border: 'none', color: '#FBBF24', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                  >
                    <Lightbulb size={13} />
                    <span>{showHint ? 'Tutup Hint' : 'Buka Hint'}</span>
                  </button>
                  {showHint && (
                    <div style={{ fontSize: '0.76rem', color: '#FDE68A', background: 'rgba(245,158,11,0.08)', padding: '8px', borderRadius: '6px', marginTop: '4px' }}>
                      💡 {stripMarkdownForPlainText(challenge.hint)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Code Editor & Runner */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#040711', border: '1px solid rgba(14, 165, 233, 0.3)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38BDF8', fontFamily: 'monospace' }}>solution.js</span>
                  <button
                    onClick={() => { if (challenge) setCode(challenge.starter_code); }}
                    className="btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '0.7rem', height: '24px' }}
                  >
                    Reset
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={9}
                  spellCheck={false}
                  style={{
                    width: '100%',
                    background: '#020408',
                    color: '#E2E8F0',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    lineHeight: '1.5',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={handleRunCodeTests}
                    disabled={isRunningTests}
                    className="btn-primary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #0284C7, #0369A1)' }}
                  >
                    {isRunningTests ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={13} fill="#fff" />}
                    <span>Run Tests</span>
                  </button>

                  <button
                    onClick={handleSubmitReview}
                    disabled={isReviewing}
                    className="btn-primary"
                    style={{ flex: 1.2, padding: '8px 12px', fontSize: '0.8rem', background: allTestsPassed ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                  >
                    {isReviewing ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
                    <span>Submit Review AI</span>
                  </button>
                </div>
              </div>

              {/* Mini Console Output */}
              <div style={{ background: '#020408', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.76rem', fontFamily: 'monospace', maxHeight: '180px', overflowY: 'auto' }}>
                <div style={{ color: '#64748B', fontWeight: 700, marginBottom: '4px' }}>Konsol Output:</div>
                {executionError && <div style={{ color: '#F87171' }}>❌ {executionError}</div>}
                {testResults.map(tr => (
                  <div key={tr.id} style={{ color: tr.isPassed ? '#34D399' : '#F87171', marginBottom: '2px' }}>
                    {tr.isPassed ? '✓ PASS' : '✗ FAIL'} Test #{tr.id} ({tr.durationMs}ms)
                  </div>
                ))}
                {testResults.length === 0 && !executionError && (
                  <div style={{ color: '#475569' }}>Tekan "Run Tests" untuk melihat hasil pengujian.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Review Details (Rendered inline if reviewed) */}
        {aiReview && (
          <div style={{ background: 'rgba(14, 165, 233, 0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(14, 165, 233, 0.3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38BDF8' }}>📊 Evaluasi Principal Engineer:</span>
              <span className="badge badge-emerald">Skor: {aiReview.overall_score} / 100 • {aiReview.time_complexity}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: '1.5' }}>
              {aiReview.senior_feedback}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
