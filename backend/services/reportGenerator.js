const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

class ReportGenerator {
  constructor() {
    // Removed chartjs dependency for now - will generate simple text-based charts
  }

  async generateReport(analysisData, profileData, options = {}) {
    try {
      const {
        includeCharts = true,
        includeRewritten = true,
        format = 'detailed'
      } = options;

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Generate report content
      await this.addHeader(doc, profileData);
      await this.addExecutiveSummary(doc, analysisData);
      
      if (includeCharts) {
        await this.addScorecard(doc, analysisData.scores);
      }
      
      await this.addDetailedAnalysis(doc, analysisData, profileData);
      await this.addSuggestions(doc, analysisData.suggestions);
      
      if (includeRewritten && analysisData.rewritten) {
        await this.addRewrittenContent(doc, analysisData.rewritten);
      }
      
      await this.addKeywordAnalysis(doc, analysisData.keywords);
      await this.addFooter(doc);

      return doc;

    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  async addHeader(doc, profileData) {
    // Title
    doc.fontSize(24)
       .fillColor('#2563eb')
       .text('LinkedIn Profile Analysis Report', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Profile info
    doc.fontSize(16)
       .fillColor('#374151')
       .text(`Profile: ${profileData.name || 'Unknown'}`, { align: 'center' });
    
    if (profileData.headline) {
      doc.fontSize(12)
         .fillColor('#6b7280')
         .text(profileData.headline, { align: 'center' });
    }
    
    // Date
    doc.fontSize(10)
       .fillColor('#9ca3af')
       .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    
    doc.moveDown(1);
    this.addSeparator(doc);
  }

  async addExecutiveSummary(doc, analysisData) {
    doc.fontSize(18)
       .fillColor('#1f2937')
       .text('Executive Summary');
    
    doc.moveDown(0.5);
    
    const overallScore = analysisData.scores?.overall || 0;
    const completenessScore = analysisData.scores?.completeness || 0;
    
    // Overall assessment
    let assessment = 'Needs Improvement';
    let assessmentColor = '#dc2626';
    
    if (overallScore >= 80) {
      assessment = 'Excellent';
      assessmentColor = '#059669';
    } else if (overallScore >= 65) {
      assessment = 'Good';
      assessmentColor = '#d97706';
    } else if (overallScore >= 50) {
      assessment = 'Fair';
      assessmentColor = '#eab308';
    }
    
    doc.fontSize(12)
       .fillColor('#374151')
       .text(`Overall Profile Score: `)
       .fillColor(assessmentColor)
       .text(`${overallScore}/100 (${assessment})`, { continued: false });
    
    doc.fillColor('#374151')
       .text(`Profile Completeness: ${completenessScore}%`);
    
    doc.moveDown(0.5);
    
    // Key insights
    const insights = this.generateKeyInsights(analysisData);
    doc.text('Key Insights:', { underline: true });
    
    insights.forEach((insight, index) => {
      doc.text(`${index + 1}. ${insight}`);
    });
    
    doc.moveDown(1);
    this.addSeparator(doc);
  }

  generateKeyInsights(analysisData) {
    const insights = [];
    const scores = analysisData.scores || {};
    
    // Find lowest scoring areas
    const scoreEntries = Object.entries(scores)
      .filter(([key]) => key !== 'overall' && key !== 'completeness')
      .sort(([,a], [,b]) => a - b);
    
    if (scoreEntries.length > 0) {
      const [lowestCategory, lowestScore] = scoreEntries[0];
      insights.push(`${this.capitalizeFirst(lowestCategory)} needs the most improvement (${lowestScore}/100)`);
    }
    
    // Find highest scoring areas
    if (scoreEntries.length > 0) {
      const [highestCategory, highestScore] = scoreEntries[scoreEntries.length - 1];
      if (highestScore >= 70) {
        insights.push(`Strong performance in ${highestCategory} (${highestScore}/100)`);
      }
    }
    
    // Completeness insight
    const completeness = scores.completeness || 0;
    if (completeness < 80) {
      insights.push(`Profile is ${completeness}% complete - consider adding missing sections`);
    }
    
    // Keywords insight
    if (analysisData.keywords?.score < 60) {
      insights.push('Keyword optimization can be improved to increase visibility');
    }
    
    return insights.slice(0, 4); // Limit to 4 key insights
  }

  async addScorecard(doc, scores) {
    doc.fontSize(18)
       .fillColor('#1f2937')
       .text('Profile Scorecard');
    
    doc.moveDown(0.5);
    
    // Use text-based scorecard (chart rendering disabled due to canvas dependencies)
    this.addTextScorecard(doc, scores);
    
    doc.moveDown(1);
    this.addSeparator(doc);
  }

  addTextScorecard(doc, scores) {
    const categories = Object.keys(scores).filter(key => key !== 'overall' && key !== 'completeness');
    
    categories.forEach(category => {
      const score = scores[category] || 0;
      const barWidth = (score / 100) * 200; // 200px max width
      
      doc.fontSize(12)
         .fillColor('#374151')
         .text(`${this.capitalizeFirst(category)}: ${score}/100`);
      
      // Simple text bar
      const bar = '█'.repeat(Math.floor(score / 5)) + '░'.repeat(20 - Math.floor(score / 5));
      doc.fontSize(10)
         .fillColor('#6b7280')
         .text(bar);
      
      doc.moveDown(0.3);
    });
  }

  async addDetailedAnalysis(doc, analysisData, profileData) {
    doc.addPage();
    
    doc.fontSize(18)
       .fillColor('#1f2937')
       .text('Detailed Analysis');
    
    doc.moveDown(0.5);
    
    // Section-by-section analysis
    const sections = [
      { key: 'headline', title: 'Professional Headline', content: profileData.headline },
      { key: 'summary', title: 'Summary/About Section', content: profileData.summary },
      { key: 'experience', title: 'Work Experience', content: this.formatExperience(profileData.experience) },
      { key: 'skills', title: 'Skills Section', content: profileData.skills?.join(', ') }
    ];
    
    sections.forEach(section => {
      if (section.content) {
        doc.fontSize(14)
           .fillColor('#374151')
           .text(section.title, { underline: true });
        
        doc.fontSize(10)
           .fillColor('#6b7280')
           .text('Current Content:', { continued: true })
           .fillColor('#374151')
           .text(` ${this.truncateText(section.content, 200)}`);
        
        // Add score for this section if available
        const sectionScore = analysisData.scores?.[section.key];
        if (sectionScore !== undefined) {
          doc.fillColor('#2563eb')
             .text(`Score: ${sectionScore}/100`);
        }
        
        doc.moveDown(0.5);
      }
    });
    
    this.addSeparator(doc);
  }

  async addSuggestions(doc, suggestions) {
    doc.fontSize(18)
       .fillColor('#1f2937')
       .text('Improvement Suggestions');
    
    doc.moveDown(0.5);
    
    Object.entries(suggestions).forEach(([category, suggestionList]) => {
      if (Array.isArray(suggestionList) && suggestionList.length > 0) {
        doc.fontSize(14)
           .fillColor('#374151')
           .text(this.capitalizeFirst(category), { underline: true });
        
        suggestionList.forEach((suggestion, index) => {
          doc.fontSize(11)
             .fillColor('#374151')
             .text(`• ${suggestion}`);
        });
        
        doc.moveDown(0.5);
      }
    });
    
    this.addSeparator(doc);
  }

  async addRewrittenContent(doc, rewritten) {
    doc.addPage();
    
    doc.fontSize(18)
       .fillColor('#1f2937')
       .text('Enhanced Content Suggestions');
    
    doc.moveDown(0.5);
    
    if (rewritten.headline) {
      doc.fontSize(14)
         .fillColor('#374151')
         .text('Enhanced Headline:', { underline: true });
      
      doc.fontSize(12)
         .fillColor('#059669')
         .text(rewritten.headline);
      
      doc.moveDown(0.5);
    }
    
    if (rewritten.summary) {
      doc.fontSize(14)
         .fillColor('#374151')
         .text('Enhanced Summary:', { underline: true });
      
      doc.fontSize(11)
         .fillColor('#059669')
         .text(rewritten.summary, { align: 'justify' });
      
      doc.moveDown(0.5);
    }
    
    if (rewritten.experience && rewritten.experience.length > 0) {
      doc.fontSize(14)
         .fillColor('#374151')
         .text('Enhanced Experience Descriptions:', { underline: true });
      
      rewritten.experience.forEach((exp, index) => {
        doc.fontSize(12)
           .fillColor('#374151')
           .text(`${exp.title} at ${exp.company}`, { underline: true });
        
        doc.fontSize(11)
           .fillColor('#059669')
           .text(exp.description, { align: 'justify' });
        
        doc.moveDown(0.3);
      });
    }
    
    this.addSeparator(doc);
  }

  async addKeywordAnalysis(doc, keywords) {
    doc.fontSize(18)
       .fillColor('#1f2937')
       .text('Keyword Analysis');
    
    doc.moveDown(0.5);
    
    if (keywords.score !== undefined) {
      doc.fontSize(12)
         .fillColor('#374151')
         .text(`Keyword Optimization Score: ${keywords.score}/100`);
      
      doc.moveDown(0.3);
    }
    
    if (keywords.present && keywords.present.length > 0) {
      doc.fontSize(12)
         .fillColor('#059669')
         .text('Keywords Found:', { underline: true });
      
      doc.fontSize(10)
         .fillColor('#374151')
         .text(keywords.present.join(', '));
      
      doc.moveDown(0.3);
    }
    
    if (keywords.missing && keywords.missing.length > 0) {
      doc.fontSize(12)
         .fillColor('#dc2626')
         .text('Recommended Keywords to Add:', { underline: true });
      
      doc.fontSize(10)
         .fillColor('#374151')
         .text(keywords.missing.join(', '));
      
      doc.moveDown(0.3);
    }
    
    if (keywords.suggested && keywords.suggested.length > 0) {
      doc.fontSize(12)
         .fillColor('#2563eb')
         .text('Additional Keyword Suggestions:', { underline: true });
      
      doc.fontSize(10)
         .fillColor('#374151')
         .text(keywords.suggested.join(', '));
    }
  }

  async addFooter(doc) {
    doc.moveDown(2);
    
    doc.fontSize(8)
       .fillColor('#9ca3af')
       .text('This report was generated by LinkedIn Profile Analyzer. Suggestions are AI-generated and should be reviewed for accuracy.', 
             { align: 'center' });
  }

  addSeparator(doc) {
    doc.moveDown(0.5);
    doc.strokeColor('#e5e7eb')
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();
    doc.moveDown(0.5);
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  }

  formatExperience(experience) {
    if (!Array.isArray(experience) || experience.length === 0) return '';
    
    return experience.map(exp => 
      `${exp.title || 'Unknown Title'} at ${exp.company || 'Unknown Company'}`
    ).join('; ');
  }
}

const generatePDFReport = async (analysisData, profileData, options = {}) => {
  const generator = new ReportGenerator();
  return await generator.generateReport(analysisData, profileData, options);
};

module.exports = {
  ReportGenerator,
  generatePDFReport
};
