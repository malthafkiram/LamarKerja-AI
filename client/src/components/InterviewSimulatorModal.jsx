import React, { useState, useEffect } from 'react';
import { 
  Mic, MicOff, Send, MessageSquare, Award, CheckCircle2, 
  HelpCircle, AlertCircle, RefreshCw, X, Sparkles, User, Briefcase, ChevronRight, Star
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function InterviewSimulatorModal({ isOpen, onClose, jobDetails }) {
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [interviewData, setInterviewData] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!isOpen || !jobDetails) return;
    startInterview();
  }, [isOpen, jobDetails]);

  const startInterview = async () => {
    setIsLoadingQuestions(true);
    setError(null);
    setEvaluation(null);
    setCandidateAnswer('');
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          position: jobDetails?.position || '',
          company: jobDetails?.company_name || '',
          requirements: jobDetails?.requirements || []
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal memulai simulasi wawancara');
      }

      setInterviewData(data.interviewData);
      setCurrentQIndex(0);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!candidateAnswer || candidateAnswer.trim().length < 8) {
      setError('Harap berikan jawaban minimal 1-2 kalimat.');
      return;
    }

    setIsEvaluating(true);
    setError(null);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const activeQ = interviewData.questions[currentQIndex];
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          question: activeQ.question,
          answer: candidateAnswer,
          position: interviewData.position,
          company: interviewData.company
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mengevaluasi jawaban');
      }

      setEvaluation(data.evaluation);
      if (data.evaluation.score >= 80) {
        try {
          confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
        } catch {}
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < (interviewData?.questions?.length || 0) - 1) {
      setCurrentQIndex(prev => prev + 1);
      setCandidateAnswer('');
      setEvaluation(null);
      setError(null);
    }
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Browser Anda belum mendukung input suara. Silakan ketik jawaban Anda.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isListening) {
      setIsListening(true);
      recognition.start();
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setCandidateAnswer(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      setIsListening(false);
    }
  };

  const activeQuestion = interviewData?.questions?.[currentQIndex];

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.88)',
      backdropFilter: 'blur(12px)',
      zIndex: 115,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '850px',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#0B0F19',
        border: '1px solid var(--border-glass)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(14, 165, 233, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageSquare size={22} color="#0EA5E9" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>AI Mock Interview Simulator</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Simulasi wawancara kerja posisi <b>{jobDetails?.position || 'Posisi'}</b> di <b>{jobDetails?.company_name || 'Perusahaan'}</b>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.3rem' }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#FDA4AF', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {isLoadingQuestions ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px', gap: '12px', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#38BDF8' }} />
            <span>Menyiapkan ruang wawancara dan pertanyaan spesifik dari AI Recruiter...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Question Progress & Recruiter Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.7)',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid var(--border-glass)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38BDF8' }}>
                  {interviewData?.interviewer_name || 'Ibu Kartika (Lead Recruiter)'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(interviewData?.questions || []).map((q, idx) => (
                  <span key={idx} style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: idx === currentQIndex ? '#0284C7' : (idx < currentQIndex ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)'),
                    color: idx === currentQIndex ? '#fff' : (idx < currentQIndex ? '#34D399' : 'var(--text-muted)')
                  }}>
                    {idx + 1}
                  </span>
                ))}
              </div>
            </div>

            {/* Active Question Box */}
            {activeQuestion && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(15, 23, 42, 0.8))',
                border: '1px solid rgba(2, 132, 199, 0.3)',
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                    Kategori: {activeQuestion.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Pertanyaan {currentQIndex + 1} dari {interviewData.questions.length}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', lineHeight: '1.5', margin: 0 }}>
                  "{activeQuestion.question}"
                </h3>
                {activeQuestion.tips && (
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Sparkles size={14} color="#F59E0B" />
                    <span><b>Tips Jawaban:</b> {activeQuestion.tips}</span>
                  </div>
                )}
              </div>
            )}

            {/* Candidate Answer Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Jawaban Anda:
                </label>
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className="btn-secondary"
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    background: isListening ? 'rgba(244, 63, 94, 0.2)' : undefined,
                    color: isListening ? '#FDA4AF' : undefined
                  }}
                >
                  {isListening ? <MicOff size={13} color="#F43F5E" /> : <Mic size={13} />}
                  <span>{isListening ? 'Mendengarkan Suara...' : 'Gunakan Suara (Mic)'}</span>
                </button>
              </div>

              <textarea
                className="input-field"
                rows={5}
                value={candidateAnswer}
                onChange={(e) => setCandidateAnswer(e.target.value)}
                placeholder="Ketik atau bicarakan jawaban Anda di sini (Jelaskan dengan terstruktur)..."
                style={{ lineHeight: '1.6' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={handleEvaluateAnswer}
                  disabled={isEvaluating || !candidateAnswer}
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.88rem' }}
                >
                  <Award size={16} />
                  <span>{isEvaluating ? 'Menilai Jawaban...' : '⚡ Nilai Jawaban dengan AI'}</span>
                </button>
              </div>
            </div>

            {/* AI Evaluation Scorecard */}
            {evaluation && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: evaluation.score >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      color: evaluation.score >= 80 ? '#34D399' : '#FDE68A'
                    }}>
                      {evaluation.score}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Skor Evaluasi Jawaban</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{evaluation.overall_feedback}</div>
                    </div>
                  </div>

                  {currentQIndex < (interviewData?.questions?.length || 0) - 1 ? (
                    <button
                      onClick={handleNextQuestion}
                      className="btn-primary"
                      style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                    >
                      <span>Pertanyaan Selanjutnya</span>
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                      ✓ Wawancara Selesai
                    </span>
                  )}
                </div>

                <div className="stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontWeight: 700, color: '#34D399', marginBottom: '6px' }}>✓ Kekuatan Jawaban:</div>
                    <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--text-muted)' }}>
                      {(evaluation.strengths || []).map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ fontWeight: 700, color: '#FDE68A', marginBottom: '6px' }}>💡 Poin Peningkatan:</div>
                    <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--text-muted)' }}>
                      {(evaluation.improvements || []).map((imp, idx) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {evaluation.model_answer && (
                  <div style={{ background: 'rgba(14, 165, 233, 0.08)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(14, 165, 233, 0.2)', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 700, color: '#38BDF8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Star size={14} /> Contoh Jawaban Ideal (Model Answer):
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      "{evaluation.model_answer}"
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
