import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { LinkedIn, Description } from '@mui/icons-material';
import { motion } from 'framer-motion';

import ProfileForm from './components/ProfileForm';
import Results from './components/Results';
import './App.css';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Reset results when switching tabs
    setAnalysisResults(null);
  };

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
    setAnalysisResults(null);
  };

  const handleAnalysisComplete = (results) => {
    setIsAnalyzing(false);
    setAnalysisResults(results);
  };

  const handleAnalysisError = () => {
    setIsAnalyzing(false);
    setAnalysisResults(null);
  };

  return (
    <div className="App">
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
        <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }}>
          <LinkedIn sx={{ mr: 2, fontSize: { xs: '1.5rem', md: '1.75rem' } }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', md: '1.25rem' },
              fontWeight: 600
            }}
          >
            ProfilePolish
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              opacity: 0.8,
              display: { xs: 'none', sm: 'block' },
              fontSize: { sm: '0.875rem', md: '1rem' }
            }}
          >
            AI-Powered Profile Optimization
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Section */}
          <Box textAlign="center" mb={{ xs: 2, md: 4 }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3.75rem' },
                fontWeight: { xs: 600, md: 400 }
              }}
            >
              Optimize Your Professional Profile
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              paragraph
              sx={{ 
                fontSize: { xs: '1rem', md: '1.25rem' },
                px: { xs: 1, md: 0 }
              }}
            >
              Get AI-powered insights to improve your LinkedIn profile and resume.
            </Typography>
          </Box>

          {/* Analysis Section */}
          {!analysisResults ? (
            <Paper elevation={2} sx={{ borderRadius: { xs: 2, md: 3 }, overflow: 'hidden', mx: { xs: 0, sm: 1 } }}>
              {/* Tab Navigation */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  aria-label="analysis type tabs"
                  centered
                  variant="fullWidth"
                  sx={{
                    '& .MuiTab-root': {
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      minHeight: { xs: 56, md: 72 }
                    }
                  }}
                >
                  <Tab 
                    icon={<LinkedIn />} 
                    label="LinkedIn Profile" 
                    id="tab-0"
                    aria-controls="tabpanel-0"
                    sx={{ flexDirection: { xs: 'column', sm: 'row' } }}
                  />
                  <Tab 
                    icon={<Description />} 
                    label="Resume Upload" 
                    id="tab-1"
                    aria-controls="tabpanel-1"
                    sx={{ flexDirection: { xs: 'column', sm: 'row' } }}
                  />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <TabPanel value={tabValue} index={0}>
                <ProfileForm
                  type="linkedin"
                  onAnalysisStart={handleAnalysisStart}
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalysisError={handleAnalysisError}
                  isAnalyzing={isAnalyzing}
                />
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <ProfileForm
                  type="resume"
                  onAnalysisStart={handleAnalysisStart}
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalysisError={handleAnalysisError}
                  isAnalyzing={isAnalyzing}
                />
              </TabPanel>
            </Paper>
          ) : (
            /* Results Section */
            <Results 
              results={analysisResults}
              analysisType={tabValue === 0 ? 'linkedin' : 'resume'}
              onNewAnalysis={() => {
                setAnalysisResults(null);
                setIsAnalyzing(false);
              }}
            />
          )}
        </motion.div>
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: { xs: 2, md: 3 }, 
          px: 2, 
          mt: 'auto',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0'
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
          >
           © 2025 LinkedIn Profile Analyzer 
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            align="center" 
            display="block" 
            mt={1}
            sx={{ 
              fontSize: { xs: '0.7rem', md: '0.75rem' },
              px: { xs: 1, md: 0 }
            }}
          >
            ⚠️ This tool provides AI-generated suggestions. Please verify all recommendations for accuracy before use.
          </Typography>
        </Container>
      </Box>
    </div>
  );
}

export default App;