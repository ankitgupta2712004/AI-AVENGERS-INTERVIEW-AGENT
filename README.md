# ABTalks AI Interview Agent — Adaptive Technical Interviewer

A production-quality **Adaptive AI Technical Interviewer** built for the ABTalks Hackathon.

The system acts as a realistic technical interviewer rather than a fixed questionnaire. It ingests candidate cohort performance history (`candidates.json`) and curriculum data (`curriculum.json`), dynamically personalizes interview topics, evaluates candidate answers turn-by-turn, adapts question difficulty, probes weak or skipped concepts, enforces deterministic coverage requirements (min 8 questions, min 4 curriculum days), and generates structured feedback upon completion.

---

## 🌟 Key Features

* **Strict API Contract:** Implements single mandatory endpoint `POST /api/interview` using persistent `sessionId`.
* **Cohort Personalization:** Ingests candidate profile signals (passed, failed, skipped missions, attempt counts, first-try rate) to tailor interview topics.
* **Curriculum-Grounded Questioning:** Selects technically specific questions derived directly from actual curriculum objectives across 31 course days.
* **Adaptive Question Engine:** 
  * **Strong Answers:** Triggers deeper system-design, trade-off, or architectural questions (`probe_reasoning`).
  * **Partial Answers:** Targets missing concepts directly (`probe_missing`).
  * **Weak/Incorrect Answers:** Shifts to simpler foundational diagnostic questions (`simplify_diagnostic`).
  * **Off-Topic Detection:** Explicitly flags responses that do not answer the question presented.
* **Deterministic Safeguards:** Min 8 questions and min 4 distinct curriculum days strictly enforced by backend logic before interview completion can occur.
* **Structured Feedback Engine:** Generates real actionable post-interview feedback containing `summary`, `strengths`, `gaps`, and `next` steps.
* **Polished Modern Frontend:** Built with React & Vite featuring candidate selection (CAND-001 to CAND-020), turn-by-turn chat interface, progress indicators, and feedback dashboard.

---

## 🏗️ Architecture

```
                       ┌─────────────────────────┐
                       │     React + Vite UI     │
                       └────────────┬────────────┘
                                    │ POST /api/interview
                                    ▼
                       ┌─────────────────────────┐
                       │    Express API Route    │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │    Interviewer Agent    │
                       └─────┬─────────────┬─────┘
                             │             │
              ┌──────────────┴───┐     ┌───┴──────────────┐
              ▼                  ▼     ▼                  ▼
      Candidate Service   Curriculum Service   Evaluation Service
      (signals analysis)   (31 days mapping)  (rubric & off-topic)
              │                  │                        │
              └──────────────────┼────────────────────────┘
                                 ▼
                       ┌─────────────────────────┐
                       │      Session Store      │
                       │ (deterministic state)   │
                       └─────────────────────────┘
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
* Node.js v18+
* npm

### Installation & Running

1. **Clone repository:**
   ```bash
   git clone <repository_url>
   cd Project
   ```

2. **Setup & Run Backend:**
   ```bash
   cd backend
   npm install
   npm start
   # Backend running on http://localhost:5000
   ```

3. **Setup & Run Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Frontend running on http://localhost:3000
   ```

4. **Environment Variables (`.env`):**
   ```env
   PORT=5000
   NODE_ENV=development
   # Optional LLM keys (Fallback rule-engine runs seamlessly offline):
   # GEMINI_API_KEY=your_key
   # OPENAI_API_KEY=your_key
   ```

---

## 📡 API Documentation

### Endpoint
```http
POST /api/interview
```

#### 1. Initialization (Turn 1)
```json
POST /api/interview
{
  "sessionId": "session-abc-123",
  "candidateId": "CAND-001"
}
```
**Response:**
```json
{
  "reply": "Welcome Sarah Johnson. Let's begin your technical interview. In prompt engineering, how do system instructions...",
  "done": false
}
```

#### 2. Continuation (Turns 2 - 10)
```json
POST /api/interview
{
  "sessionId": "session-abc-123",
  "message": "System instructions establish core persona while few-shot examples demonstrate expected output format..."
}
```
**Response:**
```json
{
  "reply": "That is a solid explanation. To push deeper into system design: how would you optimize this implementation...",
  "done": false
}
```

#### 3. Final Turn (Completion)
**Response:**
```json
{
  "reply": "Interview completed.",
  "done": true,
  "feedback": {
    "summary": "Technical interview completed for Sarah Johnson. Evaluated across 10 questions covering 4 curriculum days (12, 28, 29, 7)...",
    "strengths": [
      "Demonstrated strong conceptual understanding in Prompt Engineering Fundamentals (Score: 9/10).",
      "Effectively explained key concepts..."
    ],
    "gaps": [
      "Identified knowledge gap in Monitoring, Logging & Observability (Day 29)."
    ],
    "next": [
      "Review retrieval evaluation metrics (Precision@K, Recall, Faithfulness) for RAG applications.",
      "Practice hands-on system design trade-offs between keyword search, vector search, and hybrid reranking."
    ]
  }
}
```

---

## 🧪 Test Suite Execution

Run all test suites from the project root:

```bash
# Phase 2 API contract & health verification
node test/phase2-verify.js

# Phase 3 Adaptive engine & scenarios A through J
node test/phase3-verify.js

# Phase 3 Question/Evaluation alignment regression test
node test/phase3-regression.js
```

---

## 🏆 Demo Mode Verification

In the React UI:
1. Select **CAND-001** (Sarah Johnson — Senior Data Engineer).
2. Observe Q1 start on Day 12 (Prompt Engineering) due to high attempts (4 attempts).
3. Select **CAND-003** (Emily Chen — AI Engineer).
4. Observe Q1 start on Day 7 (Embeddings) reflecting her passed first-try record.
