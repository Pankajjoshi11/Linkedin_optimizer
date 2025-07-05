const fs = require('fs-extra');
const pdfParse = require('pdf-parse');

class PDFParser {
  constructor() {}

  async parseResume(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        throw new Error('PDF file not found');
      }

      console.log(`Parsing PDF file: ${filePath}`);
      const dataBuffer = await fs.readFile(filePath);
      
      // Enhanced PDF parsing with better options
      const pdfData = await pdfParse(dataBuffer, {
        // Normalize whitespace
        normalizeWhitespace: true,
        // Disable font face rendering 
        disableFontFace: true,
        // Maximum pages to parse (prevent memory issues)
        max: 10
      });

      console.log(`PDF parsed successfully. Pages: ${pdfData.numpages}, Text length: ${pdfData.text.length}`);

      if (!pdfData.text || pdfData.text.trim().length < 50) {
        throw new Error('PDF appears to be empty or contains insufficient text content');
      }

      // Extract and structure resume data
      const resumeData = this.extractResumeData(pdfData.text);

      // Validate that we extracted meaningful data
      if (!resumeData.name && !resumeData.email && resumeData.experience.length === 0) {
        console.log('Warning: Minimal data extracted from PDF');
        // Don't throw error, but log for debugging
        console.log('Raw text sample:', pdfData.text.substring(0, 300));
      }

