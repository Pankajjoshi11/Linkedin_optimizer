@echo off
echo ===============================================
echo    LinkedIn Profile Analyzer - Vercel Deploy
echo ===============================================
echo.

echo Step 1: Installing Vercel CLI (if not already installed)...
npm install -g vercel
echo.

echo Step 2: Building the frontend...
cd frontend
call npm run build
echo.

echo Step 3: Copying build files to backend/public...
xcopy /E /Y build\* ..\backend\public\
cd ..
echo.

echo Step 4: Deploying to Vercel...
vercel --prod
echo.

echo ===============================================
echo    Deployment Complete!
echo ===============================================
echo.
echo Your app will be available at the URL shown above.
echo.
echo To set environment variables:
echo 1. Go to your Vercel dashboard
echo 2. Select your project
echo 3. Go to Settings > Environment Variables
echo 4. Add: GEMINI_API_KEY
echo.
pause
