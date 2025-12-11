import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error('GOOGLE_API_KEY is not set in environment variables');
}

export const genAI = new GoogleGenAI({
  apiKey: apiKey,
});
