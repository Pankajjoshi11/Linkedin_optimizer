const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
require('dotenv').config();

const getGeminiChatModel = () => {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not set in environment variables');
  }

  // Validate the API key format (basic check)
  if (!apiKey.startsWith('AIza')) {
    throw new Error('Invalid Google API key format');
  }

  return new ChatGoogleGenerativeAI({
    modelName: 'gemini-pro', // Start with the stable version
    temperature: 0.7,
    apiKey: apiKey,
    maxOutputTokens: 2048,
  });
};

module.exports = { getGeminiChatModel };