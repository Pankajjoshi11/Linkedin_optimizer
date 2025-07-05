const express = require('express');
const profileController = require('../controllers/profileController');
const { validateLinkedInUrl, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// POST /api/profile/analyze - Analyze LinkedIn profile
router.post('/analyze', 
  sanitizeInput,
  validateLinkedInUrl,
  profileController.analyzeProfile
);

// POST /api/profile/report - Generate PDF analysis report
router.post('/report', 
  sanitizeInput,
  profileController.generateReport
);

// GET /api/profile/preview - Get basic profile info without full analysis
router.get('/preview', 
  profileController.getProfilePreview
);

// POST /api/profile/validate-url - Validate LinkedIn URL format
router.post('/validate-url', 
  sanitizeInput,
  profileController.validateUrl
);

// GET /api/profile/status - Check analysis service status
router.get('/status', 
  profileController.getAnalysisStatus
);

module.exports = router;
