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

async function runVerification() {
  console.log('=== PHASE 2 VERIFICATION TEST ===\n');

  // 1. Check Health Endpoint
  console.log('1. Testing GET /health ...');
  try {
    const health = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/health',
      method: 'GET'
    });
    console.log('Health status code:', health.statusCode);
    console.log('Health response:', health.body);
    if (health.statusCode !== 200) throw new Error('Health check failed');
  } catch (err) {
    console.error('Health check failed:', err.message);
    process.exit(1);
  }

  // 2. Initialization Request
  console.log('\n2. Testing POST /api/interview (Initialization) ...');
  const sessionId = `test-session-${Date.now()}`;
  const initPayload = {
    sessionId,
    candidateId: 'CAND-001'
  };

  let initResult;
  try {
    initResult = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/interview',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, initPayload);

    console.log('Init status code:', initResult.statusCode);
    console.log('Init response:', initResult.body);

    if (initResult.statusCode !== 200) throw new Error('Initialization request failed');
    if (typeof initResult.body.reply !== 'string') throw new Error('Response missing "reply" string');
    if (initResult.body.done !== false) throw new Error('Response "done" should be false');
    console.log('✔ Initialization verified successfully!');
  } catch (err) {
    console.error('Initialization test failed:', err.message);
    process.exit(1);
  }

  // 3. Continuation Request
  console.log('\n3. Testing POST /api/interview (Continuation Turn) ...');
  const turnPayload = {
    sessionId,
    message: 'An embedding is a dense vector representation of data in a continuous vector space where semantically similar items are mapped close to each other.'
  };

  try {
    const turnResult = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/interview',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, turnPayload);

    console.log('Turn status code:', turnResult.statusCode);
    console.log('Turn response:', turnResult.body);

    if (turnResult.statusCode !== 200) throw new Error('Continuation turn failed');
    if (typeof turnResult.body.reply !== 'string') throw new Error('Continuation missing "reply" string');
    if (turnResult.body.done !== false) throw new Error('Continuation "done" should be false');
    console.log('✔ Continuation turn verified successfully!');
  } catch (err) {
    console.error('Continuation test failed:', err.message);
    process.exit(1);
  }

  console.log('\n=== ALL PHASE 2 VERIFICATIONS PASSED SUCCESSFULLY ===');
  process.exit(0);
}

runVerification();
