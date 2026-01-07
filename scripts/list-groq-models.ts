import fetch from 'node-fetch';

async function listGroqModels() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY not found in environment variables');
    return;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.error(`Error fetching models: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(text);
      return;
    }

    const data = await response.json();
    console.log('Available Groq Models:');
    data.data.forEach(model => {
      console.log(`- ${model.id}`);
    });
  } catch (error) {
    console.error('Failed to list models:', error);
  }
}

listGroqModels();
