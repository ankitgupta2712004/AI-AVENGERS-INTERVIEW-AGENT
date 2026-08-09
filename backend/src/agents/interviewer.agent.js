const questionService = require('../services/question.service');
const evaluationService = require('../services/evaluation.service');
const feedbackService = require('../services/feedback.service');
const curriculumService = require('../services/curriculum.service');
const sessionStore = require('../session/session.store');

class InterviewerAgent {
  /**
   * Start a new interview session with personalized first question
   */
  async startInterview(session) {
    // Select initial topic based on candidate profile signals
    const topicSelection = questionService.selectNextTopic(session);
    const dayData = curriculumService.getDay(topicSelection.day);

    session.questionNumber = 1;
    session.currentDay = topicSelection.day;
    session.currentTopic = dayData ? dayData.title : `Day ${topicSelection.day}`;
    session.currentDifficulty = topicSelection.difficulty || 'medium';

    if (!session.daysCovered.includes(topicSelection.day)) {
      session.daysCovered.push(topicSelection.day);
    }
    if (!session.topicsCovered.includes(session.currentTopic)) {
      session.topicsCovered.push(session.currentTopic);
    }

    const firstQuestionText = questionService.generateQuestion({
      session,
      topicSelection
    });

    const fullWelcome = `Welcome ${session.profileAnalysis.name}. Let's begin your technical interview.\n\n${firstQuestionText}`;

    session.questionsAsked.push({
      questionNumber: 1,
      day: topicSelection.day,
      topic: session.currentTopic,
      questionText: firstQuestionText,
      difficulty: session.currentDifficulty,
      askedAt: new Date().toISOString()
    });

    return {
      reply: fullWelcome,
      done: false
    };
  }

  /**
   * Process candidate answer and decide next turn or interview completion
   */
  async processTurn(session, candidateAnswer) {
    const lastQuestion = session.questionsAsked[session.questionsAsked.length - 1];

    if (!lastQuestion) {
      throw new Error('No previous question found in session to evaluate');
    }

    const questionDayData = curriculumService.getDay(lastQuestion.day);

    // 1. Evaluate candidate answer against the EXACT question asked
    const evaluation = await evaluationService.evaluateAnswer({
      day: lastQuestion.day,
      topic: lastQuestion.topic,
      objectives: questionDayData ? questionDayData.objectives : [],
      questionAsked: lastQuestion.questionText,
      candidateAnswer,
      difficulty: lastQuestion.difficulty || session.currentDifficulty
    });

    // Save candidate evaluation
    session.evaluations.push(evaluation);

    // Update difficulty based on evaluation
    if (evaluation.recommendedDifficulty) {
      session.currentDifficulty = evaluation.recommendedDifficulty;
    }

    // 2. Check if deterministic completion criteria are met
    const minQuestionsMet = session.questionNumber >= session.minimumQuestions;
    const minDaysMet = session.daysCovered.length >= 4;

    if (minQuestionsMet && minDaysMet && session.questionNumber >= session.targetQuestions) {
      const feedbackObj = feedbackService.generateFeedback(session);
      sessionStore.markCompleted(session.sessionId, feedbackObj);

      return {
        reply: 'Interview completed.',
        done: true,
        feedback: feedbackObj
      };
    }

    // 3. Select next topic (or follow-up)
    session.questionNumber += 1;

    const topicSelection = questionService.selectNextTopic(session);
    const dayData = curriculumService.getDay(topicSelection.day);

    session.currentDay = topicSelection.day;
    session.currentTopic = dayData ? dayData.title : `Day ${topicSelection.day}`;

    if (!session.daysCovered.includes(topicSelection.day)) {
      session.daysCovered.push(topicSelection.day);
    }
    if (!session.topicsCovered.includes(session.currentTopic)) {
      session.topicsCovered.push(session.currentTopic);
    }

    // 4. Generate next question text
    const nextQuestionText = questionService.generateQuestion({
      session,
      topicSelection,
      lastEval: evaluation,
      lastAnswer: candidateAnswer
    });

    session.questionsAsked.push({
      questionNumber: session.questionNumber,
      day: topicSelection.day,
      topic: session.currentTopic,
      questionText: nextQuestionText,
      difficulty: session.currentDifficulty,
      askedAt: new Date().toISOString()
    });

    return {
      reply: nextQuestionText,
      done: false
    };
  }
}

module.exports = new InterviewerAgent();
