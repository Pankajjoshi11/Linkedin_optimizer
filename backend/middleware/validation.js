const Joi = require('joi');
const multer = require('multer');
const path = require('path');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// LinkedIn URL validation schema
const linkedinUrlSchema = Joi.object({
  url: Joi.string()
    .uri()
    .pattern(/^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid LinkedIn profile URL',
      'string.uri': 'Please provide a valid URL',
      'any.required': 'LinkedIn URL is required'
    }),
  targetRole: Joi.string().optional().allow('').max(100),
  analysisType: Joi.string().valid('basic', 'detailed').default('basic')
});

// Resume analysis request schema
const resumeAnalysisSchema = Joi.object({
  targetRole: Joi.string().optional().allow('').max(100),
  analysisType: Joi.string().valid('basic', 'detailed').default('basic')
});

// Middleware functions
const validateLinkedInUrl = (req, res, next) => {
  const { error, value } = linkedinUrlSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.validatedData = value;
  next();
};

const validateResumeAnalysis = (req, res, next) => {
  const { error, value } = resumeAnalysisSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.validatedData = value;
  next();
};

const handleFileUpload = upload.single('resume');

const sanitizeInput = (req, res, next) => {
  // Basic input sanitization
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
        // Remove potentially dangerous characters
        req.body[key] = req.body[key].replace(/[<>\"']/g, '');
      }
    }
  }
  next();
};

module.exports = {
  validateLinkedInUrl,
  validateResumeAnalysis,
  handleFileUpload,
  sanitizeInput
};
