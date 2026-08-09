const fs = require('fs');
const path = require('path');

class CurriculumService {
  constructor() {
    this.curriculum = null;
    this.loadCurriculum();
  }

  loadCurriculum() {
    try {
      const filePath = path.resolve(__dirname, '../../../data/curriculum.json');
      const data = fs.readFileSync(filePath, 'utf8');
      this.curriculum = JSON.parse(data);
      console.log(`[CurriculumService] Loaded ${this.curriculum.days?.length || 0} days from curriculum.json`);
    } catch (err) {
      console.error('[CurriculumService] Error loading curriculum.json:', err.message);
      throw err;
    }
  }

  getCurriculum() {
    return this.curriculum;
  }

  getAllDays() {
    return this.curriculum ? this.curriculum.days : [];
  }

  getDay(dayNumber) {
    if (!this.curriculum) return null;
    return this.curriculum.days.find(d => d.day === Number(dayNumber)) || null;
  }

  getModuleForDay(dayNumber) {
    if (!this.curriculum || !this.curriculum.modules) return null;
    const num = Number(dayNumber);
    return this.curriculum.modules.find(m => num >= m.days[0] && num <= m.days[1]) || null;
  }
}

module.exports = new CurriculumService();
