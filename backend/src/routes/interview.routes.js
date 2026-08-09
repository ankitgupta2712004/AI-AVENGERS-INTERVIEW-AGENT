const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interview.controller');

router.post('/interview', interviewController.handleInterview);
router.get('/session/:sessionId', interviewController.getSessionState);

module.exports = router;
