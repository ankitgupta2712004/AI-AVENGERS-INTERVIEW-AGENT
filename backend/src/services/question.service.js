const curriculumService = require('./curriculum.service');
const { GENERATE_INITIAL_QUESTION_PROMPT, GENERATE_FOLLOWUP_QUESTION_PROMPT } = require('../prompts/interviewer.prompt');

class QuestionService {
  /**
   * Determine the next curriculum topic and day to explore based on session state and candidate profile
   */
  selectNextTopic(session) {
    const profile = session.profileAnalysis;
    const daysCovered = session.daysCovered || [];
    const questionsAsked = session.questionsAsked || [];
    const lastQuestion = questionsAsked[questionsAsked.length - 1];
    const lastEval = session.evaluations[session.evaluations.length - 1];

    // Follow-up logic: if last evaluation requires probing on the same topic
    if (lastEval && lastQuestion && (lastEval.recommendedAction === 'probe_reasoning' || lastEval.recommendedAction === 'probe_missing' || lastEval.recommendedAction === 'simplify_diagnostic')) {
      // Check how many follow-ups have been asked on the current day
      const sameDayCount = questionsAsked.filter(q => q.day === lastQuestion.day).length;
      if (sameDayCount < 3) {
        return {
          day: lastQuestion.day,
          isFollowUp: true,
          action: lastEval.recommendedAction,
          difficulty: lastEval.recommendedDifficulty || session.currentDifficulty
        };
      }
    }

    // Otherwise, transition to a new curriculum day
    const allDays = curriculumService.getAllDays();
    
    // Priority order for day selection:
    // 1. Failed or high-attempt days not yet covered
    // 2. Skipped days not yet covered
    // 3. Days covering core AI modules (Module 3 Embeddings, Module 4 LLM Core, Module 6 Agentic AI, Module 7 Security/Deployment, Module 8 Production)
    // 4. Any uncovered curriculum day

    const uncoveredDays = allDays.filter(d => !daysCovered.includes(d.day));

    // Check failed or high attempt days
    const failedOrHighAttempt = uncoveredDays.find(d => 
      profile.failedDays.includes(d.day) || profile.highAttemptDays.some(h => h.day === d.day)
    );
    if (failedOrHighAttempt) {
      return { day: failedOrHighAttempt.day, isFollowUp: false, difficulty: 'medium' };
    }

    // Check skipped days
    const skipped = uncoveredDays.find(d => profile.skippedDays.includes(d.day));
    if (skipped) {
      return { day: skipped.day, isFollowUp: false, difficulty: 'medium' };
    }

    // Select key curriculum days across distinct modules to ensure balanced depth
    const keyCandidateDays = [7, 8, 10, 11, 12, 13, 21, 22, 23, 25, 27, 28, 29, 31];
    const keyUncovered = uncoveredDays.find(d => keyCandidateDays.includes(d.day));
    if (keyUncovered) {
      // Determine difficulty based on candidate experience & passed status
      const isPassedFirstTry = profile.passedDays.includes(keyUncovered.day);
      const difficulty = isPassedFirstTry && profile.yearsExperience >= 5 ? 'hard' : 'medium';
      return { day: keyUncovered.day, isFollowUp: false, difficulty };
    }

    // Fallback to any uncovered day
    if (uncoveredDays.length > 0) {
      return { day: uncoveredDays[0].day, isFollowUp: false, difficulty: 'medium' };
    }

    // Default fallback to Day 7
    return { day: 7, isFollowUp: false, difficulty: 'medium' };
  }

  /**
   * Formulate a technically specific question grounded in curriculum objectives
   */
  generateQuestion({ session, topicSelection, lastEval, lastAnswer }) {
    const dayData = curriculumService.getDay(topicSelection.day);
    if (!dayData) {
      throw new Error(`Curriculum day ${topicSelection.day} not found`);
    }

    const moduleObj = curriculumService.getModuleForDay(topicSelection.day);
    const candidateName = session.profileAnalysis.name;
    const difficulty = topicSelection.difficulty || session.currentDifficulty || 'medium';

    // If it's a targeted follow-up question
    if (topicSelection.isFollowUp && lastEval && lastAnswer) {
      const lastQ = session.questionsAsked[session.questionsAsked.length - 1];
      return this.formatFollowUpQuestion({
        candidateName,
        day: topicSelection.day,
        topic: dayData.title,
        objectives: dayData.objectives,
        tools: dayData.tools,
        previousQuestion: lastQ ? lastQ.questionText : '',
        previousAnswer: lastAnswer,
        evaluation: lastEval,
        action: topicSelection.action,
        difficulty
      });
    }

    // Initial / Transition Question
    return this.formatInitialQuestion({
      candidateName,
      day: topicSelection.day,
      topic: dayData.title,
      moduleTitle: moduleObj ? moduleObj.title : '',
      objectives: dayData.objectives,
      tools: dayData.tools,
      difficulty,
      profile: session.profileAnalysis
    });
  }

