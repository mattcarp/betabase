import { NextRequest, NextResponse } from 'next/server';
import { buildNanoBananaPrompt } from '@/config/nano-banana-style';

/**
 * Nano Banana Pro Image Generation Endpoint
 * 
 * Uses Gemini's image generation capability to create hand-drawn style infographics
 * Perfect for demo: The system creates its OWN demo slides while being demoed!
 * 
 * Style is centralized in /config/nano-banana-style.ts - edit once, applies to all!
 */

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      aspectRatio = '16:9',
      imageSize = '2K',
      diagramType, // Optional: 'erd', 'process', 'cycle', 'comparison'
      thinkingMode = true // Enable research/grounding for better contextual images
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Build full prompt with global style template
    const fullPrompt = buildNanoBananaPrompt(prompt, diagramType);

    console.log('🍌 Nano Banana: Generating infographic...');
    console.log('   User Content:', prompt.substring(0, 80) + '...');
    console.log('   Diagram Type:', diagramType || 'generic');
    console.log('   Thinking Mode:', thinkingMode ? 'ENABLED (research/grounding)' : 'disabled');
    console.log('   Full Prompt:', fullPrompt.substring(0, 150) + '...');
    console.log('   Aspect Ratio:', aspectRatio);
    console.log('   Image Size:', imageSize);

    // Build request body with optional thinking/grounding mode
    const requestBody: Record<string, unknown> = {
      contents: [{
        parts: [{ text: fullPrompt }] // Uses styled prompt!
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio,
          imageSize
        }
      }
    };

    // Enable thinking/grounding mode for research-backed image generation
    // This allows the model to reference real logos, branding, etc.
    if (thinkingMode) {
      requestBody.tools = [{
        googleSearch: {}
      }];
    }

    // Call Gemini image generation API
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🍌 Nano Banana: API error:', errorText);
      return NextResponse.json(
        { error: 'Image generation failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract base64 image from response
    const imageBase64 = data.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.data
    )?.inlineData?.data;

    if (!imageBase64) {
      console.error('🍌 Nano Banana: No image in response:', JSON.stringify(data, null, 2));
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    console.log('🍌 Nano Banana: Image generated successfully!');
    console.log('   Size:', (imageBase64.length * 0.75 / 1024).toFixed(1), 'KB');

    // Return as data URL for easy display
    return NextResponse.json({
      success: true,
      imageDataUrl: `data:image/png;base64,${imageBase64}`,
      sizeKB: Math.round(imageBase64.length * 0.75 / 1024)
    });

  } catch (error: any) {
    console.error('🍌 Nano Banana: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

