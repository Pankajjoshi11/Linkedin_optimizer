const express = require('express');
const resumeController = require('../controllers/resumeController');
const { validateResumeAnalysis, handleFileUpload, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// POST /api/resume/analyze - Analyze uploaded resume
router.post('/analyze',
  handleFileUpload,
  sanitizeInput,
  validateResumeAnalysis,
  resumeController.analyzeResume
);

// POST /api/resume/report - Generate PDF analysis report
router.post('/report',
  sanitizeInput,
  resumeController.generateReport
);

// POST /api/resume/tailored - Generate tailored resume
router.post('/tailored',
  sanitizeInput,
  resumeController.generateTailoredResume
);

// POST /api/resume/validate-file - Validate uploaded file
router.post('/validate-file',
  handleFileUpload,
  resumeController.validateFile
);

// GET /api/resume/status - Check upload service status
router.get('/status',
  resumeController.getUploadStatus
);

module.exports = router;
