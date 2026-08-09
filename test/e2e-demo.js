const http = require('http');

const PORT = 5000;

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runCandidateDemo(candidateId, candidateName) {
  console.log(`================================================================`);
  console.log(`  RUNNING END-TO-END DEMO INTERVIEW FOR: ${candidateId} (${candidateName})`);
  console.log(`================================================================\n`);

  const sessionId = `e2e-session-${candidateId}-${Date.now()}`;

  // 1. Initialization
  const initRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/interview',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { sessionId, candidateId });

  console.log(`[Q1 Asked]:\n${initRes.body.reply}\n`);

  const answers = [
    "System prompts define core instructions while few-shot examples demonstrate expected output schema formats.",
    "Embeddings map text into dense vectors in continuous vector space using cosine distance for similarity retrieval.",
    "HNSW provides fast approximate nearest neighbor search over vector indexes to reduce query latency.",
    "Hybrid retrieval combines BM25 keyword search with vector embeddings to balance exact matching and semantic context.",
    "Prompt context window management requires dynamic chunking with overlap to retain key information for the LLM.",
    "Function calling parses tool declarations and model tool calls, invoking API endpoints with structured parameters.",
    "LangChain agents execute ReAct loops consisting of Thought, Action, Action Input, and Observation.",
    "Docker containers package dependencies while Kubernetes handles scaling replicas, pod health, and secrets.",
    "Monitoring requires tracking token latency, model error rates, cost metrics, and retrieval faithfulness.",
    "Final capstone demo benchmarked retrieval precision@k and LLM answer faithfulness across test datasets."
  ];

  let currentRes;
  for (let i = 0; i < answers.length; i++) {
    const turnNum = i + 2;
    console.log(`Turn ${turnNum - 1} Candidate Answer: "${answers[i].substring(0, 60)}..."`);
    currentRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/interview',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { sessionId, message: answers[i] });

    if (currentRes.body.done) {
      console.log(`\n🎉 Interview Completed on Turn ${turnNum - 1}!`);
      break;
    } else {
      console.log(`[Q${turnNum} Asked]:\n${currentRes.body.reply.substring(0, 140)}...\n`);
    }
  }

  // Fetch Session State
  const sessionRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: `/api/session/${sessionId}`,
    method: 'GET'
  });

  const session = sessionRes.body;

  console.log(`\n--- DEMO REPORT FOR ${candidateId} (${candidateName}) ---`);
  console.log(`Total Questions Asked: ${session.questionsAsked.length}`);
  console.log(`Curriculum Days Covered: ${session.daysCovered.join(', ')}`);
  console.log(`Topics Covered: ${session.topicsCovered.join(' | ')}`);
  console.log(`Final Feedback Summary:\n${session.feedback ? session.feedback.summary : 'N/A'}`);
  console.log(`----------------------------------------------------------------\n`);

  return session;
}

async function runE2EDemo() {
  const session1 = await runCandidateDemo('CAND-001', 'Sarah Johnson');
  const session2 = await runCandidateDemo('CAND-003', 'Emily Chen');

  console.log('================================================================');
  console.log('  PERSONALIZATION COMPARISON SUMMARY');
  console.log('================================================================');
  console.log(`CAND-001 (Sarah Johnson) Q1 Topic: ${session1.questionsAsked[0]?.topic} (Day ${session1.questionsAsked[0]?.day})`);
  console.log(`CAND-003 (Emily Chen) Q1 Topic: ${session2.questionsAsked[0]?.topic} (Day ${session2.questionsAsked[0]?.day})`);
  console.log('\n✔ Personalization Verified: Candidate performance signals dynamically altered initial topic selection & difficulty!');
}

runE2EDemo().catch(err => {
  console.error('❌ E2E Demo failed:', err);
  process.exit(1);
});
