# LinkedIn Profile Analyzer - Vercel Deployment Guide

## Why Vercel?
- **Faster deployments**: Much quicker than Render
- **Excellent Node.js support**: Built-in support for serverless functions
- **Global CDN**: Fast static file serving
- **Zero configuration**: Works out of the box for most projects
- **Great developer experience**: Easy to set up and manage

## Prerequisites
1. GitHub account with your project repository
2. Vercel account (sign up at https://vercel.com)
3. Node.js installed locally

## Quick Deploy Options

### Option 1: Automated Script (Recommended)
```bash
# Run the deployment script
deploy-to-vercel.bat
```

### Option 2: Manual Deployment via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Copy build files**
   ```bash
   # Copy frontend build to backend/public
   xcopy /E /Y build\* ..\backend\public\
   cd ..
   ```

4. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

### Option 3: Git-based Deployment (Easiest)

1. **Connect to Vercel Dashboard**
   - Go to https://vercel.com
   - Sign in with GitHub
   - Click "New Project"
   - Import your `linkedin-profile-analyzer` repository

2. **Configure Build Settings**
   - Build Command: `cd frontend && npm run build && xcopy /E /Y build\\* ..\\backend\\public\\`
   - Output Directory: `backend`
   - Install Command: `cd backend && npm install`

3. **Set Environment Variables**
   - In Vercel dashboard, go to Project Settings > Environment Variables
   - Add: `GEMINI_API_KEY` with your Google Gemini API key

## Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/backend/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "backend/server.js": {
      "maxDuration": 30
    }
  }
}
```

## Environment Variables Required

In your Vercel project settings, add:
- `GEMINI_API_KEY`: Your Google Gemini API key

## Post-Deployment

1. **Test the deployment**
   - Visit your Vercel URL
   - Test profile analysis functionality
   - Test resume upload and parsing

2. **Monitor performance**
   - Check Vercel dashboard for function logs
   - Monitor response times and errors

## Advantages of Vercel over Render

1. **Speed**: 
   - Deploy in seconds vs minutes
   - No container builds required
   - Instant rollbacks

2. **Performance**:
   - Global edge network
   - Automatic optimization
   - Built-in caching

3. **Developer Experience**:
   - Better logging and monitoring
   - Git-based deployments
   - Preview deployments for PRs

4. **Cost**:
   - Generous free tier
   - Pay-as-you-go pricing
   - No idle timeout issues

## Troubleshooting

### Common Issues:

1. **Build fails**: 
   - Check that all dependencies are in package.json
   - Ensure build commands are correct

2. **Functions timeout**:
   - Increase maxDuration in vercel.json
   - Optimize PDF parsing for large files

3. **Static files not serving**:
   - Verify frontend build is in backend/public
   - Check route configuration in vercel.json

4. **API not working**:
   - Verify environment variables are set
   - Check function logs in Vercel dashboard

## Next Steps

1. Run the deployment script or follow manual steps
2. Set up environment variables in Vercel dashboard
3. Test the deployed application
4. Set up custom domain (optional)
5. Enable analytics and monitoring

Your application will be live in minutes instead of the 30-60 minutes Render typically takes!
