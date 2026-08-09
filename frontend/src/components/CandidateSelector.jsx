import React from 'react';
import { UserCheck, Award, AlertTriangle, FastForward } from 'lucide-react';

export default function CandidateSelector({ candidates, onSelectCandidate, loading }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Select Cohort Candidate
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto' }}>
          Choose a candidate profile to initialize a dynamic, highly personalized technical interview based on their cohort performance signals.
        </p>
      </div>

      <div className="candidate-grid">
        {candidates.map((cand) => {
          const member = cand.member || cand;
          const signals = cand.signals || {};
          const missions = cand.missions || [];

          const passedCount = missions.filter(m => m.passed && !m.skipped).length;
          const skippedCount = missions.filter(m => m.skipped).length;
          const failedCount = missions.filter(m => m.passed === false).length;

          return (
            <div key={member.id} className="candidate-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="candidate-name">{member.name}</h3>
                    <div className="candidate-role">{member.jobRole}</div>
                  </div>
                  <span style={{ 
                    background: 'rgba(59, 130, 246, 0.15)', 
                    color: 'var(--accent-blue)', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '0.3rem', 
                    fontSize: '0.75rem', 
                    fontWeight: 700 
                  }}>
                    {member.id}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {member.education} • {member.yearsExperience} yrs exp
                </div>

                <div className="candidate-stats">
                  <div className="stat-item">
                    <span className="stat-label">Completed</span>
                    <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                      {signals.missionsCompleted || passedCount} missions
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">First-Try</span>
                    <span className="stat-value" style={{ color: 'var(--accent-blue)' }}>
                      {signals.missionsFirstTry || 0} missions
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Skipped</span>
                    <span className="stat-value" style={{ color: skippedCount > 0 ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
                      {skippedCount} topics
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Commit Days</span>
                    <span className="stat-value">
                      {signals.commitDays || 0} / 31
                    </span>
                  </div>
                </div>
              </div>

              <button 
                className="btn-primary" 
                onClick={() => onSelectCandidate(cand)}
                disabled={loading}
              >
                <UserCheck size={18} />
                Start Technical Interview
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
