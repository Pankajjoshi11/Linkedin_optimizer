const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Clean up uploaded files
 */
const cleanupFile = async (filePath) => {
  try {
    if (filePath && await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error);
  }
};

/**
 * Generate unique filename
 */
const generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  return `${name}-${uuidv4()}${ext}`;
};

/**
 * Validate file type
 */
const isValidFileType = (mimetype, allowedTypes = ['application/pdf']) => {
  return allowedTypes.includes(mimetype);
};

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Extract LinkedIn username from URL
 */
const extractLinkedInUsername = (url) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const inIndex = pathParts.indexOf('in');
    
    if (inIndex !== -1 && pathParts[inIndex + 1]) {
      return pathParts[inIndex + 1];
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting LinkedIn username:', error);
    return null;
  }
};

/**
 * Calculate completeness score
 */
const calculateCompleteness = (profile) => {
  const fields = [
    'name',
    'headline',
    'summary',
    'experience',
    'education',
    'skills'
  ];
  
  let completedFields = 0;
  
  fields.forEach(field => {
    if (profile[field]) {
      if (Array.isArray(profile[field])) {
        if (profile[field].length > 0) completedFields++;
      } else if (typeof profile[field] === 'string') {
        if (profile[field].trim().length > 0) completedFields++;
      } else {
        completedFields++;
      }
    }
  });
  
  return Math.round((completedFields / fields.length) * 100);
};

/**
 * Create error response
 */
const createErrorResponse = (message, details = null, statusCode = 500) => {
  const response = {
    error: message,
    timestamp: new Date().toISOString()
  };
  
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }
  
  return { response, statusCode };
};

/**
 * Create success response
 */
const createSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Sleep utility
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} in ${delay}ms...`);
      await sleep(delay);
    }
  }
};

module.exports = {
  cleanupFile,
  generateUniqueFilename,
  isValidFileType,
  formatFileSize,
  extractLinkedInUsername,
  calculateCompleteness,
  createErrorResponse,
  createSuccessResponse,
  sleep,
  retryWithBackoff
};
