/**
 * Synthesis Service for Knowledge API
 *
 * Generates natural language answers from vector search results
 * Primary: Gemini 3.0 Flash Preview
 * Fallback: Groq llama-3.3-70b
 */

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import type { VectorResult } from '../types';

const SYNTHESIS_TIMEOUT_MS = 5000;
const MAX_CONTEXT_CHARS = 6400; // ~800 chars per result, 8 results max

/**
 * Prepare context from search results
 */
function prepareContext(results: VectorResult[]): string {
  let totalChars = 0;
  const contextParts: string[] = [];

  for (const result of results) {
    const snippet = result.content.slice(0, 800);
    if (totalChars + snippet.length > MAX_CONTEXT_CHARS) break;

    contextParts.push(
      `[${result.source_type.toUpperCase()}] (${Math.round(result.similarity * 100)}% match)\n${snippet}`
    );
    totalChars += snippet.length;
  }

  return contextParts.join('\n\n---\n\n');
}

/**
 * Build the synthesis prompt
 */
function buildPrompt(query: string, context: string): string {
  return `You are a helpful assistant for AOMA (Asset and Offering Management Application).
Answer the user's question based ONLY on the provided context. Be concise and direct.
If the context doesn't contain relevant information, say so clearly.

CONTEXT:
${context}

USER QUESTION: ${query}

ANSWER:`;
}

export interface SynthesisResult {
  text: string;
  duration_ms: number;
  model: string;
  fallback_used: boolean;
}

/**
 * Synthesize an answer using LLM
 */
export async function synthesizeAnswer(
  query: string,
  results: VectorResult[]
): Promise<SynthesisResult> {
  const start = performance.now();

  if (results.length === 0) {
    return {
      text: 'No relevant information found in the knowledge base for your query.',
      duration_ms: Math.round(performance.now() - start),
      model: 'none',
      fallback_used: false,
    };
  }

  const context = prepareContext(results);
  const prompt = buildPrompt(query, context);

  // Try Gemini 3.0 Flash Preview first
  try {
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt,
      maxTokens: 500,
      temperature: 0.3,
      abortSignal: AbortSignal.timeout(SYNTHESIS_TIMEOUT_MS),
    });

    return {
      text: text.trim(),
      duration_ms: Math.round(performance.now() - start),
      model: 'gemini-2.0-flash',
      fallback_used: false,
    };
  } catch (geminiError) {
    console.warn('Gemini synthesis failed, trying Groq fallback:', geminiError);
  }

  // Fallback to Groq
  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
      maxTokens: 500,
      temperature: 0.3,
      abortSignal: AbortSignal.timeout(SYNTHESIS_TIMEOUT_MS),
    });

    return {
      text: text.trim(),
      duration_ms: Math.round(performance.now() - start),
      model: 'llama-3.3-70b-versatile',
      fallback_used: true,
    };
  } catch (groqError) {
    console.error('Both Gemini and Groq synthesis failed:', groqError);
    throw new Error('LLM synthesis failed with all providers');
  }
}
