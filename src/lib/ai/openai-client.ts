import OpenAI from 'openai';

// Initialize OpenAI client with optimized settings for faster responses
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
  maxRetries: 1, // Reduce retries for faster failure/success
});

export { openai };
