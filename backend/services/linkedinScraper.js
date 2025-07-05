const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { retryWithBackoff } = require('../utils/helpers');

class LinkedInScraper {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: false, // Must be false to bypass auth wall
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-features=VizDisplayCompositor',
          '--disable-blink-features=AutomationControlled',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--start-maximized'
        ]
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeProfile(linkedinUrl) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Enhanced anti-detection measures
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
      
      await page.setExtraHTTPHeaders({
        'accept-language': 'en-US,en;q=0.9',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-encoding': 'gzip, deflate, br',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1'
      });

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
        
        // Remove automation indicators
        delete window.navigator.webdriver;
        
        // Override the plugins property to mimic a real browser
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // Override the languages property
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
        
        // Mock chrome object
        window.chrome = {
          runtime: {}
        };
        
        // Mock permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Meteor.isClient ? 'granted' : 'default' }) :
            originalQuery(parameters)
        );
      });

      // Set realistic user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Set viewport
      await page.setViewport({ width: 1366, height: 768 });

      // Add extra headers to look more like a real browser
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });

      console.log(`Navigating to: ${linkedinUrl}`);

      // STEP 1: Try to load existing session cookies (RECOMMENDED approach)
      console.log('🔍 Checking for saved session cookies...');
      const cookiesLoaded = await this.loadSessionCookies(page);
      
      if (cookiesLoaded) {
        console.log('✅ Session cookies loaded - proceeding with authenticated session');
      } else {
        console.log('❌ No session cookies found');
        
        // STEP 2: Try automated login only if explicitly enabled (NOT RECOMMENDED due to CAPTCHA/2FA)
        if (process.env.LINKEDIN_AUTO_LOGIN === 'true') {
          console.log('⚠️ Attempting automated login (may fail due to CAPTCHA/2FA)...');
          const loginSuccess = await this.performAutomatedLogin(page);
          
          if (!loginSuccess) {
            console.warn('❌ Automated login failed');
            console.log('💡 RECOMMENDED: Run "node save-session.js" for manual login');
          }
        } else {
          console.log('💡 For better success rate, run "node save-session.js" to save an authenticated session');
        }
      }

      // Add human-like delay before navigating to profile
      await this.humanLikeDelay();

      // Navigate to the LinkedIn profile with retry mechanism
      try {
        await page.goto(linkedinUrl, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
      } catch (navigationError) {
        console.warn('Navigation timeout, trying with domcontentloaded...');
        await page.goto(linkedinUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 20000 
        });
      }

      // Simulate human behavior on the profile page
      await this.simulateHumanBehavior(page);

      // Wait for content to load and check for LinkedIn login wall
      await page.waitForTimeout(3000);

      // Check for auth wall using our enhanced detection
      const hasAuthWall = await this.checkForAuthWall(page);
      if (hasAuthWall) {
        throw new Error('LinkedIn auth wall detected. The profile may be private or LinkedIn is blocking automated access. Try using headless: false or a logged-in session.');
      }

      // Legacy auth wall detection for backwards compatibility
      const pageTitle = await page.title();
      const currentUrl = page.url();
      
      console.log(`Page title: ${pageTitle}`);
      console.log(`Current URL: ${currentUrl}`);

      if (pageTitle.includes('Sign In') || pageTitle.includes('Join LinkedIn') || currentUrl.includes('authwall')) {
        throw new Error('Profile requires authentication - LinkedIn auth wall detected. Try again later or use a logged-in session.');
      }

      // Try to detect if profile is not found
      const content = await page.content();
      if (content.includes('Page not found') || content.includes('This profile was not found')) {
        throw new Error('LinkedIn profile not found - please check the URL');
      }

      // Get page content
      const $ = cheerio.load(content);

      // Enhanced profile data extraction with fallbacks
      const profileData = this.extractProfileData($);

      // Validate that we got meaningful data
      if (!profileData.name && !profileData.headline) {
        console.log('No profile data found, page content sample:', content.substring(0, 500));
        throw new Error('Unable to extract profile data - the profile may be private or the page structure has changed');
      }

      console.log(`Successfully extracted profile for: ${profileData.name}`);
      return profileData;

    } catch (error) {
      console.error('Error scraping LinkedIn profile:', error);
      throw new Error(`Failed to scrape LinkedIn profile: ${error.message}`);
    }
  }

  async performAutomatedLogin(page) {
    try {
      const email = process.env.LINKEDIN_EMAIL;
      const password = process.env.LINKEDIN_PASSWORD;
      const autoLogin = process.env.LINKEDIN_AUTO_LOGIN === 'true';

      if (!autoLogin || !email || !password) {
        console.log('⚠️ Automated login disabled or credentials not provided');
        console.log('💡 Recommended: Use manual login with cookies (node save-session.js)');
        return false;
      }

      console.log('🔐 Attempting automated LinkedIn login...');
      console.log('⚠️ Warning: May trigger CAPTCHA or 2FA challenges');
      
      // Navigate to login page
      await page.goto('https://www.linkedin.com/login', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for login form to be visible
      await page.waitForSelector('#username', { timeout: 10000 });
      await page.waitForSelector('#password', { timeout: 10000 });

      // Add human-like delays
      await page.waitForTimeout(1000 + Math.random() * 2000);

      // Type email with human-like typing speed
      await page.type('#username', email, { delay: 100 + Math.random() * 50 });
      await page.waitForTimeout(500 + Math.random() * 1000);

      // Type password with human-like typing speed  
      await page.type('#password', password, { delay: 100 + Math.random() * 50 });
      await page.waitForTimeout(500 + Math.random() * 1000);

      // Click login button
      await page.click('button[type="submit"]');

      // Wait a bit for potential redirects
      await page.waitForTimeout(3000);

      // Check for CAPTCHA or 2FA challenges
      const hasCaptcha = await this.checkForCaptcha(page);
      const has2FA = await this.checkFor2FA(page);

      if (hasCaptcha) {
        console.log('🤖 CAPTCHA detected - automated login cannot proceed');
        console.log('💡 Please use manual login: node save-session.js');
        return false;
      }

      if (has2FA) {
        console.log('🔐 2FA challenge detected - automated login cannot proceed');
        console.log('💡 Please use manual login: node save-session.js');
        return false;
      }

      // Wait for navigation after login
      try {
        await page.waitForNavigation({ 
          waitUntil: 'networkidle2',
          timeout: 15000 
        });
      } catch (navError) {
        console.log('Navigation timeout after login, checking current state...');
      }

      // Check if login was successful
      const currentUrl = page.url();
      if (currentUrl.includes('feed') || currentUrl.includes('in/') || 
          (currentUrl.includes('linkedin.com') && !currentUrl.includes('login'))) {
        console.log('✅ Automated login successful!');
        
        // Save the session cookies
        await this.saveSessionCookies(page);
        
        return true;
      } else {
        console.warn('⚠️ Login may have failed, current URL:', currentUrl);
        console.log('💡 Consider using manual login for better reliability');
        return false;
      }

    } catch (error) {
      console.error('❌ Automated login failed:', error.message);
      console.log('💡 Recommendation: Use manual login (node save-session.js) to avoid CAPTCHA/2FA issues');
      return false;
    }
  }

  async checkForCaptcha(page) {
    try {
      const captchaSelectors = [
        '.recaptcha-checkbox',
        '#recaptcha',
        '[data-test-id="captcha"]',
        '.captcha',
        'iframe[src*="recaptcha"]',
        '[id*="captcha"]',
        '[class*="captcha"]'
      ];

      for (const selector of captchaSelectors) {
        const element = await page.$(selector);
        if (element) {
          console.log('🤖 CAPTCHA element detected:', selector);
          return true;
        }
      }

      // Check page content for CAPTCHA-related text
      const content = await page.content();
      const captchaKeywords = ['captcha', 'recaptcha', 'verify you are human', 'security check'];
      
      for (const keyword of captchaKeywords) {
        if (content.toLowerCase().includes(keyword)) {
          console.log('🤖 CAPTCHA keyword detected:', keyword);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking for CAPTCHA:', error);
      return false;
    }
  }

  async checkFor2FA(page) {
    try {
      const twoFASelectors = [
        '[data-test-id="two-factor-auth"]',
        '.two-factor',
        '#two-step-verification',
        '[id*="verification-code"]',
        '[id*="security-code"]',
        'input[placeholder*="verification"]',
        'input[placeholder*="code"]'
      ];

      for (const selector of twoFASelectors) {
        const element = await page.$(selector);
        if (element) {
          console.log('🔐 2FA element detected:', selector);
          return true;
        }
      }

      // Check page content for 2FA-related text
      const content = await page.content();
      const twoFAKeywords = [
        'two-factor', 'verification code', 'security code', 
        'enter the code', 'check your phone', 'authenticator'
      ];
      
      for (const keyword of twoFAKeywords) {
        if (content.toLowerCase().includes(keyword)) {
          console.log('🔐 2FA keyword detected:', keyword);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking for 2FA:', error);
      return false;
    }
  }

  async humanLikeDelay() {
    // Add random delays to mimic human behavior
    const delay = 2000 + Math.random() * 3000; // 2-5 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async simulateHumanBehavior(page) {
    try {
      // Simulate human scrolling
      await page.evaluate(() => {
        window.scrollBy(0, Math.random() * 500);
      });
      
      await page.waitForTimeout(1000 + Math.random() * 2000);
      
      // Random mouse movement (simulate hovering)
      const viewport = await page.viewport();
      await page.mouse.move(
        Math.random() * viewport.width,
        Math.random() * viewport.height
      );
      
    } catch (error) {
      console.log('Human behavior simulation failed:', error.message);
    }
  }

  async checkForAuthWall(page) {
    try {
      // Check if we're on the auth wall page
      const currentUrl = page.url();
      if (currentUrl.includes('authwall') || currentUrl.includes('login')) {
        console.warn('Auth wall detected:', currentUrl);
        return true;
      }

      // Check for auth wall elements
      const authWallSelectors = [
        '[data-test-id="guest-homepage-basic-join-flow"]',
        '.authwall',
        '.guest-homepage',
        'button[data-tracking-control-name="guest-homepage-basic-join-flow-submit"]'
      ];

      for (const selector of authWallSelectors) {
        const element = await page.$(selector);
        if (element) {
          console.warn('Auth wall element found:', selector);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking for auth wall:', error);
      return false;
    }
  }

  async loadSessionCookies(page) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const cookiesPath = path.join(__dirname, '../cookies.json');
      
      try {
        const cookiesData = await fs.readFile(cookiesPath, 'utf8');
        const cookies = JSON.parse(cookiesData);
        await page.setCookie(...cookies);
        console.log('Session cookies loaded successfully');
        return true;
      } catch (fileError) {
        console.log('No session cookies found, continuing without authentication');
        return false;
      }
    } catch (error) {
      console.error('Error loading session cookies:', error);
      return false;
    }
  }

  async saveSessionCookies(page) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const cookiesPath = path.join(__dirname, '../cookies.json');
      
      const cookies = await page.cookies();
      await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2));
      console.log('Session cookies saved successfully');
    } catch (error) {
      console.error('Error saving session cookies:', error);
    }
  }

  extractProfileData($) {
    const profile = {
      name: '',
      headline: '',
      summary: '',
      location: '',
      experience: [],
      education: [],
      skills: [],
      languages: [],
      certifications: []
    };

    try {
      // Extract name
      profile.name = this.extractName($);

      // Extract headline
      profile.headline = this.extractHeadline($);

      // Extract summary/about
      profile.summary = this.extractSummary($);

      // Extract location
      profile.location = this.extractLocation($);

      // Extract experience
      profile.experience = this.extractExperience($);

      // Extract education
      profile.education = this.extractEducation($);

      // Extract skills
      profile.skills = this.extractSkills($);

      // Extract languages
      profile.languages = this.extractLanguages($);

      // Extract certifications
      profile.certifications = this.extractCertifications($);

    } catch (error) {
      console.error('Error extracting profile data:', error);
    }

    return profile;
  }

  extractName($) {
    const selectors = [
      'h1.text-heading-xlarge',
      '.pv-text-details__left-panel h1',
      '.mt2.relative h1',
      '[data-anonymize="person-name"]'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        return element.text().trim();
      }
    }

    return '';
  }

  extractHeadline($) {
    const selectors = [
      '.text-body-medium.break-words',
      '.pv-text-details__left-panel .text-body-medium',
      '.mt1.text-body-medium'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        return element.text().trim();
      }
    }

    return '';
  }

  extractSummary($) {
    const selectors = [
      '#about .pv-shared-text-with-see-more .inline-show-more-text span[aria-hidden="true"]',
      '.pv-about-section .pv-about__summary-text .inline-show-more-text',
      '[data-section="summary"] .pv-shared-text-with-see-more'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        return element.text().trim();
      }
    }

    return '';
  }

  extractLocation($) {
    const selectors = [
      '.text-body-small.inline.t-black--light.break-words',
      '.pv-text-details__left-panel .text-body-small',
      '.mt1.text-body-small'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      const text = element.text().trim();
      if (text && !text.includes('Contact info')) {
        return text;
      }
    }

    return '';
  }

  extractExperience($) {
    const experiences = [];
    const experienceSection = $('#experience').parent();

    experienceSection.find('li').each((i, elem) => {
      const $elem = $(elem);
      
      const title = $elem.find('.mr1.t-bold span[aria-hidden="true"]').text().trim();
      const company = $elem.find('.t-14.t-normal span[aria-hidden="true"]').first().text().trim();
      const duration = $elem.find('.t-14.t-normal.t-black--light span[aria-hidden="true"]').text().trim();
      const description = $elem.find('.pv-shared-text-with-see-more span[aria-hidden="true"]').text().trim();

      if (title && company) {
        experiences.push({
          title,
          company,
          duration,
          description
        });
      }
    });

    return experiences;
  }

  extractEducation($) {
    const educations = [];
    const educationSection = $('#education').parent();

    educationSection.find('li').each((i, elem) => {
      const $elem = $(elem);
      
      const school = $elem.find('.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]').text().trim();
      const degree = $elem.find('.t-14.t-normal span[aria-hidden="true"]').first().text().trim();
      const year = $elem.find('.t-14.t-normal.t-black--light span[aria-hidden="true"]').text().trim();

      if (school) {
        educations.push({
          school,
          degree,
          year
        });
      }
    });

    return educations;
  }

  extractSkills($) {
    const skills = [];
    const skillsSection = $('#skills').parent();

    skillsSection.find('.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]').each((i, elem) => {
      const skill = $(elem).text().trim();
      if (skill && !skills.includes(skill)) {
        skills.push(skill);
      }
    });

    return skills;
  }

  extractLanguages($) {
    const languages = [];
    const languagesSection = $('#languages').parent();

    languagesSection.find('li').each((i, elem) => {
      const $elem = $(elem);
      const language = $elem.find('.mr1.t-bold span[aria-hidden="true"]').text().trim();
      const proficiency = $elem.find('.t-14.t-normal span[aria-hidden="true"]').text().trim();

      if (language) {
        languages.push({
          language,
          proficiency
        });
      }
    });

    return languages;
  }

  extractCertifications($) {
    const certifications = [];
    const certSection = $('#licenses_and_certifications').parent();

    certSection.find('li').each((i, elem) => {
      const $elem = $(elem);
      const name = $elem.find('.mr1.t-bold span[aria-hidden="true"]').text().trim();
      const issuer = $elem.find('.t-14.t-normal span[aria-hidden="true"]').first().text().trim();
      const date = $elem.find('.t-14.t-normal.t-black--light span[aria-hidden="true"]').text().trim();

      if (name && issuer) {
        certifications.push({
          name,
          issuer,
          date
        });
      }
    });

    return certifications;
  }
}

const scrapeLinkedInProfile = async (url) => {
  const scraper = new LinkedInScraper();
  
  try {
    return await retryWithBackoff(
      () => scraper.scrapeProfile(url),
      3,
      2000
    );
  } finally {
    await scraper.closeBrowser();
  }
};

module.exports = {
  LinkedInScraper,
  scrapeLinkedInProfile
};
