const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');

router.post('/scrape', ProfileController.analyzeProfile);
router.get('/preview', ProfileController.getProfilePreview);

module.exports = router;