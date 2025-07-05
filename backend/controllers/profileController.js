const { scrapeLinkedInProfile } = require('../services/linkedinScraper');
const { analyzeWithGemini } = require('../services/analyzer');
const { generatePDFReport } = require('../services/reportGenerator');
const { createSuccessResponse, createErrorResponse } = require('../utils/helpers');

class ProfileController {
  async analyzeProfile(req, res) {
    try {
      const { url, targetRole = '', analysisType = 'basic' } = req.validatedData;
      
      console.log(`Starting profile analysis for: ${url}`);
      
      // Step 1: Scrape LinkedIn profile
      console.log('Scraping LinkedIn profile...');
      const profileData = await scrapeLinkedInProfile(url);
      
      if (!profileData || !profileData.name) {
        const { response, statusCode } = createErrorResponse(
          'Failed to extract profile data',
          'Could not find valid profile information from the provided URL'
        );
        return res.status(statusCode).json(response);
      }
      
      console.log(`Profile scraped successfully for: ${profileData.name}`);
      
      // Step 2: Analyze with Gemini
      console.log('Analyzing profile with AI...');
      const analysisData = await analyzeWithGemini(profileData, targetRole, analysisType);
      
      console.log('Analysis completed successfully');
      
      // Step 3: Prepare response
      const responseData = {
        profile: profileData,
        analysis: analysisData,
        metadata: {
          url: url,
          analyzedAt: new Date().toISOString(),
          targetRole: targetRole,
          analysisType: analysisType
        }
      };
      
      const successResponse = createSuccessResponse(
        responseData,
        'Profile analyzed successfully'
      );
      
      res.json(successResponse);
      
    } catch (error) {
      console.error('Error in analyzeProfile:', error);
      
      const { response, statusCode } = createErrorResponse(
        'Profile analysis failed',
        error.message
      );
      
      res.status(statusCode).json(response);
    }
  }

  async generateReport(req, res) {
    try {
      const { 
        profileData, 
        analysisData, 
        format = 'pdf',
        includeCharts = true,
        includeRewritten = true 
      } = req.body;
      
      if (!profileData || !analysisData) {
        const { response, statusCode } = createErrorResponse(
          'Missing required data',
          'Profile data and analysis data are required for report generation',
          400
        );
        return res.status(statusCode).json(response);
      }
      
      console.log('Generating PDF report...');
      
      // Generate PDF report
      const pdfDoc = await generatePDFReport(analysisData, profileData, {
        includeCharts,
        includeRewritten,
        format: 'detailed'
      });
      
      // Set response headers for PDF download
      const filename = `linkedin-analysis-${profileData.name || 'profile'}-${Date.now()}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Pipe PDF to response
      pdfDoc.pipe(res);
      pdfDoc.end();
      
      console.log('PDF report generated and sent successfully');
      
    } catch (error) {
      console.error('Error in generateReport:', error);
      
      const { response, statusCode } = createErrorResponse(
        'Report generation failed',
        error.message
      );
      
      res.status(statusCode).json(response);
    }
  }

  async getProfilePreview(req, res) {
    try {
      const { url } = req.query;
      
      if (!url) {
        const { response, statusCode } = createErrorResponse(
          'URL is required',
          'Please provide a LinkedIn profile URL',
          400
        );
        return res.status(statusCode).json(response);
      }
      
      console.log(`Getting profile preview for: ${url}`);
      
      // Quick scrape for basic info only
      const profileData = await scrapeLinkedInProfile(url);
      
      if (!profileData) {
        const { response, statusCode } = createErrorResponse(
          'Failed to fetch profile preview',
          'Could not access the provided LinkedIn URL'
        );
        return res.status(statusCode).json(response);
      }
      
      // Return only basic info for preview
      const previewData = {
        name: profileData.name,
        headline: profileData.headline,
        location: profileData.location,
        hasExperience: Array.isArray(profileData.experience) && profileData.experience.length > 0,
        hasEducation: Array.isArray(profileData.education) && profileData.education.length > 0,
        skillsCount: Array.isArray(profileData.skills) ? profileData.skills.length : 0
      };
      
      const successResponse = createSuccessResponse(
        previewData,
        'Profile preview fetched successfully'
      );
      
      res.json(successResponse);
      
    } catch (error) {
      console.error('Error in getProfilePreview:', error);
      
      const { response, statusCode } = createErrorResponse(
        'Failed to fetch profile preview',
        error.message
      );
      
      res.status(statusCode).json(response);
    }
  }

  async validateUrl(req, res) {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.json({
          valid: false,
          message: 'URL is required'
        });
      }
      
      // Basic LinkedIn URL validation
      const linkedinUrlPattern = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
      const isValid = linkedinUrlPattern.test(url);
      
      res.json({
        valid: isValid,
        message: isValid ? 'Valid LinkedIn profile URL' : 'Please provide a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)',
        url: url
      });
      
    } catch (error) {
      console.error('Error in validateUrl:', error);
      res.json({
        valid: false,
        message: 'Error validating URL'
      });
    }
  }

  async getAnalysisStatus(req, res) {
    try {
      // This could be enhanced with a job queue system for long-running analyses
      res.json({
        status: 'ready',
        message: 'Analysis service is available',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error in getAnalysisStatus:', error);
      
      const { response, statusCode } = createErrorResponse(
        'Failed to get analysis status',
        error.message
      );
      
      res.status(statusCode).json(response);
    }
  }
}

module.exports = new ProfileController();
