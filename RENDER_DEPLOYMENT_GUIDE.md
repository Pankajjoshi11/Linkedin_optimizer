# 🚀 Deploy LinkedIn Profile Analyzer to Render

## 📋 Pre-Deployment Checklist ✅

- ✅ Frontend built and moved to `backend/public/`
- ✅ Backend serves both API and React app
- ✅ `cookies.json` preserved for LinkedIn scraping
- ✅ All routes configured (`/api/*` for API, `/*` for React)
- ✅ Environment variables ready

## 🛠️ Step-by-Step Deployment Guide

### Step 1: Push Your Code to GitHub

1. **Initialize Git (if not already done):**
```bash
git init
git add .
git commit -m "LinkedIn Profile Analyzer ready for Render deployment"
```

2. **Create GitHub Repository:**
   - Go to https://github.com/new
   - Repository name: `linkedin-profile-analyzer`
   - Make it **Public** (or Private if you prefer)
   - Don't initialize with README (we already have files)
   - Click "Create repository"

3. **Push to GitHub:**
```bash
git remote add origin https://github.com/YOUR-USERNAME/linkedin-profile-analyzer.git
git branch -M main
git push -u origin main
```

### Step 2: Create Render Account & Deploy

1. **Sign up at Render:**
   - Go to https://render.com
   - Sign up with GitHub account (recommended)

2. **Create New Web Service:**
   - Click "New +" button
   - Select "Web Service"
   - Choose "Build and deploy from a Git repository"
   - Click "Next"

3. **Connect GitHub Repository:**
   - Select your `linkedin-profile-analyzer` repository
   - Click "Connect"

### Step 3: Configure Deployment Settings

**Basic Settings:**
- **Name:** `linkedin-profile-analyzer` (or your preferred name)
- **Region:** Choose closest to your users
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`

**Build & Deploy Settings:**
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Advanced Settings:**
- **Auto-Deploy:** Yes (recommended)

### Step 4: Set Environment Variables

In the "Environment" section, add these variables:

**Required Variables:**
```
NODE_ENV=production
PORT=10000
GEMINI_API_KEY=your_google_ai_api_key_here
```

**Optional Variables (if needed):**
```
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Step 5: Deploy!

1. Click "Create Web Service"
2. Wait for deployment (usually 5-10 minutes)
3. Your app will be available at: `https://your-app-name.onrender.com`

## 🔧 Important Notes

### About cookies.json:
- ✅ **Preserved** - Essential for LinkedIn scraping functionality
- ✅ **Secure** - Not exposed to frontend users
- ✅ **Backend only** - Used by scraping services

### File Structure After Deployment:
```
linkedin-profile-analyzer/
├── backend/ (deployed to Render)
│   ├── public/              ← React app
│   ├── cookies.json         ← LinkedIn cookies (important!)
│   ├── routes/              ← API routes
│   ├── services/            ← Scraping services
│   ├── server.js            ← Main server
│   └── package.json
└── frontend/ (source code, not deployed)
```

### Testing Your Deployment:

1. **Frontend Test:**
   - Visit `https://your-app-name.onrender.com`
   - Should load your React app

2. **API Test:**
   - Visit `https://your-app-name.onrender.com/api/health`
   - Should return: `{"status": "OK", "timestamp": "...", "environment": "production"}`

3. **Full Functionality Test:**
   - Try uploading a LinkedIn profile
   - Check if scraping and analysis work

## 🚨 Troubleshooting

**Common Issues:**

1. **Build Fails:**
   - Check if `package.json` has all dependencies
   - Verify `npm start` works locally

2. **Environment Variables:**
   - Make sure `GEMINI_API_KEY` is set
   - Check all variable names are correct

3. **Scraping Issues:**
   - `cookies.json` file should be present
   - Check if cookies are still valid

4. **Frontend Not Loading:**
   - Verify `backend/public/` has React build files
   - Check console for errors

## 🎉 Success!

Once deployed, your LinkedIn Profile Analyzer will be:
- ✅ **Live** at your Render URL
- ✅ **Fast** with optimized React build
- ✅ **Secure** with proper environment variables
- ✅ **Functional** with preserved scraping capabilities

## 📞 Support

If you encounter issues:
1. Check Render deployment logs
2. Verify environment variables are set
3. Test locally first: `cd backend && npm start`
4. Check if `cookies.json` is present and valid

Your LinkedIn Profile Analyzer is now production-ready! 🚀
