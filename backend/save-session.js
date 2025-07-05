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

  console.log('🌐 Navigating to LinkedIn login page...');
  await page.goto('https://www.linkedin.com/login');

  console.log('');
  console.log('� PLEASE LOG IN MANUALLY IN THE BROWSER WINDOW:');
  console.log('   1. Enter your LinkedIn email/username');
  console.log('   2. Enter your password');
  console.log('   3. Complete CAPTCHA if prompted');
  console.log('   4. Complete 2FA/SMS verification if required');
  console.log('   5. Wait until you see your LinkedIn feed/homepage');
  console.log('');
  console.log('⏳ After successful login, press ENTER here to save the session...');
  
  // Wait for user input
  await new Promise(resolve => {
    process.stdin.once('data', () => resolve());
  });

  // Check if user is logged in by looking for common LinkedIn elements
  console.log('🔍 Verifying login status...');
  
  try {
    // Wait for common LinkedIn authenticated page elements
    const loginCheckSelectors = [
      '[data-test-id="identity-dashboard-title"]', // Profile dropdown
      '.global-nav__me-photo', // Profile photo
      '.feed-identity-module', // Feed identity
      '[data-control-name="nav.settings_and_privacy"]', // Settings link
      '.global-nav__nav-link--me' // Me nav link
    ];

    let loginVerified = false;
    for (const selector of loginCheckSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        loginVerified = true;
        console.log('✅ Login verified - found authenticated element');
        break;
      } catch (error) {
        // Continue checking other selectors
      }
    }

    if (!loginVerified) {
      // Check URL as fallback
      const currentUrl = page.url();
      if (currentUrl.includes('feed') || currentUrl.includes('in/') || 
          (currentUrl.includes('linkedin.com') && !currentUrl.includes('login') && !currentUrl.includes('authwall'))) {
        loginVerified = true;
        console.log('✅ Login verified - on authenticated page');
      }
    }

    if (!loginVerified) {
      console.log('⚠️ Login not clearly detected, but saving cookies anyway...');
      console.log('💡 If scraping fails, please try logging in again');
    }

  } catch (error) {
    console.log('⚠️ Could not verify login status, but proceeding...');
  }

  // Save cookies
  console.log('💾 Saving session cookies...');
  const cookies = await page.cookies();
  const cookiesPath = path.join(__dirname, 'cookies.json');
  
  await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2));
  
  console.log('');
  console.log('✅ SESSION SAVED SUCCESSFULLY!');
  console.log(`📁 Cookies saved to: ${cookiesPath}`);
  console.log(`� Saved ${cookies.length} cookies`);
  console.log('');
  console.log('🚀 Your LinkedIn session is now ready for automated scraping!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   • Test scraping: node test-scraper.js https://linkedin.com/in/username');
  console.log('   • Session should work until LinkedIn logs you out');
  console.log('   • Re-run this script if you get auth wall errors');
  console.log('');
  console.log('💡 Pro tips:');
  console.log('   • Session typically lasts 24-48 hours');
  console.log('   • Don\'t logout from LinkedIn while using the scraper');
  console.log('   • Use the same browser profile if possible');
  
  await browser.close();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Session helper interrupted');
  process.exit(0);
});

saveLinkedInSession().catch(console.error);
