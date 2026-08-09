const { EVALUATE_ANSWER_PROMPT } = require('../prompts/evaluator.prompt');

class EvaluationService {
  async evaluateAnswer({ day, topic, objectives, questionAsked, candidateAnswer, difficulty }) {
    if (!candidateAnswer || typeof candidateAnswer !== 'string' || candidateAnswer.trim() === '') {
      return {
        score: 1,
        quality: 'incorrect',
        correctPoints: [],
        missingPoints: ['No answer provided'],
        misconceptions: ['Candidate submitted empty answer'],
        followUpNeeded: true,
        recommendedDifficulty: 'easy',
        recommendedAction: 'simplify_diagnostic',
        feedbackSummary: 'No answer provided by candidate.'
      };
    }

    // Check if an LLM API key is available
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
    if (apiKey) {
      try {
        const result = await this.callLLMEvaluator({ apiKey, day, topic, objectives, questionAsked, candidateAnswer, difficulty });
        if (result) return result;
      } catch (err) {
        console.warn('[EvaluationService] LLM call failed, using intelligent rule evaluator fallback:', err.message);
      }
    }

    // Intelligent question & topic aware evaluator
    return this.evaluateIntelligently({ day, topic, objectives, questionAsked, candidateAnswer, difficulty });
  }

  evaluateIntelligently({ day, topic, objectives, questionAsked, candidateAnswer, difficulty }) {
    const text = candidateAnswer.toLowerCase();
    const words = text.split(/\s+/).filter(Boolean);

    const questionLower = (questionAsked || '').toLowerCase();
    const topicLower = (topic || '').toLowerCase();
    const objectivesStr = (Array.isArray(objectives) ? objectives.join(' ') : String(objectives || '')).toLowerCase();

    // Key topic concept dictionary for topic relevance checking
    const topicKeywords = {
      'embeddings': ['embedding', 'vector', 'cosine', 'dot product', 'high-dimensional', 'dense', 'semantic', 'similarity', 'hnsw', 'ann'],
      'vector database': ['vector', 'database', 'hnsw', 'ann', 'nearest neighbor', 'index', 'ivf', 'flat', 'search', 'query'],
      'retrieval': ['retrieval', 'matching', 'hybrid', 'bm25', 'keyword', 'dense', 'rerank', 'precision', 'recall'],
      'prompt': ['prompt', 'few-shot', 'system instruction', 'zero-shot', 'chain-of-thought', 'schema', 'formatting', 'temperature', 'top_p'],
      'function calling': ['function', 'tool', 'structured output', 'json schema', 'declaration', 'call', 'arguments'],
      'agent': ['agent', 'langchain', 'react', 'tool', 'memory', 'thought', 'action', 'observation', 'multi-agent'],
      'docker': ['docker', 'kubernetes', 'container', 'pod', 'deployment', 'kubectl', 'image', 'helm'],
      'monitoring': ['monitoring', 'logging', 'observability', 'metrics', 'latency', 'token', 'cost', 'drift']
    };

    // Determine target concept category from the ASKED question and day/topic
    let expectedCategory = null;
    if (topicLower.includes('embedding') || questionLower.includes('embedding')) expectedCategory = 'embeddings';
    else if (topicLower.includes('vector') || questionLower.includes('vector database')) expectedCategory = 'vector database';
    else if (topicLower.includes('retrieval') || questionLower.includes('retrieval')) expectedCategory = 'retrieval';
    else if (topicLower.includes('prompt') || questionLower.includes('prompt')) expectedCategory = 'prompt';
    else if (topicLower.includes('function') || questionLower.includes('function')) expectedCategory = 'function calling';
    else if (topicLower.includes('agent') || questionLower.includes('agent')) expectedCategory = 'agent';
    else if (topicLower.includes('docker') || questionLower.includes('kubernetes')) expectedCategory = 'docker';
    else if (topicLower.includes('monitoring') || questionLower.includes('observability')) expectedCategory = 'monitoring';

    // Check if the answer is OFF-TOPIC
    let isOffTopic = false;
    if (expectedCategory) {
      const expectedTerms = topicKeywords[expectedCategory] || [];
      const hasExpectedTerm = expectedTerms.some(term => text.includes(term));
      
      // Check if answer contains terms from a completely different category
      let foundOtherCategory = null;
      for (const [cat, catTerms] of Object.entries(topicKeywords)) {
        if (cat !== expectedCategory) {
          const count = catTerms.filter(term => text.includes(term)).length;
          if (count >= 2) {
            foundOtherCategory = cat;
            break;
          }
        }
      }

      if (!hasExpectedTerm && foundOtherCategory) {
        isOffTopic = true;
      }
    }

    if (isOffTopic) {
      return {
        score: 2,
        quality: 'incorrect',
        correctPoints: [],
        missingPoints: [`Concepts relevant to Day ${day} (${topic}): expected response covering ${objectivesStr.substring(0, 80)}...`],
        misconceptions: [`Off-topic answer provided. Candidate answered about unrelated concepts instead of addressing the question asked on ${topic}.`],
        followUpNeeded: true,
        recommendedDifficulty: 'easy',
        recommendedAction: 'simplify_diagnostic',
        feedbackSummary: `Candidate response was OFF-TOPIC for Question on Day ${day} (${topic}).`
      };
    }

    // Standard evaluation matching expected topic keywords
    const confusionPhrases = ["don't know", "not sure", "no idea", "confused", "forget", "cannot remember", "haven't learned"];
    const hasConfusion = confusionPhrases.some(p => text.includes(p));

    const expectedTerms = expectedCategory ? (topicKeywords[expectedCategory] || []) : ['implementation', 'architecture', 'system'];
    const matchedTerms = expectedTerms.filter(t => text.includes(t));

    let score = 5;
    let quality = 'partial';
    let recommendedAction = 'probe_missing';
    let recommendedDifficulty = difficulty || 'medium';

    if (hasConfusion || words.length < 5) {
      score = 2;
      quality = 'incorrect';
      recommendedAction = 'simplify_diagnostic';
      recommendedDifficulty = 'easy';
    } else if (matchedTerms.length >= 2 || words.length > 25) {
      score = 8 + (matchedTerms.length >= 3 ? 1 : 0);
      quality = 'strong';
      recommendedAction = 'probe_reasoning';
      recommendedDifficulty = difficulty === 'easy' ? 'medium' : difficulty === 'medium' ? 'hard' : 'system_design';
    } else if (matchedTerms.length >= 1) {
      score = 6;
      quality = 'partial';
      recommendedAction = 'probe_missing';
      recommendedDifficulty = difficulty;
    } else {
      score = 4;
      quality = 'weak';
      recommendedAction = 'simplify_diagnostic';
      recommendedDifficulty = 'easy';
    }

    const correctPoints = matchedTerms.map(t => `Addressed concept '${t}' relevant to question asked`);
    if (correctPoints.length === 0 && words.length > 15) {
      correctPoints.push(`Provided general response related to ${topic}`);
    }

    const missingPoints = [];
    if (quality !== 'strong') {
      missingPoints.push(`Specific architectural trade-offs for ${topic} (Day ${day})`);
    }

    return {
      score,
      quality,
      correctPoints,
      missingPoints,
      misconceptions: hasConfusion ? ['Expressed uncertainty on core question'] : [],
      followUpNeeded: true,
      recommendedDifficulty,
      recommendedAction,
      feedbackSummary: `Evaluated against asked question (Day ${day}: ${topic}). Result: ${quality} (${score}/10).`
    };
  }

  async callLLMEvaluator({ apiKey, day, topic, objectives, questionAsked, candidateAnswer, difficulty }) {
    return null;
  }
}

module.exports = new EvaluationService();
