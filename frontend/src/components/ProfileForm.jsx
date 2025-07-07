import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload,
  Link as LinkIcon,
  Info,
  Delete,
  CheckCircle
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api';

import LoadingSpinner from './LoadingSpinner';

const ProfileForm = ({ 
  type, 
  onAnalysisStart, 
  onAnalysisComplete, 
  onAnalysisError,
  isAnalyzing 
}) => {
  const [formData, setFormData] = useState({
    url: '',
    targetRole: '',
    analysisType: 'basic'
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [urlValidation, setUrlValidation] = useState({ valid: null, message: '' });

  // File upload handling
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      const errorMessage = rejection.errors[0]?.message || 'File rejected';
      toast.error(errorMessage);
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setErrors({ ...errors, file: null });
      toast.success('File uploaded successfully');
    }
  }, [errors]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  });

  // Form handling
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData({ ...formData, [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }

    // Validate LinkedIn URL in real-time
    if (field === 'url' && type === 'linkedin') {
      validateLinkedInUrl(value);
    }
  };

  const validateLinkedInUrl = async (url) => {
    if (!url.trim()) {
      setUrlValidation({ valid: null, message: '' });
      return;
    }

    try {
      const response = await api.post('/api/profile/validate-url', { url });
      setUrlValidation({
        valid: response.data.valid,
        message: response.data.message
      });
    } catch (error) {
      setUrlValidation({
        valid: false,
        message: 'Error validating URL'
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (type === 'linkedin') {
      if (!formData.url.trim()) {
        newErrors.url = 'LinkedIn URL is required';
      } else if (!urlValidation.valid) {
        newErrors.url = urlValidation.message || 'Invalid LinkedIn URL';
      }
    } else {
      if (!uploadedFile) {
        newErrors.file = 'Please upload a PDF resume';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    onAnalysisStart();

    try {
      let response;

      if (type === 'linkedin') {
        // LinkedIn profile analysis
        console.log('Submitting LinkedIn analysis:', {
          url: formData.url,
          targetRole: formData.targetRole || '',
          analysisType: formData.analysisType
        });

        response = await api.post('/api/profile/analyze', {
          url: formData.url,
          targetRole: formData.targetRole || '',
          analysisType: formData.analysisType
        });
      } else {
        // Resume analysis
        const formDataObj = new FormData();
        formDataObj.append('resume', uploadedFile);
        formDataObj.append('targetRole', formData.targetRole || '');
        formDataObj.append('analysisType', formData.analysisType);

        console.log('Submitting resume analysis:', {
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
          targetRole: formData.targetRole || '',
          analysisType: formData.analysisType
        });

        response = await api.post('/api/resume/analyze', formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000 // 60 seconds timeout for file upload
        });
      }

      if (response.data.success) {
        onAnalysisComplete(response.data.data);
        toast.success('Analysis completed successfully!');
      } else {
        throw new Error(response.data.message || 'Analysis failed');
      }

    } catch (error) {
      console.error('Analysis error:', error);
      
      let errorMessage = 'Analysis failed. Please try again.';
      
      if (error.response?.status === 400) {
        // Validation error
        errorMessage = error.response.data.error || error.response.data.message || 'Invalid input provided';
        if (error.response.data.details) {
          errorMessage += ': ' + error.response.data.details.join(', ');
        }
      } else if (error.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Analysis is taking too long. Please try with a shorter document or try again later.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      onAnalysisError();
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setErrors({ ...errors, file: null });
  };

  const getDropzoneClassName = () => {
    let className = 'dropzone';
    if (isDragActive) className += ' active';
    if (isDragReject) className += ' error';
    return className;
  };

  if (isAnalyzing) {
    return <LoadingSpinner message="Analyzing your profile..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto' }}>
        {/* Input Section */}
        {type === 'linkedin' ? (
          <Box mb={3}>
            <TextField
              fullWidth
              label="LinkedIn Profile URL"
              placeholder="https://linkedin.com/in/your-username"
              value={formData.url}
              onChange={handleInputChange('url')}
              error={!!errors.url}
              helperText={errors.url || urlValidation.message}
              InputProps={{
                startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ mb: 2 }}
            />

            {/* URL Validation Indicator */}
            <AnimatePresence>
              {urlValidation.valid !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Alert 
                    severity={urlValidation.valid ? 'success' : 'error'}
                    sx={{ mb: 2 }}
                  >
                    {urlValidation.message}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        ) : (
          <Box mb={3}>
            {/* File Upload */}
            <Paper
              {...getRootProps()}
              className={getDropzoneClassName()}
              sx={{
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                backgroundColor: isDragActive ? 'primary.50' : 'grey.50',
                transition: 'all 0.3s ease',
                mb: 2,
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.50'
                }
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drag and drop a PDF file, or click to select
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                Maximum file size: 5MB
              </Typography>
            </Paper>

            {/* Uploaded File Display */}
            <AnimatePresence>
              {uploadedFile && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircle color="success" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {uploadedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                    <Tooltip title="Remove file">
                      <IconButton onClick={removeFile} size="small">
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Error */}
            {errors.file && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.file}
              </Alert>
            )}
          </Box>
        )}

        {/* Target Role */}
        <TextField
          fullWidth
          label="Target Role (Optional)"
          placeholder="e.g., Senior Software Engineer, Product Manager"
          value={formData.targetRole}
          onChange={handleInputChange('targetRole')}
          helperText="Specify a target role for more tailored suggestions"
          sx={{ mb: 3 }}
        />

        {/* Analysis Type */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Analysis Type</InputLabel>
          <Select
            value={formData.analysisType}
            label="Analysis Type"
            onChange={handleInputChange('analysisType')}
          >
            <MenuItem value="basic">
              <Box>
                <Typography variant="body2" fontWeight="medium">Basic Analysis</Typography>
                <Typography variant="caption" color="text.secondary">
                  Quick insights and basic suggestions
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem value="detailed">
              <Box>
                <Typography variant="body2" fontWeight="medium">Detailed Analysis</Typography>
                <Typography variant="caption" color="text.secondary">
                  Comprehensive analysis with content rewriting
                </Typography>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Info Alert */}
        <Alert 
          severity="info" 
          icon={<Info />}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            {type === 'linkedin' 
              ? 'Make sure your LinkedIn profile is set to public for optimal results.'
              : 'Your resume will be analyzed and then automatically deleted for privacy.'
            }
          </Typography>
        </Alert>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isAnalyzing || (type === 'linkedin' && !urlValidation.valid)}
          sx={{
            py: 1.5,
            fontSize: '1.1rem',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
            }
          }}
        >
          {isAnalyzing ? (
            <Box display="flex" alignItems="center" gap={2}>
              <LinearProgress sx={{ width: 100, height: 2 }} />
              Analyzing...
            </Box>
          ) : (
            `Analyze ${type === 'linkedin' ? 'Profile' : 'Resume'}`
          )}
        </Button>

        {/* Features List */}
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            What you'll get:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {[
              'AI-powered insights',
              'Professional scoring',
              'Content suggestions',
              'Keyword optimization',
              'PDF report',
              ...(formData.analysisType === 'detailed' ? ['Enhanced content rewriting'] : [])
            ].map((feature) => (
              <Chip
                key={feature}
                label={feature}
                variant="outlined"
                size="small"
                color="primary"
              />
            ))}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

export default ProfileForm;