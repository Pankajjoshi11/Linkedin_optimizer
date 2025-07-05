import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ExpandMore,
  Download,
  Refresh,
  Share,
  TrendingUp,
  Lightbulb,
  VpnKey,
  Edit,
  CheckCircle,
  ArrowForward
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api';
import { saveAs } from 'file-saver';

import ScoreCard from './ScoreCard';

const Results = ({ results, analysisType, onNewAnalysis }) => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);

  const { profile, analysis, metadata } = results;

  const handleDownloadReport = async () => {
    setIsGeneratingReport(true);
    
    try {
      const endpoint = analysisType === 'linkedin' ? '/api/profile/report' : '/api/resume/report';
      
      const response = await api.post(endpoint, {
        profileData: profile,
        analysisData: analysis,
        includeCharts: true,
        includeRewritten: true
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const filename = `${analysisType}-analysis-report-${Date.now()}.pdf`;
      saveAs(blob, filename);
      
      toast.success('Report downloaded successfully!');
      
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleGenerateTailoredResume = async () => {
    if (analysisType !== 'resume') return;
    
    setIsGeneratingResume(true);
    
    try {
      const response = await api.post('/api/resume/tailored', {
        profileData: profile,
        analysisData: analysis,
        targetRole: metadata.targetRole
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const filename = `tailored-resume-${Date.now()}.pdf`;
      saveAs(blob, filename);
      
      toast.success('Tailored resume generated successfully!');
      
    } catch (error) {
      console.error('Error generating tailored resume:', error);
      toast.error('Failed to generate tailored resume. Please try again.');
    } finally {
      setIsGeneratingResume(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'LinkedIn Profile Analysis Results',
        text: `I just analyzed my ${analysisType} and got a ${analysis.scores?.overall}/100 score!`,
        url: window.location.href,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const getSuggestionIcon = (category) => {
    const icons = {
      headline: Edit,
      summary: Lightbulb,
      experience: TrendingUp,
      skills: VpnKey,
      general: CheckCircle
    };
    return icons[category] || Lightbulb;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: 'white',
            p: 3
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Analysis Complete!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {profile.name && `Profile: ${profile.name} • `}
                {metadata.targetRole && `Target Role: ${metadata.targetRole} • `}
                Analysis Type: {metadata.analysisType}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Analyzed on {new Date(metadata.analyzedAt).toLocaleDateString()}
              </Typography>
            </Box>
            
            <Box display="flex" gap={1}>
              <Tooltip title="Share results">
                <IconButton onClick={handleShare} sx={{ color: 'white' }}>
                  <Share />
                </IconButton>
              </Tooltip>
              <Tooltip title="Start new analysis">
                <IconButton onClick={onNewAnalysis} sx={{ color: 'white' }}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<Download />}
                onClick={handleDownloadReport}
                disabled={isGeneratingReport}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                  }
                }}
              >
                {isGeneratingReport ? 'Generating...' : 'Download Report'}
              </Button>
            </Grid>
            
            {analysisType === 'resume' && analysis.rewritten && (
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Edit />}
                  onClick={handleGenerateTailoredResume}
                  disabled={isGeneratingResume}
                  sx={{ py: 1.5 }}
                >
                  {isGeneratingResume ? 'Generating...' : 'Tailored Resume'}
                </Button>
              </Grid>
            )}
            
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Refresh />}
                onClick={onNewAnalysis}
                sx={{ py: 1.5 }}
              >
                New Analysis
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Results Content */}
        <Box sx={{ p: 3 }}>
          {/* Score Overview */}
          <Box mb={4}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp color="primary" />
              Performance Overview
            </Typography>
            <ScoreCard scores={analysis.scores} profile={profile} />
          </Box>

          {/* Suggestions Section */}
          <Box mb={4}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lightbulb color="primary" />
              Improvement Suggestions
            </Typography>
            
            <Grid container spacing={2}>
              {Object.entries(analysis.suggestions).map(([category, suggestions]) => {
                const IconComponent = getSuggestionIcon(category);
                
                return (
                  <Grid item xs={12} md={6} key={category}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="analysis-card" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <IconComponent color="primary" />
                            <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                              {category}
                            </Typography>
                          </Box>
                          
                          <List dense>
                            {suggestions.slice(0, 3).map((suggestion, index) => (
                              <ListItem key={index} disableGutters>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <ArrowForward fontSize="small" color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={suggestion}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    color: 'text.primary'
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                          
                          {suggestions.length > 3 && (
                            <Typography variant="caption" color="text.secondary">
                              +{suggestions.length - 3} more suggestions in report
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          {/* Keyword Analysis */}
          {analysis.keywords && (
            <Box mb={4}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VpnKey color="primary" />
                Keyword Analysis
              </Typography>
              
              <Card className="analysis-card">
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="h6" color="success.main" gutterBottom>
                        Keywords Found
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {analysis.keywords.present?.slice(0, 8).map((keyword, index) => (
                          <Chip
                            key={index}
                            label={keyword}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="h6" color="warning.main" gutterBottom>
                        Missing Keywords
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {analysis.keywords.missing?.slice(0, 8).map((keyword, index) => (
                          <Chip
                            key={index}
                            label={keyword}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="h6" color="info.main" gutterBottom>
                        Suggested Keywords
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {analysis.keywords.suggested?.slice(0, 8).map((keyword, index) => (
                          <Chip
                            key={index}
                            label={keyword}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Enhanced Content (if available) */}
          {analysis.rewritten && Object.keys(analysis.rewritten).length > 0 && (
            <Box mb={4}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Edit color="primary" />
                Enhanced Content Suggestions
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Below are AI-enhanced versions of your content. Review and adapt them to match your personal style and experiences.
                </Typography>
              </Alert>
              
              {Object.entries(analysis.rewritten).map(([section, content]) => (
                <Accordion key={section} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                      Enhanced {section}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {Array.isArray(content) ? (
                      content.map((item, index) => (
                        <Box key={index} mb={2}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {item.title} at {item.company}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {item.description}
                          </Typography>
                          {index < content.length - 1 && <Divider sx={{ my: 2 }} />}
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2">
                        {content}
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {/* Next Steps */}
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="primary" />
              Next Steps
            </Typography>
            
            <Card className="analysis-card">
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Download color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Download your detailed PDF report"
                      secondary="Get a comprehensive analysis with charts and visualizations"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <Edit color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Implement the suggested improvements"
                      secondary="Focus on the lowest-scoring areas first for maximum impact"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <VpnKey color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Optimize keywords for your target role"
                      secondary="Include the missing keywords relevant to your field"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <Refresh color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Re-analyze after improvements"
                      secondary="Track your progress with periodic analysis"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default Results;
