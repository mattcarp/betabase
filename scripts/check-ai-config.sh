#!/bin/bash
# Check if required AI API keys are configured for demos

echo "=== AI Configuration Check ==="
echo ""

# Check for Google AI API Key
if [ -z "$GOOGLE_API_KEY" ]; then
  echo "❌ GOOGLE_API_KEY is NOT set"
  echo "   This is required for chat and AI features to work"
  echo "   Run with: infisical run --env=dev -- ./scripts/check-ai-config.sh"
else
  echo "✅ GOOGLE_API_KEY is set (${#GOOGLE_API_KEY} characters)"
fi

# Check for other AI keys that might be used
echo ""
echo "Other AI Keys (optional):"

if [ -n "$GEMINI_API_KEY" ]; then
  echo "✅ GEMINI_API_KEY is set"
else
  echo "ℹ️  GEMINI_API_KEY is not set (optional)"
fi

if [ -n "$NEXT_PUBLIC_GEMINI_API_KEY" ]; then
  echo "✅ NEXT_PUBLIC_GEMINI_API_KEY is set"
else
  echo "ℹ️  NEXT_PUBLIC_GEMINI_API_KEY is not set (optional)"
fi

if [ -n "$GOOGLE_GENERATIVE_AI_API_KEY" ]; then
  echo "✅ GOOGLE_GENERATIVE_AI_API_KEY is set"
else
  echo "ℹ️  GOOGLE_GENERATIVE_AI_API_KEY is not set (optional)"
fi

echo ""
echo "=== Summary ==="
if [ -z "$GOOGLE_API_KEY" ]; then
  echo "⚠️  Critical: GOOGLE_API_KEY must be set for AI features"
  echo "   Tests requiring AI will timeout without this"
  exit 1
else
  echo "✅ AI configuration looks good!"
  exit 0
fi
