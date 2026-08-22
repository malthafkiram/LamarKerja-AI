import React, { useState, useEffect, useRef } from 'react';
import { 
  Code2, Play, Sparkles, CheckCircle2, XCircle, Clock, AlertTriangle, 
  RefreshCw, Award, Copy, Check, Terminal, BookOpen, Layers, Lightbulb, 
  Flame, ChevronRight, Zap, ShieldAlert, FileText, Send, Share2, Maximize2, 
  ExternalLink, Shuffle, ListFilter, Star, Grid, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../context/LanguageContext';
import { stripMarkdownForPlainText } from '../utils/plainText.js';

export default function LiveCodeArena({ profile, initialJobDetails }) {
  const { t, lang } = useLanguage();

  const TOPIC_CATEGORIES = [
    { id: 'all', label: t('lc_topic_all', '🎲 Acak (Semua Kategori)'), value: 'Acak (Semua Kategori)' },
    { id: 'asterisk', label: t('lc_topic_asterisk', '⭐ Pola Bintang & Asterisk'), value: 'Pola Bintang & Asterisk Pyramid Matrix' },
    { id: 'fuzzy', label: t('lc_topic_fuzzy', '🔍 Fuzzy Logic & Typo Distance'), value: 'Fuzzy String Logic & Similarity Distance' },
    { id: 'data_transform', label: t('lc_topic_data_transform', '📦 Data Transformer & Grouping'), value: 'Array & Nested Object Data Transformer' },
    { id: 'data_structures', label: t('lc_topic_data_structures', '🧱 Struktur Data (LRU, Stack, Map)'), value: 'Struktur Data (LRU Cache, Stack, Map)' },
    { id: 'sliding_window', label: t('lc_topic_sliding_window', '🪟 Sliding Window & Pointers'), value: 'Sliding Window & Two Pointers' },
    { id: 'async_promises', label: t('lc_topic_async_promises', '⚡ Async, Promises & Throttle'), value: 'Async / Promises & Event Loop' }
  ];

  // Challenge State
  const [challenge, setChallenge] = useState(null);
  const [difficulty, setDifficulty] = useState('Mid');
  const [techStack, setTechStack] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('Acak (Semua Kategori)');
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  
  // Master Preset Catalog
  const [presetCatalog, setPresetCatalog] = useState([]);
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  // Custom Job input for tailored challenge
  const [customPosition, setCustomPosition] = useState(initialJobDetails?.position || initialJobDetails?.title || '');
  const [customCompany, setCustomCompany] = useState(initialJobDetails?.company_name || initialJobDetails?.company || '');
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Editor State
  const [code, setCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const textareaRef = useRef(null);

  // Live Runner & Console State
  const [testResults, setTestResults] = useState([]);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [executionError, setExecutionError] = useState(null);
  const [allTestsPassed, setAllTestsPassed] = useState(false);

  // Interview Pressure Timer State
  const [timerSeconds, setTimerSeconds] = useState(30 * 60); // 30 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // AI Review Modal State
  const [isReviewing, setIsReviewing] = useState(false);
  const [aiReview, setAiReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Initial Load
  useEffect(() => {
    fetchPresetCatalog();
    handleLoadChallenge(difficulty, selectedTopic, customPosition, customCompany);
  }, []);

  const fetchPresetCatalog = async () => {
    try {
      const res = await fetch('/api/livecode/preset-challenges');
      const data = await res.json();
      if (data.success && data.challenges) {
        setPresetCatalog(data.challenges);
      }
    } catch {}
  };

  // Timer countdown interval
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLoadChallenge = async (diff = difficulty, top = selectedTopic, pos = customPosition, comp = customCompany) => {
    setIsLoadingChallenge(true);
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
          position: pos || 'Fullstack Web Developer',
          companyName: comp || 'Perusahaan Teknologi',
          techStack,
          difficulty: diff,
          topic: top
        })
      });

      const data = await res.json();
      if (data.success && data.challenge) {
        setChallenge(data.challenge);
        setCode(data.challenge.starter_code || '// Tuliskan fungsi Anda di sini\nfunction solution() {\n  \n}');
        setTimerSeconds((data.challenge.estimated_time_minutes || 30) * 60);
        setIsTimerRunning(false);
      }
    } catch (err) {
      console.error('Failed to load challenge:', err);
    } finally {
      setIsLoadingChallenge(false);
    }
  };

  const handleSelectPreset = (item) => {
    setChallenge(item);
    setCode(item.starter_code || '// Tuliskan fungsi Anda di sini\nfunction solution() {\n  \n}');
    setDifficulty(item.difficulty);
    setTimerSeconds((item.estimated_time_minutes || 30) * 60);
    setIsTimerRunning(false);
    setTestResults([]);
    setConsoleLogs([]);
    setExecutionError(null);
    setAiReview(null);
    setAllTestsPassed(false);
    setShowCatalogModal(false);
  };

  const handleShuffleRandom = () => {
    if (presetCatalog.length > 0) {
      const randomItem = presetCatalog[Math.floor(Math.random() * presetCatalog.length)];
      handleSelectPreset(randomItem);
    } else {
      handleLoadChallenge(difficulty, 'Acak (Semua Kategori)');
    }
  };

  // Handle Tab key indentation in Code Editor Textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = e.target.value;
      setCode(val.substring(0, start) + '  ' + val.substring(end));
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleResetCode = () => {
    if (challenge?.starter_code) {
      setCode(challenge.starter_code);
    }
  };

  // Live Unit Test Runner
  const handleRunTests = () => {
    setIsRunningTests(true);
    setExecutionError(null);
    setTestResults([]);
    const capturedLogs = [];

    const customConsole = {
      log: (...args) => {
        capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      },
      error: (...args) => {
        capturedLogs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      },
      warn: (...args) => {
        capturedLogs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      }
    };

    try {
      const testsToRun = challenge?.test_cases || [];
      if (testsToRun.length === 0) {
        throw new Error('Tidak ada test cases yang terdefinisi untuk soal ini.');
      }

      const results = [];
      let allPass = true;

      const evalFn = new Function('console', `
        ${code}
        return {
          runSingleTest: function(args) {
            let fn = null;
            if (typeof renderDiamond === 'function') fn = renderDiamond;
            else if (typeof calculateTypoDistance === 'function') fn = calculateTypoDistance;
            else if (typeof fuzzyMatchJobTitle === 'function') fn = fuzzyMatchJobTitle;
            else if (typeof twoSumIndices === 'function') fn = twoSumIndices;
            else if (typeof maxSubarraySum === 'function') fn = maxSubarraySum;
            else if (typeof lengthOfLongestUniqueSubstring === 'function') fn = lengthOfLongestUniqueSubstring;
            else if (typeof groupApplicantBySkill === 'function') fn = groupApplicantBySkill;
            else if (typeof groupApplicantsByRole === 'function') fn = groupApplicantsByRole;
            else if (typeof flattenObjectTree === 'function') fn = flattenObjectTree;
            else if (typeof LRUCache === 'function') fn = LRUCache;
            else if (typeof MinStack === 'function') fn = MinStack;
            else if (typeof promiseAllWithTimeout === 'function') fn = promiseAllWithTimeout;
            else if (typeof renderPyramidPattern === 'function') fn = renderPyramidPattern;
            else if (typeof renderHourglassPattern === 'function') fn = renderHourglassPattern;
            else if (typeof renderRightTrianglePattern === 'function') fn = renderRightTrianglePattern;
            else if (typeof renderPollowSquare === 'function') fn = renderPollowSquare;
            else if (typeof renderHollowSquare === 'function') fn = renderHollowSquare;
            else if (typeof solution === 'function') fn = solution;
            else {
              const declared = Object.keys(this).filter(k => typeof this[k] === 'function' && k !== 'runSingleTest');
              if (declared.length > 0) fn = this[declared[0]];
            }
            if (!fn) {
              const fns = [${code.match(/function\s+([a-zA-Z0-9_]+)/g)?.map(f => f.replace('function ', '')).join(', ') || ''}].filter(Boolean);
              if (fns.length > 0) fn = fns[0];
            }
            if (!fn) throw new Error('Fungsi solusi tidak ditemukan. Pastikan Anda mendefinisikan fungsi!');
            return Array.isArray(args) ? fn(...args) : fn(args);
          }
        };
      `);

      const runnerInstance = evalFn(customConsole);

      for (let i = 0; i < testsToRun.length; i++) {
        const tc = testsToRun[i];
        const startTime = performance.now();
        let actualOutput = null;
        let isPassed = false;
        let testError = null;

        try {
          actualOutput = runnerInstance.runSingleTest(tc.input);
          
          let actualStr = JSON.stringify(actualOutput);
          let expectedStr = JSON.stringify(tc.expected);

          if (actualStr === expectedStr) {
            isPassed = true;
          } else if (typeof actualOutput === 'string' && typeof tc.expected === 'string') {
            if (actualOutput.trim() === tc.expected.trim()) isPassed = true;
          } else if (Array.isArray(actualOutput) && Array.isArray(tc.expected)) {
            if (JSON.stringify([...actualOutput].sort()) === JSON.stringify([...tc.expected].sort())) isPassed = true;
          } else if (typeof actualOutput === 'number' && typeof tc.expected === 'number') {
            if (Math.abs(actualOutput - tc.expected) < 0.0001) isPassed = true;
          }
        } catch (err) {
          testError = err.message;
          isPassed = false;
        }

        const endTime = performance.now();
        if (!isPassed) allPass = false;

        results.push({
          caseNumber: i + 1,
          input: tc.input,
          expected: tc.expected,
          actual: actualOutput,
          passed: isPassed,
          error: testError,
          executionTimeMs: Math.round((endTime - startTime) * 100) / 100
        });
      }

      setTestResults(results);
      setConsoleLogs(capturedLogs);
      setAllTestsPassed(allPass);

      if (allPass) {
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
        } catch {}
      }
    } catch (err) {
      console.error('Execution runtime error:', err);
      setExecutionError(err.message);
      setConsoleLogs(capturedLogs);
      setAllTestsPassed(false);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Request AI Senior Principal Review
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
        setShowReviewModal(true);
        try {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        } catch {}
      }
    } catch (err) {
      console.error('Failed to review code:', err);
    } finally {
      setIsReviewing(false);
    }
  };

  const getDifficultyColor = (diff) => {
    if (diff === 'Junior') return '#10B981';
    if (diff === 'Mid' || diff === 'Mid-Level') return '#0EA5E9';
    return '#F59E0B';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* SECTION 1: Clean Top Header Hero */}
      <div className="glass-panel page-hero" style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Code2 size={13} /> Live Technical Code Arena
            </span>
            <span className="badge badge-emerald">20+ Bank Soal Realistis 100% Interview IT</span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '4px 0 4px 0', letterSpacing: '-0.02em', color: '#F8FAFC' }}>
            {t('lc_title', 'Simulasi Live Coding & Tes Teknis Interview')}
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
            {t('lc_desc', 'Latihan soal koding autentik dengan eksekusi real-time di browser & review AI.')}
          </p>
        </div>

        {/* Quick Action Toolbar & Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Pressure Timer Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.85)',
            padding: '6px 12px',
            borderRadius: '10px',
            border: timerSeconds < 300 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-glass)',
            color: timerSeconds < 300 ? '#EF4444' : '#38BDF8'
          }}>
            <Clock size={15} />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.92rem' }}>
              {formatTimer(timerSeconds)}
            </span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              style={{
                background: isTimerRunning ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                border: 'none',
                color: isTimerRunning ? '#EF4444' : '#10B981',
                padding: '2px 7px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isTimerRunning ? t('lc_timer_pause', 'Jeda') : t('lc_timer_start', 'Mulai')}
            </button>
          </div>

          {/* Shuffle Button */}
          <button
            onClick={handleShuffleRandom}
            className="btn-primary"
            style={{
              padding: '7px 14px',
              fontSize: '0.82rem',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
            }}
            title="Ganti soal acak dari bank soal"
          >
            <Shuffle size={14} />
            <span>{t('lc_btn_shuffle', '🎲 Acak Soal')}</span>
          </button>

          {/* Popular Bank Button */}
          <button
            onClick={() => setShowCatalogModal(true)}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '7px 12px', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38BDF8' }}
          >
            <BookOpen size={14} />
            <span>{t('lc_btn_catalog', '📚 Bank Soal')} ({presetCatalog.length || '20+'})</span>
          </button>

          {/* Custom Tailored Challenge Button */}
          <button
            onClick={() => setShowCustomModal(true)}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '7px 12px' }}
          >
            <Sparkles size={14} color="#FBBF24" />
            <span>{t('lc_btn_custom_job', '🎯 Khusus Loker')}</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: Clean Segregated Controls (Difficulty & Topic Categories) */}
      <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Tier A: Difficulty Level Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star size={15} color="#FBBF24" />
              <span>{t('lc_difficulty', 'Tingkat Kesulitan:')}</span>
            </span>
            <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
              {[
                { key: 'Junior', label: `🐣 ${t('lc_junior', 'Junior')}`, color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)' },
                { key: 'Mid', label: `⚡ ${t('lc_mid', 'Mid-Level')}`, color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.2)' },
                { key: 'Senior', label: `🏆 ${t('lc_senior', 'Senior')}`, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)' }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => {
                    setDifficulty(item.key);
                    handleLoadChallenge(item.key, selectedTopic);
                  }}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '8px',
                    border: difficulty === item.key ? `1px solid ${item.color}` : 'none',
                    background: difficulty === item.key ? item.bg : 'transparent',
                    color: difficulty === item.key ? item.color : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: difficulty === item.key ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Bahasa Pemrograman:</span>
            <span className="badge badge-cyan" style={{ fontFamily: 'var(--font-mono)' }}>JavaScript (ES6+)</span>
          </div>
        </div>

        {/* Tier B: Topic Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            <ListFilter size={13} />
            <span>{t('lc_topic_label', 'Kategori Topik:')}</span>
          </div>

          {TOPIC_CATEGORIES.map(tc => (
            <button
              key={tc.id}
              onClick={() => {
                setSelectedTopic(tc.value);
                handleLoadChallenge(difficulty, tc.value);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: '16px',
                border: selectedTopic === tc.value ? '1px solid #0EA5E9' : '1px solid var(--border-glass)',
                background: selectedTopic === tc.value ? 'rgba(14, 165, 233, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: selectedTopic === tc.value ? '#38BDF8' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {tc.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3: Main Split-View Coding Arena (Problem Left vs Code Editor Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
        gap: '16px',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: Problem Specification */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isLoadingChallenge ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <RefreshCw className="animate-spin" size={32} color="#0EA5E9" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Memuat Soal Tantangan...</p>
            </div>
          ) : challenge ? (
            <>
              {/* Challenge Title & Badges */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: `${getDifficultyColor(challenge.difficulty)}22`,
                    color: getDifficultyColor(challenge.difficulty),
                    border: `1px solid ${getDifficultyColor(challenge.difficulty)}55`
                  }}>
                    {challenge.difficulty}
                  </span>
                  <span className="badge badge-indigo">{challenge.category || 'Algorithm'}</span>
                  <span className="badge badge-amber">⏱️ ~{challenge.estimated_time_minutes || 30} menit</span>
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 6px 0' }}>
                  {challenge.title}
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 600 }}>
                  🏢 Target: {challenge.company || 'Perusahaan IT'} • {challenge.position || 'Software Engineer'}
                </div>
              </div>

              {/* Problem Statement */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border-glass)',
                fontSize: '0.88rem',
                lineHeight: '1.6',
                color: '#E2E8F0'
              }}>
                <div style={{ fontWeight: 700, color: '#38BDF8', marginBottom: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} />
                  <span>{t('lc_problem_desc_header', 'Deskripsi Tantangan')}</span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{stripMarkdownForPlainText(challenge.problem_statement)}</div>
              </div>

              {/* Constraints */}
              {challenge.constraints && challenge.constraints.length > 0 && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.05)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  fontSize: '0.82rem',
                  color: '#CBD5E1'
                }}>
                  <div style={{ fontWeight: 700, color: '#FBBF24', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={14} />
                    <span>{t('lc_constraints_header', 'Batasan & Aturan (Constraints):')}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {challenge.constraints.map((c, i) => (
                      <li key={i}>{stripMarkdownForPlainText(c)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Examples */}
              {challenge.examples && challenge.examples.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} />
                    <span>{t('lc_examples_header', 'Contoh Kasus (Examples)')}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {challenge.examples.map((ex, i) => (
                      <div key={i} style={{
                        background: '#070A12',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '10px',
                        padding: '12px',
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        <div style={{ color: '#94A3B8', marginBottom: '3px' }}>
                          <span style={{ color: '#38BDF8', fontWeight: 700 }}>Input:</span> {JSON.stringify(ex.input)}
                        </div>
                        <div style={{ color: '#34D399', marginBottom: ex.explanation ? '4px' : '0' }}>
                          <span style={{ fontWeight: 700 }}>Output:</span> {JSON.stringify(ex.output)}
                        </div>
                        {ex.explanation && (
                          <div style={{ color: '#64748B', fontSize: '0.74rem', fontFamily: 'var(--font-main)', fontStyle: 'italic', marginTop: '4px' }}>
                            Penjelasan: {stripMarkdownForPlainText(ex.explanation)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Hint Accordion */}
              {challenge.hints && challenge.hints.length > 0 && (
                <div style={{ marginTop: 'auto' }}>
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="btn-secondary"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      borderColor: 'rgba(251, 191, 36, 0.3)',
                      color: '#FBBF24',
                      justifyContent: 'center'
                    }}
                  >
                    <Lightbulb size={14} />
                    <span>{showHint ? t('lc_hint_hide', 'Sembunyikan Petunjuk') : t('lc_hint_show', 'Lihat Petunjuk Koding (Hint)')}</span>
                  </button>
                  {showHint && (
                    <div style={{
                      marginTop: '8px',
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: '10px',
                      padding: '12px',
                      fontSize: '0.82rem',
                      color: '#FDE68A',
                      lineHeight: '1.5'
                    }}>
                      {challenge.hints.map((h, i) => (
                        <div key={i} style={{ marginBottom: i < challenge.hints.length - 1 ? '6px' : 0 }}>
                          💡 <strong>Tip #{i + 1}:</strong> {stripMarkdownForPlainText(h)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              Silakan pilih salah satu soal di atas untuk mulai koding.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Code Editor & Test Runner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Editor Container */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Editor Toolbar Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code2 size={16} color="#38BDF8" />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#F8FAFC', fontFamily: 'var(--font-mono)' }}>
                  solution.js
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleResetCode}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                  title="Kembalikan kode ke awal"
                >
                  <RefreshCw size={12} />
                  <span>{t('lc_reset_code', 'Reset')}</span>
                </button>
                <button
                  onClick={handleCopyCode}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                >
                  {isCopied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                  <span>{isCopied ? t('lc_copied', 'Tersalin!') : t('lc_copy_code', 'Salin')}</span>
                </button>
              </div>
            </div>

            {/* Codearea Input */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              style={{
                width: '100%',
                minHeight: '260px',
                background: '#040711',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '0.88rem',
                fontFamily: 'var(--font-mono)',
                lineHeight: '1.6',
                outline: 'none',
                resize: 'vertical'
              }}
            />

            {/* Action Buttons: Run Tests & AI Review */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleRunTests}
                disabled={isRunningTests || !code.trim()}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '11px 18px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                {isRunningTests ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>{t('lc_btn_running', 'Mengeksekusi...')}</span>
                  </>
                ) : (
                  <>
                    <Play size={16} fill="#fff" />
                    <span>{t('lc_btn_run_tests', '▶️ Jalankan Kode (Run Tests)')}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSubmitReview}
                disabled={isReviewing || !code.trim()}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '11px 18px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                }}
              >
                {isReviewing ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>{t('lc_btn_reviewing', 'AI Sedang Menganalisis...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{t('lc_btn_ai_review', '🤖 Submit & Review AI')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Execution Console & Test Runner Panel */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={16} color="#38BDF8" />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#F8FAFC' }}>
                  {t('lc_terminal_title', 'Konsol Eksekusi & Unit Test Runner')}
                </span>
              </div>
              {testResults.length > 0 && (
                <span style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: allTestsPassed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: allTestsPassed ? '#34D399' : '#F87171'
                }}>
                  {testResults.filter(t => t.passed).length} / {testResults.length} {t('lc_test_cases_passed', 'Lolos')}
                </span>
              )}
            </div>

            {/* Error banner if execution failed */}
            {executionError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '12px',
                borderRadius: '8px',
                color: '#F87171',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)'
              }}>
                <strong>Runtime Error:</strong> {executionError}
              </div>
            )}

            {/* Test Cases Results List */}
            {testResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {testResults.map((tr) => (
                  <div key={tr.caseNumber} style={{
                    background: tr.passed ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                    border: tr.passed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.78rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: tr.passed ? '#34D399' : '#F87171' }}>
                        {tr.passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        <span>Case #{tr.caseNumber}: {tr.passed ? 'PASSED' : 'FAILED'}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{tr.executionTimeMs}ms</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '2px', color: '#94A3B8' }}>
                      <div>Input: {JSON.stringify(tr.input)}</div>
                      <div>Expected: <span style={{ color: '#34D399' }}>{JSON.stringify(tr.expected)}</span></div>
                      <div>Actual: <span style={{ color: tr.passed ? '#34D399' : '#F87171' }}>{JSON.stringify(tr.actual)}</span></div>
                      {tr.error && <div style={{ color: '#EF4444' }}>Error: {tr.error}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', padding: '16px 0', textAlign: 'center' }}>
                {t('lc_empty_console', 'Klik tombol "▶️ Jalankan Kode" untuk menguji fungsi Anda terhadap unit test cases.')}
              </div>
            )}

            {/* Console Log Output */}
            {consoleLogs.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Standard Output (console.log):
                </div>
                <pre style={{
                  background: '#040711',
                  color: '#CBD5E1',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontFamily: 'var(--font-mono)',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  margin: 0
                }}>
                  {consoleLogs.join('\n')}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Master Challenge Preset Catalog */}
      {showCatalogModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '780px',
            maxHeight: '85vh',
            overflowY: 'auto',
            background: 'rgba(15, 23, 42, 0.98)',
            padding: '24px',
            borderRadius: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={20} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                    {t('lc_catalog_modal_title', 'Bank Soal Live Code Terpopuler')}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#38BDF8', margin: '2px 0 0 0' }}>
                    {presetCatalog.length} Soal Standar Wawancara IT Indonesia & Global
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCatalogModal(false)} className="btn-secondary" style={{ padding: '6px 10px' }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {t('lc_catalog_modal_desc', 'Kumpulan soal teknis standar industri yang paling sering diujikan di perusahaan teknologi. Pilih soal untuk langsung mulai koding!')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '10px' }}>
              {presetCatalog.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPreset(item)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--border-glass)',
                    padding: '14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0EA5E9'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '5px',
                      background: `${getDifficultyColor(item.difficulty)}22`,
                      color: getDifficultyColor(item.difficulty)
                    }}>
                      {item.difficulty}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>⏱️ {item.estimated_time_minutes}m</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F8FAFC' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#94A3B8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {stripMarkdownForPlainText(item.problem_statement)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AI SENIOR PRINCIPAL REVIEW REPORT */}
      {showReviewModal && aiReview && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 7, 18, 0.88)',
          backdropFilter: 'blur(12px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'rgba(15, 23, 42, 0.98)',
            padding: '28px',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #10B981, #0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={24} color="#fff" />
                </div>
                <div>
                  <span className="badge badge-cyan">AI Technical Evaluation Report</span>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', color: '#F8FAFC' }}>
                    {t('review_modal_title', 'Hasil Review Kode Sekelas Principal Engineer')}
                  </h2>
                </div>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="btn-secondary" style={{ padding: '6px 10px' }}>
                <X size={16} />
              </button>
            </div>

            {/* Score Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))', gap: '10px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('review_score_overall', 'Skor Keseluruhan')}</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: aiReview.overall_score >= 85 ? '#34D399' : '#FBBF24' }}>
                  {aiReview.overall_score}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>/ 100</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('review_score_logic', 'Logika & Algoritma')}</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#38BDF8' }}>
                  {aiReview.logic_score}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Logic Correctness</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('review_score_clean', 'Clean Code')}</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#C084FC' }}>
                  {aiReview.clean_code_score}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Standards</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('review_score_time', 'Time Complexity')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>
                  {aiReview.time_complexity || 'O(N)'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Space: {aiReview.space_complexity || 'O(1)'}</div>
              </div>
            </div>

            {/* Senior Mentorship Feedback */}
            <div style={{ background: 'rgba(14, 165, 233, 0.06)', padding: '16px 18px', borderRadius: '12px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38BDF8', marginBottom: '6px' }}>
                {t('review_feedback_title', '💡 Ulasan Konstruktif Senior Engineer:')}
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: '1.6', color: '#CBD5E1' }}>
                {aiReview.senior_feedback}
              </p>
            </div>

            {/* Strengths & Edge Cases */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '12px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.06)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34D399', marginBottom: '6px' }}>
                  {t('review_strengths_title', '✓ Kelebihan Kode Anda:')}
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: '#94A3B8', lineHeight: '1.5' }}>
                  {(aiReview.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              <div style={{ background: 'rgba(245, 158, 11, 0.06)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FBBF24', marginBottom: '6px' }}>
                  {t('review_bugs_title', '⚠️ Edge Cases & Catatan:')}
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: '#94A3B8', lineHeight: '1.5' }}>
                  {(aiReview.bugs_and_edge_cases || []).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            </div>

            {/* Golden Solution Code */}
            {aiReview.golden_solution_code && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                  {t('review_golden_title', '🌟 Contoh Solusi Emas Standar Industri (Golden Code):')}
                </div>
                <pre style={{
                  background: '#040711',
                  color: '#A7F3D0',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  overflowX: 'auto',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {aiReview.golden_solution_code}
                </pre>
              </div>
            )}

            <button
              onClick={() => setShowReviewModal(false)}
              className="btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              {t('review_close_btn', 'Tutup & Lanjutkan Latihan')}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: Custom Job Tailored Challenge */}
      {showCustomModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 7, 18, 0.88)',
          backdropFilter: 'blur(12px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', background: 'rgba(15, 23, 42, 0.98)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                {t('lc_custom_modal_title', '🎯 Buat Soal Sesuai Loker Impian')}
              </h3>
              <button onClick={() => setShowCustomModal(false)} className="btn-secondary" style={{ padding: '6px 10px' }}>✕</button>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                {t('lc_custom_pos_label', 'Posisi Loker:')}
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Frontend React Engineer / Backend Node.js"
                value={customPosition}
                onChange={(e) => setCustomPosition(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                {t('lc_custom_comp_label', 'Perusahaan Target:')}
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: GoTo / Shopee / Startup"
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                {t('lc_custom_tech_label', 'Tech Stack Fokus:')}
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: JavaScript, React Hooks, REST API, Async"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
              />
            </div>

            <button
              onClick={() => {
                setShowCustomModal(false);
                handleLoadChallenge(difficulty, selectedTopic, customPosition, customCompany);
              }}
              className="btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              <Sparkles size={16} />
              <span>{t('lc_custom_btn_generate', 'Generate Soal Live Coding Khusus')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
