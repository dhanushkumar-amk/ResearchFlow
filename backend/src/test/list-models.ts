import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

async function listModels() {
  const genAI = new GoogleGenerativeAI(config.googleApiKey);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.googleApiKey}`);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

listModels();
