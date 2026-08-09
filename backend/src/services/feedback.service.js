class FeedbackService {
  generateFeedback(session) {
    const candidateName = session.profileAnalysis ? session.profileAnalysis.name : 'Candidate';
    const questionsAsked = session.questionsAsked || [];
    const evaluations = session.evaluations || [];
    const daysCovered = session.daysCovered || [];

    const strengths = new Set();
    const gaps = new Set();

    evaluations.forEach((ev, idx) => {
      const q = questionsAsked[idx];
      const topicName = q ? q.topic : `Topic ${idx + 1}`;

      if (ev.quality === 'strong' || ev.score >= 7) {
        strengths.add(`Demonstrated strong conceptual understanding in ${topicName} (Score: ${ev.score}/10).`);
        if (ev.correctPoints && ev.correctPoints.length > 0) {
          strengths.add(`Effectively explained: ${ev.correctPoints.slice(0, 2).join('; ')}.`);
        }
      } else if (ev.quality === 'partial') {
        gaps.add(`Partial clarity on ${topicName}: missing deeper implementation details.`);
      } else if (ev.quality === 'weak' || ev.quality === 'incorrect') {
        gaps.add(`Identified knowledge gap in ${topicName} (Day ${q ? q.day : 'N/A'}).`);
        if (ev.missingPoints && ev.missingPoints.length > 0) {
          gaps.add(`Needs improvement on: ${ev.missingPoints[0]}`);
        }
      }
    });

    if (strengths.size === 0) {
      strengths.add('Consistently engaged throughout the multi-turn technical interview.');
      strengths.add('Covered multiple AI curriculum domains across cohort days.');
    }

    if (gaps.size === 0) {
      gaps.add('Further practice recommended on real-world production scaling trade-offs.');
    }

    const nextSteps = [
      'Review retrieval evaluation metrics (Precision@K, Recall, Faithfulness) for RAG applications.',
      'Practice hands-on system design trade-offs between keyword search, vector search, and hybrid reranking.',
      'Study production deployment, container scaling, and guardrails for multi-agent workflows.'
    ];

    const summaryText = `Technical interview completed for ${candidateName}. Evaluated across ${questionsAsked.length} technical questions covering ${daysCovered.length} curriculum days (${daysCovered.join(', ')}). Overall demonstrated average technical score of ${Math.round(evaluations.reduce((acc, e) => acc + (e.score || 5), 0) / (evaluations.length || 1))}/10.`;

    return {
      summary: summaryText,
      strengths: Array.from(strengths),
      gaps: Array.from(gaps),
      next: nextSteps
    };
  }
}

module.exports = new FeedbackService();
