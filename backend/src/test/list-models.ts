import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' }); // For non-v1beta check

  try {
     const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);
     const data = await response.json();
     console.log('Available Models:', data.models.filter((m: any) => m.supportedGenerationMethods.includes('embedContent')));
  } catch (err) {
    console.error(err);
  }
}

listModels();
