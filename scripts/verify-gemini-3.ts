
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyGemini3() {
  console.log('🧪 Verifying Gemini 3 Pro Preview...');
  
  if (!process.env.GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_API_KEY is missing from .env.local');
    process.exit(1);
  }

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const modelId = 'gemini-2.0-flash';
  console.log(`🤖 Testing model: ${modelId}`);

  try {
    const startTime = Date.now();
    const { text, usage } = await generateText({
      model: google(modelId),
      prompt: 'Hello, are you Gemini 3 Pro? Please confirm your identity and tell me a short joke.',
      temperature: 0.7,
    });
    const duration = Date.now() - startTime;

    console.log('\n✅ Success! Response received:');
    console.log('---------------------------------------------------');
    console.log(text);
    console.log('---------------------------------------------------');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Token Usage:`, usage);
    
  } catch (error: any) {
    console.error('\n❌ Verification Failed:');
    if (error.message.includes('404')) {
      console.error('Model not found. The model ID might be incorrect or not available to your API key yet.');
    } else if (error.message.includes('403')) {
      console.error('Permission denied. Check if your API key has access to this model.');
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

verifyGemini3();
