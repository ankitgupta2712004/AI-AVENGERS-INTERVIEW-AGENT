import React, { useState, useEffect } from 'react';
import CandidateSelector from './components/CandidateSelector';
import InterviewScreen from './components/InterviewScreen';
import FeedbackScreen from './components/FeedbackScreen';
import { fetchCandidates, sendInterviewRequest } from './services/api';

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('select'); // 'select' | 'interview' | 'completed'
  const [feedback, setFeedback] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCandidates()
      .then(data => setCandidates(data))
      .catch(err => {
        console.error('Failed to load candidate dataset:', err);
        setError('Failed to load candidate dataset');
      });
  }, []);

  const handleStartInterview = async (candidate) => {
    setSelectedCandidate(candidate);
    setError(null);
    setLoading(true);

    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setSessionId(newSessionId);

    const member = candidate.member || candidate;

    try {
      // POST /api/interview initialization request
      const response = await sendInterviewRequest({
        sessionId: newSessionId,
        candidate: candidate
      });

      setMessages([
        { role: 'interviewer', text: response.reply }
      ]);
      setQuestionNumber(1);
      setStatus('interview');
    } catch (err) {
      console.error('Interview initialization error:', err);
      setError(err.message || 'Failed to start interview session');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (candidateAnswer) => {
    if (!sessionId || !candidateAnswer) return;

    setError(null);
    setLoading(true);

    // Append candidate message to chat
    setMessages(prev => [...prev, { role: 'candidate', text: candidateAnswer }]);

    try {
      // POST /api/interview continuation request
      const response = await sendInterviewRequest({
        sessionId: sessionId,
        message: candidateAnswer
      });

      if (response.done) {
        setStatus('completed');
        setFeedback(response.feedback);
      } else {
        setMessages(prev => [...prev, { role: 'interviewer', text: response.reply }]);
        setQuestionNumber(prev => prev + 1);
      }
    } catch (err) {
      console.error('Interview turn error:', err);
      setError(err.message || 'Failed to process turn');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedCandidate(null);
    setSessionId(null);
    setMessages([]);
    setFeedback(null);
    setStatus('select');
    setError(null);
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-content">
          <div className="logo-badge">
            <span>⚡ ABTalks</span> AI Interview Agent
          </div>
          <div className="logo-sub">Hackathon Edition</div>
        </div>
      </header>

      <main className="container">
        {status === 'select' && (
          <CandidateSelector 
            candidates={candidates} 
            onSelectCandidate={handleStartInterview} 
            loading={loading}
          />
        )}

        {status === 'interview' && (
          <InterviewScreen 
            candidate={selectedCandidate}
            messages={messages}
            onSendMessage={handleSendMessage}
            onResetSession={handleReset}
            loading={loading}
            error={error}
            questionNumber={questionNumber}
          />
        )}

        {status === 'completed' && (
          <FeedbackScreen 
            feedback={feedback}
            candidate={selectedCandidate}
            onRestart={handleReset}
          />
        )}
      </main>
    </div>
  );
}