  formatInitialQuestion({ candidateName, day, topic, moduleTitle, objectives, tools, difficulty, profile }) {
    // Generate technically specific questions based on actual day objectives
    const primaryObj = Array.isArray(objectives) && objectives.length > 0 ? objectives[0] : 'Understand topic fundamentals';
    const secondaryObj = Array.isArray(objectives) && objectives.length > 1 ? objectives[1] : objectives[0];
    const toolsStr = Array.isArray(tools) ? tools.join(', ') : 'standard tools';

    // Curriculum Specific Question Mapping based on Day and Objectives
    switch (day) {
      case 7:
        return `You worked on embeddings and vector search during the cohort. Can you explain how high-dimensional vector embeddings represent semantic meaning, and how similarity metrics like cosine distance enable relevant document retrieval?`;
      case 8:
        return `When storing embeddings in a vector database, how does vector indexing differ from traditional relational indexing, and what trade-offs exist between exact nearest neighbor search and approximate nearest neighbor (ANN) search?`;
      case 10:
        return `In a retrieval and matching engine, suppose the system retrieves documents that are semantically similar but lack precise keyword matches. How would you design a hybrid retrieval approach combining keyword (BM25) and dense vector search?`;
      case 11:
        return `When building an end-to-end RAG system, how do you handle prompt context window limits and chunking strategy to prevent hallucination while retaining key context for the LLM?`;
      case 12:
        return `In prompt engineering, how do system instructions, few-shot prompting, and explicit output formatting constraints influence model output consistency, especially when enforcing strict schemas?`;
      case 13:
        return `When implementing function calling and structured outputs, how does the model select which tool to call based on user input, and how do you handle invalid argument errors or unexpected schema outputs?`;
      case 21:
        return `When developing AI Agents with LangChain, how do tool definitions, agent memory, and the reasoning loop (ReAct framework) enable the agent to solve multi-step tasks autonomously?`;
      case 22:
        return `In a multi-agent orchestration architecture, how do specialized agents communicate, hand off control, and handle sub-task failures without getting stuck in infinite loops?`;
      case 23:
        return `Can you explain the Model Context Protocol (MCP) and how it standardizes context integration between host applications and external data tools or server endpoints?`;
      case 25:
        return `When evaluating an agentic chatbot, how do you distinguish between retrieval quality metrics (like Precision@K and Recall) and LLM response generation metrics (like Faithfulness and Answer Relevance)?`;
      case 27:
        return `What security guardrails and privacy controls would you implement to protect a production AI application against prompt injection, jailbreaks, and sensitive data leakage?`;
      case 28:
        return `When containerizing and deploying an AI application using Docker and Kubernetes, how do you manage environment configuration, secrets, scaling replicas, and container health checks?`;
      case 29:
        return `In a production AI system, how do you set up observability and logging to monitor latency, token consumption costs, model drift, and error rates across API endpoints?`;
      case 31:
        return `For your final capstone demo, what was the architectural design of your end-to-end AI application, what major engineering trade-offs did you evaluate, and how did you measure overall system performance?`;
      default:
        return `Regarding Day ${day} (${topic}), the curriculum objective highlights "${primaryObj}". How would you implement this requirement in a production engineering setting using tools like ${toolsStr}?`;
    }
  }

  formatFollowUpQuestion({ candidateName, day, topic, objectives, tools, previousQuestion, previousAnswer, evaluation, action, difficulty }) {
    const missing = (evaluation.missingPoints && evaluation.missingPoints.length > 0) 
      ? evaluation.missingPoints[0] 
      : 'the underlying trade-offs';

    if (action === 'probe_reasoning') {
      return `That is a solid explanation. To push deeper into system design: how would you optimize this implementation for low latency under high concurrent load, and what trade-offs would you consider regarding memory vs query accuracy?`;
    }

    if (action === 'probe_missing') {
      return `You mentioned key concepts, but let's dive into ${missing}. Specifically, how would you address this aspects when building the production pipeline?`;
    }

    if (action === 'simplify_diagnostic') {
      return `Let's step back to the foundational concept of Day ${day} (${topic}). Can you explain the core mechanism step-by-step before we discuss advanced implementation details?`;
    }

    return `Building on your previous answer regarding ${topic}, what specific engineering choices or tools (${Array.isArray(tools) ? tools.join(', ') : 'relevant tools'}) would you select to ensure reliability?`;
  }
}

module.exports = new QuestionService();
