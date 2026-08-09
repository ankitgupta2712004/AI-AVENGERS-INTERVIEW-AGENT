const sessionStore = require('../session/session.store');
const candidateService = require('../services/candidate.service');
const interviewerAgent = require('../agents/interviewer.agent');

exports.handleInterview = async (req, res) => {
  try {
    const { sessionId, candidate, candidateId, message } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const existingSession = sessionStore.getSession(sessionId);

    // 1. Initial Request (Session creation)
    if (!existingSession) {
      let candidateObj = candidate;

      if (!candidateObj && candidateId) {
        candidateObj = candidateService.getCandidateById(candidateId);
      }

      if (!candidateObj) {
        return res.status(400).json({ 
          error: 'candidate object or valid candidateId is required for session initialization' 
        });
      }

      const session = sessionStore.createSession(sessionId, candidateObj);
      const response = await interviewerAgent.startInterview(session);

      return res.status(200).json(response);
    }

    // 2. Reject if interview is already completed
    if (existingSession.status === 'completed') {
      return res.status(400).json({
        error: 'Interview session already completed'
      });
    }

    // 3. Continuation Turn
    if (message === undefined || message === null || typeof message !== 'string') {
      return res.status(400).json({
        error: 'message string is required for continuation turns'
      });
    }

    // Record candidate answer
    existingSession.answers.push({
      questionNumber: existingSession.questionNumber,
      candidateAnswer: message,
      answeredAt: new Date().toISOString()
    });

    const response = await interviewerAgent.processTurn(existingSession, message);

    return res.status(200).json(response);

  } catch (err) {
    console.error('[InterviewController] Error handling request:', err);
    return res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
};

exports.getSessionState = async (req, res) => {
  const { sessionId } = req.params;
  const session = sessionStore.getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  return res.status(200).json(session);
};
