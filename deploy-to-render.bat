@echo off
echo 🚀 LinkedIn Profile Analyzer - Render Deployment Helper
echo.
echo This script will help you prepare for Render deployment.
echo.

echo ✅ Checking project structure...
if exist "backend\public\index.html" (
    echo ✅ Frontend build found in backend/public/
) else (
    echo ❌ Frontend build not found! Please run: cd frontend && npm run build
    echo    Then copy build files to backend/public/
    pause
    exit /b 1
)

if exist "backend\cookies.json" (
    echo ✅ cookies.json found (important for LinkedIn scraping)
) else (
    echo ⚠️  cookies.json not found - LinkedIn scraping may not work
)

if exist "backend\server.js" (
    echo ✅ Server file found
) else (
    echo ❌ Server file not found!
    pause
    exit /b 1
)

echo.
echo 📋 Ready for deployment! Next steps:
echo.
echo 1. Push to GitHub:
echo    git add .
echo    git commit -m "Ready for Render deployment"
echo    git push origin main
echo.
echo 2. Deploy on Render:
echo    - Go to https://render.com
echo    - New Web Service
echo    - Connect your GitHub repo
echo    - Root Directory: backend
echo    - Build Command: npm install
echo    - Start Command: npm start
echo    - Add Environment Variables:
echo      NODE_ENV=production
echo      GEMINI_API_KEY=your_api_key_here
echo.
echo 3. Your app will be live at: https://your-app-name.onrender.com
echo.
echo 🎉 LinkedIn Profile Analyzer ready for production!
echo.
pause