      return {
        rawText: pdfData.text,
        structuredData: resumeData,
        metadata: {
          pages: pdfData.numpages,
          info: pdfData.info || {},
          textLength: pdfData.text.length
        }
      };

    } catch (error) {
      console.error('Error parsing PDF:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Invalid PDF')) {
        throw new Error('The uploaded file is not a valid PDF document');
      } else if (error.message.includes('encrypted')) {
        throw new Error('The PDF is password protected and cannot be processed');
      } else {
        throw new Error(`Failed to parse PDF: ${error.message}`);
      }
    }
  }

  extractResumeData(text) {
    const resume = {
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: []
    };

    try {
      // Clean and normalize text
      const cleanText = this.cleanText(text);
      const lines = cleanText.split('\n').filter(line => line.trim().length > 0);

      // Extract contact information
      resume.email = this.extractEmail(cleanText);
      resume.phone = this.extractPhone(cleanText);
      resume.name = this.extractName(lines);
      resume.location = this.extractLocation(cleanText);

      // Extract sections
      const sections = this.identifySections(lines);
      
      resume.summary = this.extractSummary(sections, lines);
      resume.experience = this.extractExperience(sections, lines);
      resume.education = this.extractEducation(sections, lines);
      resume.skills = this.extractSkills(sections, lines);
      resume.certifications = this.extractCertifications(sections, lines);
      resume.languages = this.extractLanguages(sections, lines);

    } catch (error) {
      console.error('Error extracting resume data:', error);
    }

    return resume;
  }

  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      // Remove excessive whitespace but preserve line breaks
      .replace(/[ ]{2,}/g, ' ')
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  extractEmail(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailRegex);
    return matches ? matches[0] : '';
  }

  extractPhone(text) {
    const phoneRegexes = [
      /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/,
      /(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/,
      /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/
    ];
    
    for (const regex of phoneRegexes) {
      const match = text.match(regex);
      if (match) return match[0];
    }
    return '';
  }

  extractName(lines) {
    // Look for name in the first few lines, avoiding technical terms
    const skipWords = [
      'resume', 'curriculum', 'cv', 'vitae', 'contact', 'phone', 'email', 'address',
      'skills', 'objective', 'summary', 'profile', 'languages', 'programming',
      'certifications', 'education', 'experience', 'work', 'employment',
      'professional', 'career', 'linkedin', 'github', 'portfolio', 'website',
      'html', 'css', 'javascript', 'python', 'java', 'basic', 'basics', 'advanced',
      'technical', 'soft', 'communication', 'problem', 'solving', 'management',
      'circuit', 'design', 'simulation', 'matlab', 'digital', 'electronics',
      'operating', 'systems', 'linux', 'cloud', 'computing', 'data', 'structures',
      'intermediate', 'beginner', 'expert', 'proficient', 'skilled', 'familiar',
      'knowledge', 'understanding', 'level', 'years', 'months', 'duration'
    ];
    
    // Look in first 10 lines for name
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].trim();
      
      // Skip empty lines, emails, phones, URLs, numbers
      if (!line || 
          line.includes('@') || 
          line.includes('http') || 
          /^\+?\d/.test(line) ||
          line.includes('www.') ||
          line.includes('.com') ||
          /^\d+/.test(line) ||
          line.length < 3 ||
          line.length > 40) continue;
      
      // Skip lines with technical/skill words (check each word individually)
      const lineWords = line.toLowerCase().split(/\s+/);
      const hasSkillWords = skipWords.some(skillWord => 
        lineWords.some(lineWord => lineWord === skillWord || lineWord.includes(skillWord))
      );
      
      if (hasSkillWords) continue;
      
      // Check if line looks like a name (all caps or proper case, 1-4 words max)
      const words = line.split(/\s+/);
      if (words.length >= 1 && words.length <= 4) {
        // Check if all words are likely name parts (letters only, proper format)
        const allWordsAreNames = words.every(word => {
          // Allow all caps names or proper case names
          return /^[A-Z][A-Z]*$/.test(word) || /^[A-Z][a-z]+$/.test(word);
        });
        
        // Additional validation: reject if it contains common non-name patterns
        const hasNonNamePatterns = words.some(word => {
          const lowerWord = word.toLowerCase();
          return skipWords.includes(lowerWord) || 
                 /\d/.test(word) || // contains numbers
                 word.length < 2 || // too short
                 word.length > 15;  // too long for a name part
        });
        
        if (allWordsAreNames && !hasNonNamePatterns) {
          return line.trim();
        }
      }
    }
    
    // Fallback: look for specific name patterns in first 5 lines
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i].trim();
      
      // Look for pattern: FIRSTNAME LASTNAME (all caps) without skill words
      if (/^[A-Z]+\s+[A-Z]+(\s+[A-Z]+)?$/.test(line)) {
        const lineWords = line.toLowerCase().split(/\s+/);
        const hasSkillWords = skipWords.some(skillWord => 
          lineWords.some(lineWord => lineWord === skillWord || lineWord.includes(skillWord))
        );
        
        // Additional validation for the fallback
        const hasValidNameLength = lineWords.every(word => word.length >= 2 && word.length <= 15);
        const hasNoNumbers = !line.match(/\d/);
        
        if (!hasSkillWords && hasValidNameLength && hasNoNumbers) {
          return line.trim();
        }
      }
    }
    
    return '';
  }

  extractLocation(text) {
    const locationRegex = /(?:(?:New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose|Austin|Jacksonville|Fort Worth|Columbus|Charlotte|San Francisco|Indianapolis|Seattle|Denver|Washington|Boston|El Paso|Nashville|Detroit|Oklahoma City|Portland|Las Vegas|Memphis|Louisville|Baltimore|Milwaukee|Albuquerque|Tucson|Fresno|Sacramento|Kansas City|Long Beach|Mesa|Atlanta|Colorado Springs|Virginia Beach|Raleigh|Omaha|Miami|Oakland|Minneapolis|Tulsa|Wichita|New Orleans|Arlington|Cleveland|Bakersfield|Tampa|Aurora|Honolulu|Anaheim|Santa Ana|Corpus Christi|Riverside|St. Louis|Lexington|Pittsburgh|Anchorage|Stockton|Cincinnati|Saint Paul|Toledo|Greensboro|Newark|Plano|Henderson|Lincoln|Buffalo|Jersey City|Chula Vista|Fort Wayne|Orlando|St. Petersburg|Chandler|Laredo|Norfolk|Durham|Madison|Lubbock|Irvine|Winston-Salem|Glendale|Garland|Hialeah|Reno|Chesapeake|Gilbert|Baton Rouge|Irving|Scottsdale|North Las Vegas|Fremont|Boise|Richmond|San Bernardino|Birmingham|Spokane|Rochester|Des Moines|Modesto|Fayetteville|Tacoma|Oxnard|Fontana|Columbus|Montgomery|Moreno Valley|Shreveport|Aurora|Yonkers|Akron|Huntington Beach|Little Rock|Augusta|Amarillo|Glendale|Mobile|Grand Rapids|Salt Lake City|Tallahassee|Huntsville|Grand Prairie|Knoxville|Worcester|Newport News|Brownsville|Overland Park|Santa Clarita|Providence|Garden Grove|Chattanooga|Oceanside|Jackson|Fort Lauderdale|Santa Rosa|Rancho Cucamonga|Port St. Lucie|Tempe|Ontario|Vancouver|Cape Coral|Sioux Falls|Springfield|Peoria|Pembroke Pines|Elk Grove|Salem|Lancaster|Corona|Eugene|Palmdale|Salinas|Springfield|Pasadena|Fort Collins|Hayward|Pomona|Cary|Rockford|Alexandria|Escondido|McKinney|Kansas City|Joliet|Sunnyvale|Torrance|Bridgeport|Lakewood|Hollywood|Paterson|Naperville|Syracuse|Mesquite|Dayton|Savannah|Clarksville|Orange|Pasadena|Fullerton|Killeen|Frisco|Hampton|McAllen|Warren|Bellevue|West Valley City|Columbia|Olathe|Sterling Heights|New Haven|Miramar|Waco|Thousand Oaks|Cedar Rapids|Charleston|Sioux City|Round Rock|Richardson|Lansing|Surprise|Denton|Victorville|Evansville|Garden Grove|Waterbury|Roseville|Thornton|Beaumont|Allentown|Abilene|Odessa|Arvada|Westminster|Provo|Norwalk|Centennial|Elgin|Downey|McKinney|Broken Arrow|Murfreesboro|Allen|College Station|Pearland|Richardson|League City|Sugar Land|Edinburg|Pharr|Conroe|Round Rock|Tyler|Denton)(?:,?\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)))/gi;
    const match = text.match(locationRegex);
    return match ? match[0] : '';
  }

  identifySections(lines) {
    const sections = {};
    const sectionKeywords = {
      experience: ['experience', 'work history', 'employment', 'professional experience', 'career history'],
      education: ['education', 'academic background', 'qualifications', 'degrees'],
      skills: ['skills', 'technical skills', 'competencies', 'expertise'],
      summary: ['summary', 'objective', 'profile', 'about'],
      certifications: ['certifications', 'certificates', 'licenses'],
      languages: ['languages', 'language skills']
    };

    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase().trim();
      
      for (const [section, keywords] of Object.entries(sectionKeywords)) {
        if (keywords.some(keyword => lowerLine.includes(keyword))) {
          sections[section] = index;
          break;
        }
      }
    });

    return sections;
  }

  extractSummary(sections, lines) {
    if (!sections.summary) return '';
    
    const startIndex = sections.summary + 1;
    const nextSectionIndex = Math.min(...Object.values(sections).filter(i => i > sections.summary));
    const endIndex = nextSectionIndex === Infinity ? lines.length : nextSectionIndex;
    
    return lines.slice(startIndex, endIndex).join(' ').trim();
  }

  extractExperience(sections, lines) {
    if (!sections.experience) return [];
    
    const experiences = [];
    const startIndex = sections.experience + 1;
    const nextSectionIndex = Math.min(...Object.values(sections).filter(i => i > sections.experience));
    const endIndex = nextSectionIndex === Infinity ? lines.length : nextSectionIndex;
    
    const experienceLines = lines.slice(startIndex, endIndex);
    
    let currentExperience = null;
    let descriptionBuffer = [];
    
    for (let i = 0; i < experienceLines.length; i++) {
      const line = experienceLines[i].trim();
      
      if (!line) {
        // Empty line might indicate end of current experience
        if (currentExperience && descriptionBuffer.length > 0) {
          currentExperience.description = descriptionBuffer.join(' ').trim();
          descriptionBuffer = [];
        }
        continue;
      }
      
      // Enhanced job title detection
      if (this.isJobTitle(line) || this.looksLikeJobHeader(line)) {
        // Save previous experience
        if (currentExperience) {
          if (descriptionBuffer.length > 0) {
            currentExperience.description = descriptionBuffer.join(' ').trim();
          }
          experiences.push(currentExperience);
          descriptionBuffer = [];
        }
        
        // Parse new experience
        const parsed = this.parseJobLine(line);
        currentExperience = {
          title: parsed.title,
          company: parsed.company,
          duration: parsed.duration,
          description: ''
        };
        
        // Check next line for additional info (dates, company, etc.)
        if (i + 1 < experienceLines.length) {
          const nextLine = experienceLines[i + 1].trim();
          if (this.looksLikeDateRange(nextLine) && !currentExperience.duration) {
            currentExperience.duration = nextLine;
            i++; // Skip the next line
          } else if (this.looksLikeCompany(nextLine) && !currentExperience.company) {
            currentExperience.company = nextLine;
            i++; // Skip the next line
          }
        }
      } else if (currentExperience) {
        // This is likely a description line
        descriptionBuffer.push(line);
      }
    }
    
    // Don't forget the last experience
    if (currentExperience) {
      if (descriptionBuffer.length > 0) {
        currentExperience.description = descriptionBuffer.join(' ').trim();
      }
      experiences.push(currentExperience);
    }
    
    return experiences.filter(exp => exp.title || exp.company); // Only return valid experiences
  }

  isJobTitle(line) {
    // Check if line looks like a job title
    const jobTitleKeywords = [
      'manager', 'engineer', 'analyst', 'director', 'specialist', 'coordinator',
      'developer', 'designer', 'architect', 'lead', 'senior', 'junior',
      'associate', 'assistant', 'executive', 'officer', 'supervisor',
      'consultant', 'administrator', 'technician', 'intern'
    ];
    
    const line_lower = line.toLowerCase();
    return jobTitleKeywords.some(keyword => line_lower.includes(keyword)) && 
           line.length < 80 && 
           !line.includes('@') && 
           !line.includes('.com');
  }

  looksLikeJobHeader(line) {
    // Check if line looks like a job header (title, company, dates pattern)
    const jobIndicators = [
      /^[A-Z][^,]+,\s*[A-Z][^,]+/,  // "Title, Company" pattern
      /\b(manager|engineer|analyst|director|specialist|coordinator|developer|designer)\b/i,
      /\b(at|@)\s+[A-Z]/,  // "Title at Company" pattern
      /\b(inc|llc|corp|ltd|company|group|organization)\b/i
    ];
    
    return jobIndicators.some(pattern => pattern.test(line)) && line.length < 100;
  }

  looksLikeDateRange(line) {
    const datePatterns = [
      /\b\d{4}\s*[-–]\s*\d{4}\b/,  // 2020 - 2023
      /\b\d{4}\s*[-–]\s*present\b/i,  // 2020 - Present
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}/i,  // Jan 2020
      /\b\d{1,2}\/\d{4}\s*[-–]\s*\d{1,2}\/\d{4}\b/  // 01/2020 - 12/2023
    ];
    
    return datePatterns.some(pattern => pattern.test(line)) && line.length < 50;
  }

  looksLikeCompany(line) {
    const companyIndicators = [
      /\b(inc|llc|corp|ltd|company|group|organization|firm)\b/i,
      /^[A-Z][A-Za-z\s&]+$/  // Starts with capital, contains only letters, spaces, ampersand
    ];
    
    return companyIndicators.some(pattern => pattern.test(line)) && 
           line.length > 2 && line.length < 80 && 
           !this.looksLikeDateRange(line);
  }

  parseJobLine(line) {
    const parts = {
      title: '',
      company: '',
      duration: ''
    };
    
    // Try different parsing patterns
    
    // Pattern 1: "Title at Company"
    let match = line.match(/^(.+?)\s+at\s+(.+)$/i);
    if (match) {
      parts.title = match[1].trim();
      parts.company = match[2].trim();
      return parts;
    }
    
    // Pattern 2: "Title, Company"
    match = line.match(/^([^,]+),\s*(.+)$/);
    if (match) {
      parts.title = match[1].trim();
      parts.company = match[2].trim();
      return parts;
    }
    
    // Pattern 3: "Title | Company"
    match = line.match(/^([^|]+)\|\s*(.+)$/);
    if (match) {
      parts.title = match[1].trim();
      parts.company = match[2].trim();
      return parts;
    }
    
    // Pattern 4: "Title – Company" (em dash)
    match = line.match(/^([^–]+)–\s*(.+)$/);
    if (match) {
      parts.title = match[1].trim();
      parts.company = match[2].trim();
      return parts;
    }
    
    // Fallback: treat entire line as title
    parts.title = line.trim();
    return parts;
  }

  extractEducation(sections, lines) {
    if (!sections.education) return [];
    
    const educations = [];
    const startIndex = sections.education + 1;
    const nextSectionIndex = Math.min(...Object.values(sections).filter(i => i > sections.education));
    const endIndex = nextSectionIndex === Infinity ? lines.length : nextSectionIndex;
    
    const educationLines = lines.slice(startIndex, endIndex);
    
    educationLines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 0 && this.isEducationEntry(trimmedLine)) {
        const parts = this.parseEducationLine(trimmedLine);
        educations.push({
          school: parts.school,
          degree: parts.degree,
          year: parts.year
        });
      }
    });
    
    return educations;
  }

  isEducationEntry(line) {
    const educationKeywords = ['university', 'college', 'institute', 'school', 'bachelor', 'master', 'phd', 'degree'];
    return educationKeywords.some(keyword => line.toLowerCase().includes(keyword));
  }

  parseEducationLine(line) {
    return {
      school: line.trim(),
      degree: '',
      year: ''
    };
  }

  extractSkills(sections, lines) {
    if (!sections.skills) return [];
    
    const skills = [];
    const startIndex = sections.skills + 1;
    const nextSectionIndex = Math.min(...Object.values(sections).filter(i => i > sections.skills));
    const endIndex = nextSectionIndex === Infinity ? lines.length : nextSectionIndex;
    
    const skillsText = lines.slice(startIndex, endIndex).join(' ');
    
    // Split by common delimiters
    const skillArray = skillsText.split(/[,•·\n]/).map(skill => skill.trim()).filter(skill => skill.length > 0);
    
    return skillArray;
  }

  extractCertifications(sections, lines) {
    if (!sections.certifications) return [];
    
    const certifications = [];
    const startIndex = sections.certifications + 1;
    const nextSectionIndex = Math.min(...Object.values(sections).filter(i => i > sections.certifications));
    const endIndex = nextSectionIndex === Infinity ? lines.length : nextSectionIndex;
    
    const certLines = lines.slice(startIndex, endIndex);
    
    certLines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 0) {
        certifications.push({
          name: trimmedLine,
          issuer: '',
          date: ''
        });
      }
    });
    
    return certifications;
  }

  extractLanguages(sections, lines) {
    if (!sections.languages) return [];
    
    const languages = [];
    const startIndex = sections.languages + 1;
    const nextSectionIndex = Math.min(...Object.values(sections).filter(i => i > sections.languages));
    const endIndex = nextSectionIndex === Infinity ? lines.length : nextSectionIndex;
    
    const langLines = lines.slice(startIndex, endIndex);
    
    langLines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 0) {
        languages.push({
          language: trimmedLine,
          proficiency: ''
        });
      }
    });
    
    return languages;
  }
}

const parseResumeFromFile = async (filePath) => {
  const parser = new PDFParser();
  return await parser.parseResume(filePath);
};

module.exports = {
  PDFParser,
  parseResumeFromFile
};
