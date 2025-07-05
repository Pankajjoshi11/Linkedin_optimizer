import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  TextField,
  Button,
  Typography,
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
    analysisType: 'detailed'
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [urlValidation, setUrlValidation] = useState({ valid: null, message: '' });

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const errorMessage = rejectedFiles[0]?.errors[0]?.message || 'File rejected';
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
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false
  });

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData({ ...formData, [field]: value });

    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }

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
    } catch {
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
        response = await api.post('/api/profile/analyze', {
          url: formData.url,
          targetRole: formData.targetRole || '',
          analysisType: 'detailed'
        });
      } else {
        const formDataObj = new FormData();
        formDataObj.append('resume', uploadedFile);
        formDataObj.append('targetRole', formData.targetRole || '');
        formDataObj.append('analysisType', 'detailed');

        response = await api.post('/api/resume/analyze', formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000
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
        errorMessage = error.response.data.error || error.response.data.message;
        if (error.response.data.details) {
          errorMessage += ': ' + error.response.data.details.join(', ');
        }
      } else if (error.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait and try again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Analysis timed out. Try a shorter profile.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection.';
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto' }}>
        {type === 'linkedin' && (
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
            <AnimatePresence>
              {urlValidation.valid !== null && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <Alert severity={urlValidation.valid ? 'success' : 'error'} sx={{ mb: 2 }}>
                    {urlValidation.message}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        )}

        <TextField
          fullWidth
          label="Target Role"
          placeholder="e.g., Software Engineer, Product Manager"
          value={formData.targetRole}
          onChange={handleInputChange('targetRole')}
          helperText="Specify a target role for more tailored suggestions"
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          label="Analysis Type"
          value="Detailed Analysis"
          InputProps={{ readOnly: true }}
          sx={{ mb: 3 }}
        />

        <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
          <Typography variant="body2">
            Make sure your LinkedIn profile is set to public for optimal results.
          </Typography>
        </Alert>

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
            `Analyze Profile`
          )}
        </Button>

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
              'Enhanced content rewriting'
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
