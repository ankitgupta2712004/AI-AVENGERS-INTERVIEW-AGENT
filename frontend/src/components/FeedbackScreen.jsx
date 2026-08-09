import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, Award } from 'lucide-react';

export default function FeedbackScreen({ feedback, candidate, onRestart }) {
  const member = candidate?.member || candidate;
  const { summary, strengths = [], gaps = [], next = [] } = feedback || {};

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%' }}>
      <div className="feedback-card">
        <div className="feedback-header">
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', marginBottom: '0.75rem' }}>
            <Award size={36} />
          </div>
          <h2 className="feedback-title">Interview Completed</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Evaluation Report for <strong style={{ color: 'var(--text-primary)' }}>{member?.name}</strong> ({member?.jobRole})
          </p>
        </div>

        {/* Summary */}
        {summary && (
          <div className="summary-box">
            <h4 style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--accent-emerald)' }}>
              Executive Summary
            </h4>
            <p>{summary}</p>
          </div>
        )}

        {/* Strengths */}
        <div className="feedback-section">
          <h3 className="section-heading strengths">
            <CheckCircle2 size={20} />
            Key Strengths Identified
          </h3>
          <ul className="bullet-list strengths">
            {strengths.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Gaps */}
        <div className="feedback-section">
          <h3 className="section-heading gaps">
            <AlertTriangle size={20} />
            Targeted Technical Gaps
          </h3>
          <ul className="bullet-list gaps">
            {gaps.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Next Steps */}
        <div className="feedback-section">
          <h3 className="section-heading next">
            <ArrowRight size={20} />
            Recommended Next Steps
          </h3>
          <ul className="bullet-list next">
            {next.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button className="btn-primary" onClick={onRestart} style={{ width: 'auto', padding: '0.85rem 2rem' }}>
            <RotateCcw size={18} />
            Start Another Candidate Interview
          </button>
        </div>
      </div>
    </div>
  );
}
