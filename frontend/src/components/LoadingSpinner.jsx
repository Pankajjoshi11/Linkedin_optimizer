import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  LinearProgress
} from '@mui/material';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ message = 'Loading...', progress = null }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 3,
          maxWidth: 400,
          mx: 'auto'
        }}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={3}
        >
          {/* Animated Logo/Icon */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <CircularProgress
              size={60}
              thickness={4}
              sx={{
                color: 'primary.main',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
            />
          </motion.div>

          {/* Message */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              {message}
            </Typography>
            
            {/* Progress bar if progress is provided */}
            {progress !== null && (
              <Box sx={{ width: 200, mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  {Math.round(progress)}% complete
                </Typography>
              </Box>
            )}
            
            {/* Loading steps */}
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary">
                This may take a few moments...
              </Typography>
            </Box>
          </Box>

          {/* Animated dots */}
          <Box display="flex" gap={0.5}>
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                  }}
                />
              </motion.div>
            ))}
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default LoadingSpinner;
