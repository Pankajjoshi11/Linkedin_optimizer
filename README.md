# LinkedIn Profile Analyzer

An AI-powered web application that analyzes LinkedIn profiles and resumes to provide insights, suggestions, and optimization recommendations using Google's Gemini AI.

## 🚀 Features

- **LinkedIn Profile Analysis**: Scrape and analyze public LinkedIn profiles
- **Resume Analysis**: Upload and analyze PDF resumes
- **AI-Powered Insights**: Uses Google Gemini for intelligent analysis
- **Comprehensive Scoring**: Multi-dimensional scoring system (tone, clarity, relevance, impact, keywords)
- **Visual Reports**: Interactive charts and professional PDF reports
- **Content Enhancement**: AI-generated improved versions of your content
- **Keyword Optimization**: Identify missing and suggested keywords
- **Tailored Resume Generation**: Create optimized resumes for specific roles
- **📱 Mobile Responsive**: Optimized for mobile devices and touch interfaces

## 📱 Quick Start (Mobile Access)

### Option 1: Use the Startup Script (Windows)
```bash
# Double-click start-mobile.bat or run:
start-mobile.bat
```

### Option 2: Manual Setup
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend (Mobile Access)
cd frontend
set HOST=0.0.0.0 ; npm start
```

**Access from Mobile**: 
1. Find your computer's IP address (`ipconfig` on Windows)
2. Open mobile browser: `http://YOUR_IP_ADDRESS:3000`

> 📖 **Detailed mobile setup instructions**: See [MOBILE_SETUP.md](./MOBILE_SETUP.md)

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **Google Gemini AI** for analysis
- **Puppeteer** for LinkedIn scraping
- **pdf-parse** for resume text extraction
- **PDFKit** for report generation
- **Chart.js** for data visualization

### Frontend
- **React 18** with modern hooks
- **Material-UI (MUI)** for design system
- **Recharts** for interactive charts
- **Framer Motion** for animations
- **React Hot Toast** for notifications

## 📁 Project Structure

```
linkedin-profile-analyzer/
├── backend/
│   ├── server.js                 # Express server entry point
│   ├── routes/                   # API routes
│   │   ├── profile.js           # LinkedIn profile routes
│   │   └── resume.js            # Resume analysis routes
│   ├── controllers/             # Route handlers
│   │   ├── profileController.js
│   │   └── resumeController.js
│   ├── services/                # Business logic
│   │   ├── linkedinScraper.js   # LinkedIn scraping service
│   │   ├── pdfParser.js         # PDF text extraction
│   │   ├── analyzer.js          # Gemini AI integration
│   │   └── reportGenerator.js   # PDF report generation
│   ├── middleware/              # Express middleware
│   │   └── validation.js        # Input validation
│   ├── utils/                   # Helper functions
│   │   └── helpers.js
│   └── uploads/                 # Temporary file storage
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.jsx              # Main application component
│       ├── components/          # React components
│       │   ├── ProfileForm.jsx  # Analysis form
│       │   ├── Results.jsx      # Results display
│       │   ├── ScoreCard.jsx    # Score visualization
│       │   └── LoadingSpinner.jsx
│       └── index.js             # React entry point
└── README.md
```

## 🛠 Troubleshooting

### LinkedIn Auth Wall Issues

If you encounter "LinkedIn auth wall detected" errors:

1. **Use Manual Session Login** (⭐ **RECOMMENDED**):
   ```bash
   cd backend
   node save-session.js
   ```
   This handles CAPTCHA and 2FA automatically and is the most reliable method.

2. **Use Non-Headless Mode**: The scraper is already configured with `headless: false`
3. **Check Profile Visibility**: Ensure the LinkedIn profile is set to public
4. **Wait Between Requests**: LinkedIn has rate limiting - wait 30-60 seconds between requests
5. **Try Different IP/VPN**: Some IPs may be blocked by LinkedIn

### Why Manual Login is Recommended

**CAPTCHA & 2FA Challenges**: LinkedIn often shows CAPTCHA or requires 2FA during automated login, especially for bot-like behavior. Manual login bypasses these challenges completely.

**Session Persistence**: Once you log in manually and save cookies, the session typically lasts 24-48 hours without needing re-authentication.

**Higher Success Rate**: Manual login + cookie reuse has a much higher success rate than automated login attempts.

### Automated Login Safety Guidelines

⚠️ **Automated login is NOT recommended** due to CAPTCHA/2FA challenges, but if you must use it:

