const config = {
  development: {
    API_BASE_URL: 'http://localhost:5000'
  },
  production: {
    // In production, frontend and backend are served from the same domain
    API_BASE_URL: ''
  }
};

export default config[process.env.NODE_ENV || 'development'];
