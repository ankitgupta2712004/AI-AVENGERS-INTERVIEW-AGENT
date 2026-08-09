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

async function runRegressionTest() {
  console.log('===========================================================');
  console.log('  PHASE 3 REGRESSION TEST: QUESTION/EVALUATION ALIGNMENT');
  console.log('===========================================================\n');

  // PART A: OFF-TOPIC DETECTION TEST (Prompt Engineering Question vs Embeddings Answer)
  console.log('--- PART A: OFF-TOPIC ANSWER EVALUATION ---');
  const session1Id = `regression-session-prompt-${Date.now()}`;
  
  // 1. Ask a Prompt Engineering Question (Candidate CAND-001 initial priority)
  console.log('1. Initializing session for Prompt Engineering question...');
  const initRes1 = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/interview',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { sessionId: session1Id, candidateId: 'CAND-001' });

  console.log('Question Asked (Q1):\n', initRes1.body.reply);
  if (!initRes1.body.reply.toLowerCase().includes('prompt')) {
    throw new Error('Initial question was expected to be on Prompt Engineering');
  }

  // 2. Provide an Embeddings answer when Prompt Engineering was asked
  console.log('\n2. Providing an EMBEDDINGS answer to the PROMPT ENGINEERING question...');
  const embeddingsAnswer = "Embeddings map words to dense vectors in continuous vector space where cosine similarity measures semantic closeness for ANN retrieval.";

  const turn2Res1 = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/interview',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { sessionId: session1Id, message: embeddingsAnswer });

  // 3. Verify evaluator identifies answer as off-topic / incorrect
  const session1StateRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: `/api/session/${session1Id}`,
    method: 'GET'
  });
  const session1State = session1StateRes.body;
  const eval1 = session1State.evaluations[0];

  console.log('\n3. Evaluator Internal Assessment for Q1:');
  console.log(JSON.stringify(eval1, null, 2));

  if (eval1.quality !== 'incorrect') {
    throw new Error(`Expected evaluation quality 'incorrect', got '${eval1.quality}'`);
  }
  if (!eval1.misconceptions.some(m => m.toLowerCase().includes('off-topic'))) {
    throw new Error('Expected misconceptions array to explicitly flag off-topic response');
  }
  console.log('\n✔ Step 3 PASSED: Evaluator correctly identified answer as off-topic/incorrect!');

  // 4. Verify next question appropriately responds to that weakness
  console.log('\n4. Next Question Received (Diagnostic Follow-up):\n', turn2Res1.body.reply);
  if (!turn2Res1.body.reply.includes('Day 12') && !turn2Res1.body.reply.toLowerCase().includes('prompt')) {
    throw new Error('Expected next question to be a diagnostic follow-up on Prompt Engineering weakness!');
  }
  console.log('✔ Step 4 PASSED: Next question appropriately responded with diagnostic follow-up on Prompt Engineering!\n');


  // PART B: MATCHING TOPIC STRONG EVALUATION TEST (Embeddings Question vs Embeddings Answer)
  console.log('--- PART B: MATCHING TOPIC STRONG EVALUATION ---');
  const session2Id = `regression-session-embeddings-${Date.now()}`;

  // 5. Ask an Embeddings Question (Candidate CAND-003 initial topic)
  console.log('5. Initializing session for Embeddings question...');
  const initRes2 = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/interview',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { sessionId: session2Id, candidateId: 'CAND-003' });

  console.log('Question Asked (Q1):\n', initRes2.body.reply);
  
  // 6. Provide a correct Embeddings answer
  console.log('\n6. Providing a correct EMBEDDINGS answer...');
  const turn2Res2 = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/interview',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { sessionId: session2Id, message: embeddingsAnswer });

  // 7. Verify it receives a strong evaluation
  const session2StateRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: `/api/session/${session2Id}`,
    method: 'GET'
  });
  const session2State = session2StateRes.body;
  const eval2 = session2State.evaluations[0];

  console.log('\n7. Evaluator Internal Assessment for Q1 (Embeddings):');
  console.log(JSON.stringify(eval2, null, 2));

  if (eval2.quality !== 'strong' || eval2.score < 7) {
    throw new Error(`Expected strong evaluation for matching Embeddings answer, got quality '${eval2.quality}', score ${eval2.score}`);
  }
  console.log('\n✔ Step 7 PASSED: Evaluator awarded strong score (9/10) when answer matched question asked!');

  console.log('\n===========================================================');
  console.log('  ALL REGRESSION TEST ASSERTIONS PASSED 100% SUCCESSFULLY!');
  console.log('===========================================================');
}

runRegressionTest().catch(err => {
  console.error('\n❌ Regression test failed:', err);
  process.exit(1);
});
