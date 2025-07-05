const { GoogleGenerativeAI } = require('@google/generative-ai');
const { calculateCompleteness } = require('../utils/helpers');

class GeminiAnalyzer {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeProfile(profileData, targetRole = '', analysisType = 'basic') {
    try {
      const analysis = {
        scores: {},
        suggestions: {},
        keywords: {},
        rewritten: {},
        metadata: {
          analyzedAt: new Date().toISOString(),
          targetRole: targetRole,
          analysisType: analysisType
        }
      };

      // Calculate basic scores
      analysis.scores = await this.calculateScores(profileData, targetRole);
      
      // Generate suggestions
      analysis.suggestions = await this.generateSuggestions(profileData, targetRole, analysisType);
      
      // Keyword analysis
      analysis.keywords = await this.analyzeKeywords(profileData, targetRole);
      
      // Content rewriting (for detailed analysis)
      if (analysisType === 'detailed') {
        analysis.rewritten = await this.rewriteContent(profileData, targetRole);
      }

      return analysis;

    } catch (error) {
      console.error('Error analyzing profile:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  async calculateScores(profileData, targetRole) {
    try {
      const prompt = this.createScoringPrompt(profileData, targetRole);
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Parse the JSON response
      const scores = this.parseScoresFromResponse(response);
      
      // Add completeness score
      scores.completeness = calculateCompleteness(profileData);
      
      return scores;

    } catch (error) {
      console.error('Error calculating scores:', error);
      return this.getDefaultScores();
    }
  }

  createScoringPrompt(profileData, targetRole) {
    const targetRoleContext = targetRole ? `for the target role: ${targetRole}` : 'in general';
    
    return `
As a professional reviewer, carefully analyze the following professional profile ${targetRoleContext} and objectively assign a score from 0-100 for each category below. Use only the information provided—do not infer or assume details not present.

Profile Data:
Name: ${profileData.name || 'Not provided'}
Headline: ${profileData.headline || 'Not provided'}
Summary: ${profileData.summary || 'Not provided'}
Experience: ${JSON.stringify(profileData.experience || [], null, 2)}
Education: ${JSON.stringify(profileData.education || [], null, 2)}
Skills: ${profileData.skills ? profileData.skills.join(', ') : 'Not provided'}

Return ONLY a valid JSON object with these keys and integer scores:
{
  "tone": <integer 0-100, professional tone and language>,
  "clarity": <integer 0-100, clear communication and structure>,
  "relevance": <integer 0-100, relevance to target role or industry>,
  "impact": <integer 0-100, demonstration of achievements and results>,
  "keywords": <integer 0-100, use of industry-relevant keywords>,
  "overall": <integer 0-100, overall profile quality>
}

Scoring criteria:
- Tone: Is the language professional, confident, and appropriate for the industry?
- Clarity: Is the information well-organized, concise, and easy to understand?
- Relevance: Does the content directly match the target role or industry expectations?
- Impact: Are achievements and results clearly demonstrated with quantifiable details?
- Keywords: Are important industry-specific terms and technical skills present?
- Overall: Weighted average of all categories, reflecting the profile's effectiveness for the target role.

Do NOT include any explanation or extra text—return only the JSON object.
`;
  }

  parseScoresFromResponse(response) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Error parsing scores:', error);
      return this.getDefaultScores();
    }
  }

  getDefaultScores() {
    return {
      tone: 70,
      clarity: 65,
      relevance: 60,
      impact: 55,
      keywords: 50,
      overall: 60,
      completeness: 0
    };
  }

  async generateSuggestions(profileData, targetRole, analysisType) {
    try {
      const prompt = this.createSuggestionsPrompt(profileData, targetRole, analysisType);
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      return this.parseSuggestionsFromResponse(response);

    } catch (error) {
      console.error('Error generating suggestions:', error);
      return this.getDefaultSuggestions();
    }
  }

  createSuggestionsPrompt(profileData, targetRole, analysisType) {
    const detailLevel = analysisType === 'detailed' ? 'detailed and specific' : 'concise and actionable';
    const targetRoleContext = targetRole ? `for the target role: ${targetRole}` : 'for general professional improvement';
    
    return `
Analyze this professional profile and provide ${detailLevel} suggestions ${targetRoleContext}:

Profile Data:
Name: ${profileData.name || 'Not provided'}
Headline: ${profileData.headline || 'Not provided'}
Summary: ${profileData.summary || 'Not provided'}
Experience: ${JSON.stringify(profileData.experience || [], null, 2)}
Education: ${JSON.stringify(profileData.education || [], null, 2)}
Skills: ${profileData.skills ? profileData.skills.join(', ') : 'Not provided'}

Please provide suggestions in JSON format:
{
  "headline": ["suggestion 1", "suggestion 2", ...],
  "summary": ["suggestion 1", "suggestion 2", ...],
  "experience": ["suggestion 1", "suggestion 2", ...],
  "skills": ["suggestion 1", "suggestion 2", ...],
  "general": ["suggestion 1", "suggestion 2", ...]
}

Focus on:
- Specific improvements for each section
- Industry-relevant keywords to include
- Ways to better quantify achievements
- Professional language enhancements
- Missing elements that should be added

Return only the JSON object.
`;
  }

  parseSuggestionsFromResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Error parsing suggestions:', error);
      return this.getDefaultSuggestions();
    }
  }

  getDefaultSuggestions() {
    return {
      headline: ['Make your headline more specific to your target role'],
      summary: ['Add quantifiable achievements to your summary'],
      experience: ['Use action verbs to describe your accomplishments'],
      skills: ['Include more industry-relevant technical skills'],
      general: ['Ensure all sections are complete and up-to-date']
    };
  }

  async analyzeKeywords(profileData, targetRole) {
    try {
      const prompt = this.createKeywordAnalysisPrompt(profileData, targetRole);
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      return this.parseKeywordsFromResponse(response);

    } catch (error) {
      console.error('Error analyzing keywords:', error);
      return this.getDefaultKeywords();
    }
  }

  createKeywordAnalysisPrompt(profileData, targetRole) {
    const targetRoleContext = targetRole ? `for the role: ${targetRole}` : 'for the current industry/field';
    
    return `
Analyze the keywords in this professional profile ${targetRoleContext}:

Profile Content:
${JSON.stringify(profileData, null, 2)}

Provide keyword analysis in JSON format:
{
  "present": ["keyword1", "keyword2", ...],
  "missing": ["keyword1", "keyword2", ...],
  "suggested": ["keyword1", "keyword2", ...],
  "score": <0-100 keyword optimization score>
}

Where:
- present: relevant keywords already in the profile
- missing: important keywords that should be added
- suggested: alternative or related keywords to consider
- score: overall keyword optimization score (0-100)

Return only the JSON object.
`;
  }

  parseKeywordsFromResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Error parsing keywords:', error);
      return this.getDefaultKeywords();
    }
  }

  getDefaultKeywords() {
    return {
      present: [],
      missing: [],
      suggested: [],
      score: 50
    };
  }

  async rewriteContent(profileData, targetRole) {
    try {
      const rewritten = {};
      
      // Rewrite headline
      if (profileData.headline) {
        rewritten.headline = await this.rewriteSection('headline', profileData.headline, targetRole);
      }
      
      // Rewrite summary
      if (profileData.summary) {
        rewritten.summary = await this.rewriteSection('summary', profileData.summary, targetRole);
      }
      
      // Rewrite experience descriptions
      if (profileData.experience && profileData.experience.length > 0) {
        rewritten.experience = [];
        for (const exp of profileData.experience.slice(0, 3)) { // Limit to first 3 experiences
          if (exp.description) {
            const rewrittenExp = {
              ...exp,
              description: await this.rewriteSection('experience', exp.description, targetRole)
            };
            rewritten.experience.push(rewrittenExp);
          }
        }
      }
      
      return rewritten;

    } catch (error) {
      console.error('Error rewriting content:', error);
      return {};
    }
  }

  async rewriteSection(sectionType, content, targetRole) {
    try {
      const prompt = this.createRewritePrompt(sectionType, content, targetRole);
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();

    } catch (error) {
      console.error(`Error rewriting ${sectionType}:`, error);
      return content; // Return original content if rewrite fails
    }
  }

  createRewritePrompt(sectionType, content, targetRole) {
    const targetRoleContext = targetRole ? ` for a ${targetRole} role` : '';
    
    const sectionInstructions = {
      headline: 'Make it more compelling and specific, highlighting key value proposition',
      summary: 'Enhance it with stronger action words, quantifiable achievements, and clearer value proposition',
      experience: 'Improve it with stronger action verbs, quantified results, and relevant keywords'
    };

    return `
Rewrite this professional ${sectionType}${targetRoleContext}:

Original: ${content}

Instructions:
- ${sectionInstructions[sectionType] || 'Improve clarity and impact'}
- Use professional language
- Include relevant industry keywords
- Make it more engaging and results-oriented
- Keep the same general length
- Maintain factual accuracy (don't make up specific numbers or achievements)

Provide only the rewritten version, no other text.
`;
  }
}

const analyzeWithGemini = async (profileData, targetRole = '', analysisType = 'basic') => {
  const analyzer = new GeminiAnalyzer();
  return await analyzer.analyzeProfile(profileData, targetRole, analysisType);
};

module.exports = {
  GeminiAnalyzer,
  analyzeWithGemini
};
