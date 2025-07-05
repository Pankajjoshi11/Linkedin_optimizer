import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Avatar
} from '@mui/material';
import {
  TrendingUp,
  Star,
  CheckCircle,
  Warning,
  Error
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

const ScoreCard = ({ scores, profile }) => {
  // Prepare data for charts
  const radarData = [
    { subject: 'Tone', score: scores.tone || 0, fullMark: 100 },
    { subject: 'Clarity', score: scores.clarity || 0, fullMark: 100 },
    { subject: 'Relevance', score: scores.relevance || 0, fullMark: 100 },
    { subject: 'Impact', score: scores.impact || 0, fullMark: 100 },
    { subject: 'Keywords', score: scores.keywords || 0, fullMark: 100 },
  ];

  const barData = [
    { name: 'Tone', score: scores.tone || 0 },
    { name: 'Clarity', score: scores.clarity || 0 },
    { name: 'Relevance', score: scores.relevance || 0 },
    { name: 'Impact', score: scores.impact || 0 },
    { name: 'Keywords', score: scores.keywords || 0 },
    { name: 'Completeness', score: scores.completeness || 0 },
  ];

  // Score interpretation
  const getScoreLevel = (score) => {
    if (score >= 80) return { level: 'Excellent', color: '#059669', icon: CheckCircle };
    if (score >= 65) return { level: 'Good', color: '#d97706', icon: TrendingUp };
    if (score >= 50) return { level: 'Fair', color: '#eab308', icon: Warning };
    return { level: 'Needs Improvement', color: '#dc2626', icon: Error };
  };

  const overallScore = scores.overall || 0;
  const overallLevel = getScoreLevel(overallScore);
  const OverallIcon = overallLevel.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Grid container spacing={3}>
        {/* Overall Score Card */}
        <Grid item xs={12} md={4}>
          <Card className="analysis-card" sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: overallLevel.color,
                  fontSize: '2rem'
                }}
              >
                {overallScore}
              </Avatar>
              
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {overallScore}/100
              </Typography>
              
              <Chip
                icon={<OverallIcon />}
                label={overallLevel.level}
                sx={{
                  bgcolor: overallLevel.color,
                  color: 'white',
                  fontWeight: 'medium',
                  mb: 2
                }}
              />
              
              <Typography variant="body2" color="text.secondary">
                Overall Profile Score
              </Typography>
              
              {/* Overall Progress */}
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={overallScore}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: overallLevel.color,
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Scores */}
        <Grid item xs={12} md={8}>
          <Card className="analysis-card" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Star color="primary" />
                Detailed Breakdown
              </Typography>
              
              <Grid container spacing={2}>
                {Object.entries(scores)
                  .filter(([key]) => key !== 'overall')
                  .map(([category, score], index) => {
                    const level = getScoreLevel(score);
                    const Icon = level.icon;
                    
                    return (
                      <Grid item xs={12} sm={6} key={category}>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <Box
                            sx={{
                              p: 2,
                              border: '1px solid',
                              borderColor: 'grey.200',
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                borderColor: level.color,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 12px ${level.color}20`,
                              },
                            }}
                          >
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                              <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                                {category}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Icon sx={{ fontSize: 16, color: level.color }} />
                                <Typography variant="body2" fontWeight="bold" sx={{ color: level.color }}>
                                  {score}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <LinearProgress
                              variant="determinate"
                              value={score}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  bgcolor: level.color,
                                },
                              }}
                            />
                          </Box>
                        </motion.div>
                      </Grid>
                    );
                  })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Radar Chart */}
        <Grid item xs={12} md={6}>
          <Card className="analysis-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Skills Radar
              </Typography>
              
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={false}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bar Chart */}
        <Grid item xs={12} md={6}>
          <Card className="analysis-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Score Comparison
              </Typography>
              
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={12}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Score']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar
                      dataKey="score"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12}>
          <Card className="analysis-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {scores.completeness || 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Profile Completeness
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="secondary" fontWeight="bold">
                      {Object.values(scores).filter(score => score >= 70).length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Strong Areas
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {Object.values(scores).filter(score => score < 50).length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Areas to Improve
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {profile?.skills?.length || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Skills Listed
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default ScoreCard;
