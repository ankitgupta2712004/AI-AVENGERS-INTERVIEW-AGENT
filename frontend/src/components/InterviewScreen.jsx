import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Loader2, Bot, User } from 'lucide-react';

export default function InterviewScreen({ 
  candidate, 
  messages, 
  onSendMessage, 
  onResetSession, 
  loading, 
  error,
  questionNumber
}) {
  const [answer, setAnswer] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer.trim() || loading) return;
    onSendMessage(answer.trim());
    setAnswer('');
  };

  const member = candidate?.member || candidate;

  return (
    <div className="interview-container">
      {/* Header */}
      <div className="interview-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={onResetSession}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.9rem'
            }}
          >
            <ArrowLeft size={18} /> Change Candidate
          </button>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

          <div className="candidate-info-pill">
            <div className="avatar">
              {member?.name ? member.name.charAt(0) : 'C'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>{member?.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member?.jobRole}</div>
            </div>
          </div>
        </div>

        <div className="progress-pill">
          Question {questionNumber} / 8+
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div style={{ 
          background: 'rgba(244, 63, 94, 0.15)', 
          border: '1px solid rgba(244, 63, 94, 0.3)', 
          color: 'var(--accent-rose)', 
          padding: '0.85rem 1.25rem', 
          borderRadius: '0.75rem',
          fontSize: '0.9rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Conversation Thread */}
      <div className="chat-history">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message-bubble ${msg.role === 'interviewer' ? 'interviewer' : 'candidate'}`}
          >
            <div className="sender-tag">
              {msg.role === 'interviewer' ? '🤖 AI Interviewer' : `👤 ${member?.name || 'Candidate'}`}
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-bubble interviewer" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Evaluating answer & generating follow-up...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Answer Form */}
      <form onSubmit={handleSubmit} className="answer-box-wrapper">
        <textarea
          className="answer-textarea"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your technical answer here... Explain your reasoning, trade-offs, and design choices."
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit(e);
            }
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '0.2rem' }}>Ctrl</kbd> + <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '0.2rem' }}>Enter</kbd> to submit
          </span>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={!answer.trim() || loading}
            style={{ width: 'auto', padding: '0.65rem 1.5rem' }}
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
            Submit Answer
          </button>
        </div>
      </form>
    </div>
  );
}
