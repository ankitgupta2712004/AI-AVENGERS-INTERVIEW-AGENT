const fs = require('fs');
const path = require('path');

class CandidateService {
  constructor() {
    this.candidatesData = null;
    this.loadCandidates();
  }

  loadCandidates() {
    try {
      const filePath = path.resolve(__dirname, '../../../data/candidates.json');
      const data = fs.readFileSync(filePath, 'utf8');
      this.candidatesData = JSON.parse(data);
      console.log(`[CandidateService] Loaded ${this.candidatesData.candidates?.length || 0} candidates from candidates.json`);
    } catch (err) {
      console.error('[CandidateService] Error loading candidates.json:', err.message);
      throw err;
    }
  }

  getCandidateById(id) {
    if (!this.candidatesData || !this.candidatesData.candidates) return null;
    return this.candidatesData.candidates.find(c => c.member?.id === id) || null;
  }

  getAllCandidates() {
    return this.candidatesData ? this.candidatesData.candidates : [];
  }

  analyzeCandidateProfile(candidateData) {
    if (!candidateData) return null;

    const member = candidateData.member || candidateData;
    const missions = candidateData.missions || [];
    const signals = candidateData.signals || {};

    const passedDays = [];
    const failedDays = [];
    const skippedDays = [];
    const highAttemptDays = [];

    missions.forEach(m => {
      if (m.skipped) {
        skippedDays.push(m.day);
      } else if (m.passed === false) {
        failedDays.push(m.day);
      } else if (m.passed === true) {
        passedDays.push(m.day);
        if (m.attempts && m.attempts > 2) {
          highAttemptDays.push({ day: m.day, attempts: m.attempts, title: m.title });
        }
      }
    });

    return {
      id: member.id || 'CAND-CUSTOM',
      name: member.name || 'Candidate',
      jobRole: member.jobRole || 'Software Engineer',
      yearsExperience: member.yearsExperience || 0,
      education: member.education || 'N/A',
      passedDays,
      failedDays,
      skippedDays,
      highAttemptDays,
      signals: {
        commitDays: signals.commitDays || 0,
        missionsCompleted: signals.missionsCompleted || 0,
        missionsFirstTry: signals.missionsFirstTry || 0
      }
    };
  }
}

module.exports = new CandidateService();