- **Use a secondary LinkedIn account** - Never use your main professional account
- **Expect CAPTCHA failures** - LinkedIn actively blocks automated login attempts
- **Monitor your account** - Check for any unusual activity or warnings

### Common Error Messages

- **"Auth wall detected"**: LinkedIn is blocking automated access - try the solutions above
- **"Profile not found"**: Check if the URL is correct and the profile exists
- **"Failed to extract profile data"**: The profile may be private or have unusual formatting
- **"Navigation timeout"**: Network issues or LinkedIn is slow to respond

### PDF Analysis Issues

- **"No text extracted"**: The PDF may be image-based (scanned) - OCR not yet implemented
- **"Invalid file format"**: Only PDF files are supported
- **"File too large"**: Maximum file size is 5MB

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key

### Backend Setup

1. **Clone and navigate to backend**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   NODE_ENV=development
   GEMINI_API_KEY=your_gemini_api_key_here
   FRONTEND_URL=http://localhost:3000
   MAX_FILE_SIZE=5242880
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100
   ```

3. **Get Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env` file

4. **Start the backend server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend and install dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔑 API Endpoints

### Profile Analysis
- `POST /api/profile/analyze` - Analyze LinkedIn profile
- `POST /api/profile/report` - Generate PDF report
- `GET /api/profile/preview` - Get profile preview
- `POST /api/profile/validate-url` - Validate LinkedIn URL

### Resume Analysis
- `POST /api/resume/analyze` - Analyze uploaded resume
- `POST /api/resume/report` - Generate PDF report
- `POST /api/resume/tailored` - Generate tailored resume
- `POST /api/resume/validate-file` - Validate uploaded file

## 📊 Analysis Features

### Scoring System
- **Tone** (0-100): Professional language and confidence
- **Clarity** (0-100): Clear structure and communication
- **Relevance** (0-100): Match to target role/industry
- **Impact** (0-100): Quantifiable achievements and results
- **Keywords** (0-100): Industry-relevant terminology
- **Overall** (0-100): Weighted average of all scores

### AI-Powered Suggestions
- Content improvement recommendations
- Keyword optimization suggestions
- Professional tone enhancements
- Structure and formatting advice

### Visual Reports
- Interactive radar and bar charts
- Professional PDF reports
- Score breakdowns and trends
- Detailed suggestions and recommendations

## 🔐 Security Features

- Input validation and sanitization
- File type and size restrictions
- Rate limiting
- CORS protection
- Secure file handling
- Environment variable protection

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/Render)
1. Set environment variables
2. Deploy using Git or Docker
3. Ensure MongoDB/database connectivity

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `build` folder
3. Configure proxy settings for API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 Usage Examples

### LinkedIn Profile Analysis
```javascript
// Example API call
const response = await fetch('/api/profile/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://linkedin.com/in/username',
    targetRole: 'Software Engineer',
    analysisType: 'detailed'
  })
});
```

### Resume Upload Analysis
```javascript
// Example file upload
const formData = new FormData();
formData.append('resume', file);
formData.append('targetRole', 'Product Manager');
formData.append('analysisType', 'basic');

const response = await fetch('/api/resume/analyze', {
  method: 'POST',
  body: formData
});
```

## ⚠️ Important Notes

### LinkedIn Scraping Limitations

- **Auth Wall Issue**: LinkedIn shows an auth wall to bots and scrapers using Puppeteer or headless browsers, even for public profiles
- **Detection Methods**: LinkedIn uses bot detection, rate-limiting, and IP-based restrictions
- **Redirect Behavior**: Non-authenticated users are redirected to `https://www.linkedin.com/authwall`

### Workarounds Implemented

1. **Headless Browser Spoofing**: Using `headless: false` with user agent spoofing
2. **Anti-Detection Measures**: Disabled automation flags and set realistic browser headers
3. **Session Management**: Support for logged-in session cookies for better stability

### General Notes

- LinkedIn profiles must be public for scraping (but auth wall may still appear)
- Uploaded files are automatically deleted after processing
- AI suggestions should be reviewed for accuracy
- Rate limits apply to prevent abuse
- API keys should be kept secure
- LinkedIn scraping may require manual intervention for auth wall bypass

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent analysis
- Material-UI for the design system
- React community for excellent libraries
- LinkedIn for profile data structure insights

## 📞 Support

For support, email support@linkedinanalyzer.com or create an issue in the repository.

---

**Built with ❤️ using React, Node.js, and Google Gemini AI**
