# Gemini 2.5 Pro Environment Setup

## Required Environment Variables

Add these to your `.env.local` and `.env.production.local` files:

```bash
# Google AI / Gemini API Key
GOOGLE_API_KEY=your_google_ai_api_key_here
GEMINI_MODEL=gemini-2.5-pro

# Keep existing OpenAI key for embeddings
OPENAI_API_KEY=your_openai_key_here
```

## Getting Your Google AI API Key

1. Visit: https://ai.google.dev/
2. Sign in with Google account
3. Go to "Get API Key" → Create API Key
4. Enable Gemini API in your project
5. Copy the API key and paste it into your .env files

## Verification

After adding the keys, restart your development server:
```bash
pnpm dev
```

The app will use Gemini 2.5 Pro as the primary model with OpenAI for embeddings.

