const candidateService = require('../services/candidate.service');

class SessionStore {
  constructor() {
    this.sessions = new Map();
  }

  createSession(sessionId, candidateData) {
    if (this.sessions.has(sessionId)) {
      const existing = this.sessions.get(sessionId);
      if (existing.status === 'completed') {
        throw new Error('Interview session already completed');
      }
      // Return existing active session if already initialized
      return existing;
    }

    const profileAnalysis = candidateService.analyzeCandidateProfile(candidateData);

    const session = {
      sessionId,
      candidate: candidateData,
      profileAnalysis,
      status: 'active',
      questionNumber: 0, // Will become 1 on first question
      minimumQuestions: 8,
      targetQuestions: 10,
      topicsCovered: [],
      daysCovered: [],
      questionsAsked: [],
      answers: [],
      evaluations: [],
      currentTopic: null,
      currentDay: null,
      currentDifficulty: 'medium',
      followUpCount: 0,
      feedback: null,
      startedAt: new Date().toISOString(),
      completedAt: null
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  hasSession(sessionId) {
    return this.sessions.has(sessionId);
  }

  updateSession(sessionId, updates) {
    const session = this.getSession(sessionId);
    if (!session) return null;
    Object.assign(session, updates);
    this.sessions.set(sessionId, session);
    return session;
  }

  canCompleteInterview(session) {
    if (!session) return false;
    const countSatisfied = session.questionNumber >= session.minimumQuestions;
    const daysSatisfied = session.daysCovered && session.daysCovered.length >= 4;
    return countSatisfied && daysSatisfied;
  }

  markCompleted(sessionId, feedback) {
    const session = this.getSession(sessionId);
    if (!session) return null;
    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    session.feedback = feedback;
    return session;
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }
}

module.exports = new SessionStore();
