const { parseResumeFromFile } = require('./services/pdfParser');
const fs = require('fs-extra');
const path = require('path');

async function debugPDF() {
  try {
    // Check if there are any recent PDF uploads
    const uploadsDir = path.join(__dirname, 'uploads');
    
    if (await fs.pathExists(uploadsDir)) {
      const files = await fs.readdir(uploadsDir);
      const pdfFiles = files.filter(file => file.endsWith('.pdf'));
      
      if (pdfFiles.length > 0) {
        const latestPDF = pdfFiles[pdfFiles.length - 1];
        const filePath = path.join(uploadsDir, latestPDF);
        
        console.log(`🔍 Debugging PDF: ${latestPDF}`);
        
        const result = await parseResumeFromFile(filePath);
        
        console.log('\n📋 Raw Text (first 500 chars):');
        console.log('=' .repeat(50));
        console.log(result.rawText.substring(0, 500));
        console.log('=' .repeat(50));
        
        console.log('\n📝 Extracted Data:');
        console.log('Name:', result.structuredData.name || 'NOT FOUND');
        console.log('Email:', result.structuredData.email || 'NOT FOUND');
        console.log('Phone:', result.structuredData.phone || 'NOT FOUND');
        console.log('Skills:', result.structuredData.skills.length > 0 ? result.structuredData.skills.slice(0, 5) : 'NOT FOUND');
        console.log('Experience count:', result.structuredData.experience.length);
        
        console.log('\n📄 Raw Lines (first 10):');
        const lines = result.rawText.split('\n').filter(line => line.trim().length > 0);
        lines.slice(0, 10).forEach((line, index) => {
          console.log(`${index + 1}: "${line.trim()}"`);
        });
        
      } else {
        console.log('❌ No PDF files found in uploads directory');
        console.log('💡 Upload a PDF through the web interface first');
      }
    } else {
      console.log('❌ Uploads directory not found');
    }
    
  } catch (error) {
    console.error('❌ Error debugging PDF:', error);
  }
}

debugPDF();
