#!/usr/bin/env node

/**
 * LinkedIn Session Helper
 * Use this to manually log in and save session cookies for later use
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function saveLinkedInSession() {
  console.log('🔐 LinkedIn Session Helper');
  console.log('==========================');
  console.log('');
  console.log('💡 This is the RECOMMENDED method for LinkedIn authentication');
  console.log('✅ Handles CAPTCHA and 2FA challenges automatically');
  console.log('✅ More reliable than automated login');
  console.log('✅ Session persists across multiple scraping runs');
  console.log('');
  console.log('🚀 Opening LinkedIn login page...');

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ]
  });

  const page = await browser.newPage();

  // Anti-detection measures
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
  
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
    delete window.navigator.webdriver;
  });

  try {
    console.log('🌐 Navigating to LinkedIn login page...');
    await page.goto('https://www.linkedin.com/login', {
      waitUntil: 'networkidle2', // Wait until network is mostly idle
      timeout: 30000 // 30-second timeout
    });

    console.log('');
    console.log('👤 PLEASE LOG IN MANUALLY IN THE BROWSER WINDOW:');
    console.log('   1. Enter your LinkedIn email/username');
    console.log('   2. Enter your password');
    console.log('   3. Complete CAPTCHA if prompted');
    console.log('   4. Complete 2FA/SMS verification if required');
    console.log('   5. Wait until you see your LinkedIn feed/homepage');
    console.log('');
    console.log('⏳ After successful login, press ENTER here to save the session...');
    
    // Wait for user input
    await new Promise(resolve => process.stdin.once('data', () => resolve()));

    // Wait for potential post-login redirects
    try {
      await page.waitForNavigation({ wait: 'networkidle2', timeout: 15000 });
      console.log('✅ Navigation completed after login');
    } catch (navError) {
      console.log('ℹ️ No navigation occurred after login, proceeding...');
    }

    // Check login status
    console.log('🔍 Verifying login status...');
    const loginCheckSelectors = [
      '[data-test-id="identity-dashboard-title"]',
      '.global-nav__me-photo',
      '.feed-identity-module',
      '[data-control-name="nav.settings_and_privacy"]',
      '.global-nav__nav-link--me'
    ];

    let loginVerified = false;
    for (const selector of loginCheckSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 }); // Increased timeout
        loginVerified = true;
        console.log('✅ Login verified - found authenticated element:', selector);
        break;
      } catch (error) {
        // Continue checking other selectors
      }
    }

    if (!loginVerified) {
      const currentUrl = await page.url();
      if (currentUrl.includes('feed') || currentUrl.includes('in/') || 
          (currentUrl.includes('linkedin.com') && !currentUrl.includes('login') && !currentUrl.includes('authwall'))) {
        loginVerified = true;
        console.log('✅ Login verified - on authenticated page:', currentUrl);
      } else {
        console.warn('⚠️ Login not clearly detected. Current URL:', currentUrl);
        console.log('ℹ️ Saving cookies anyway, but scraping may fail if login was unsuccessful.');
      }
    }

    // Save cookies
    console.log('💾 Saving session cookies...');
    const cookies = await page.cookies();
    if (!cookies || cookies.length === 0) {
      throw new Error('No cookies retrieved. Ensure you are logged in.');
    }

    const cookiesPath = path.join(__dirname, '../data/cookies.json'); // Save to data/ directory
    await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2));
    
    console.log('');
    console.log('✅ SESSION SAVED SUCCESSFULLY!');
    console.log(`📁 Cookies saved to: ${cookiesPath}`);
    console.log(`🍪 Saved ${cookies.length} cookies`);
    console.log('');
    console.log('🚀 Your LinkedIn session is now ready for automated scraping!');
    console.log('📋 Next steps:');
    console.log('   • Test scraping via the Streamlit frontend (http://localhost:8501)');
    console.log('   • Or use: curl -X POST http://localhost:3000/api/linkedin/scrape -d \'{"url":"https://linkedin.com/in/username"}\'');
    console.log('   • Re-run this script if you get auth wall errors');
    console.log('');
    console.log('💡 Pro tips:');
    console.log('   • Session typically lasts 24-48 hours');
    console.log('   • Don\'t logout from LinkedIn while using the scraper');
    console.log('   • Use the same browser profile if possible');

  } catch (error) {
    console.error('❌ Error saving session:', error.message);
    console.log('ℹ️ Please try again and ensure you log in successfully.');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n👋 Session helper interrupted');
  process.exit(0);
});

saveLinkedInSession().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});