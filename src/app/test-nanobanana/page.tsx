"use client";

import { useState } from 'react';
import { NanoBananaInfographic } from '@/components/ai-elements/NanoBananaInfographic';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * 🍌 Nano Banana Pro Test Page
 * 
 * Quick test to verify Gemini image generation works before the demo!
 */
export default function TestNanoBananaPage() {
  const [customPrompt, setCustomPrompt] = useState('');
  const [activePrompt, setActivePrompt] = useState('');

  // Pre-defined demo prompts
  const demoPrompts = {
    erd: `Create a hand-drawn style infographic showing The Betabase's three-tier multi-tenant database architecture:
- Top tier: "Organization Level" (show Sony Music, Universal, Warner as examples)
- Middle tier: "Division Level" (show Digital Operations, Legal, Finance)
- Bottom tier: "Application Under Test" (show AOMA, Alexandria, USM, Confluence)
Use connecting arrows showing data isolation. Professional but warm, purple/blue/green gradient tech aesthetic with hand-drawn charm.`,
    
    rlhf: `Create a circular hand-drawn diagram showing the RLHF feedback loop with 4 steps:
1. "AI Response" (chat bubble icon with sample text)
2. "Human Feedback" (thumbs up/down buttons, star rating)
3. "Embedding Re-weight" (brain icon with neural network weights)
4. "Better Retrieval" (improved search results, checkmarks)
Use circular arrows connecting back to step 1. Purple/blue gradient, modern tech style with hand-drawn elements.`,
    
    selfHealing: `Create a 4-step process flowchart in hand-drawn style:
1. "Test Fails" - red X icon, example: "Selector '#login-btn' not found"
2. "AI Analyzes" - blue brain icon, text: "DOM diff: button moved to sidebar"  
3. "Fix Applied" - purple wrench icon, "Selector updated to '#sidebar #login-btn'"
4. "Test Passes" - green checkmark, "95% confidence"
Below, show three confidence tiers: Green box "Tier 1: Auto-Apply", Yellow box "Tier 2: QA Review", Red box "Tier 3: Architect"
Connect with arrows. Use traffic light colors (green/yellow/red) prominently.`
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-light text-white mb-2">
            🍌 Nano Banana Pro Test Lab
          </h1>
          <p className="text-muted-foreground">
            Testing Gemini image generation for META DEMO - the system creating its own demo slides!
          </p>
        </div>

        {/* Quick Test Buttons */}
        <div className="grid grid-cols-3 gap-4">
          <Button
            onClick={() => setActivePrompt(demoPrompts.erd)}
            variant="outline"
            className="h-auto py-4 flex-col items-start gap-2"
          >
            <span className="font-medium">🏢 Multi-Tenant ERD</span>
            <span className="text-xs text-muted-foreground">The Betabase architecture</span>
          </Button>
          
          <Button
            onClick={() => setActivePrompt(demoPrompts.rlhf)}
            variant="outline"
            className="h-auto py-4 flex-col items-start gap-2"
          >
            <span className="font-medium">🔄 RLHF Loop</span>
            <span className="text-xs text-muted-foreground">Feedback cycle diagram</span>
          </Button>
          
          <Button
            onClick={() => setActivePrompt(demoPrompts.selfHealing)}
            variant="outline"
            className="h-auto py-4 flex-col items-start gap-2"
          >
            <span className="font-medium">🛡️ Self-Healing</span>
            <span className="text-xs text-muted-foreground">4-step process + tiers</span>
          </Button>
        </div>

        {/* Custom Prompt */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Or write your own prompt:
          </label>
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Create a hand-drawn style infographic showing..."
            className="min-h-[120px] bg-card border-border text-foreground"
          />
          <Button
            onClick={() => setActivePrompt(customPrompt)}
            disabled={!customPrompt.trim()}
            className="w-full"
          >
            Generate Custom Infographic
          </Button>
        </div>

        {/* Generated Infographic */}
        {activePrompt && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-white">Generated Infographic:</h2>
              <Button
                onClick={() => setActivePrompt('')}
                variant="ghost"
                size="sm"
              >
                Clear
              </Button>
            </div>
            
            <NanoBananaInfographic
              key={activePrompt} // Force re-generate on prompt change
              prompt={activePrompt}
              aspectRatio="16:9"
              imageSize="2K"
              autoGenerate={true}
            />

            {/* Prompt Used (for reference) */}
            <details className="text-xs">
              <summary className="text-muted-foreground cursor-pointer hover:text-muted-foreground">
                Show prompt used
              </summary>
              <pre className="mt-2 p-4 bg-card rounded border border-border text-muted-foreground whitespace-pre-wrap">
                {activePrompt}
              </pre>
            </details>
          </div>
        )}

        {/* Instructions */}
        {!activePrompt && (
          <div className="p-6 bg-card/50 rounded-lg border border-border">
            <h3 className="text-lg font-medium text-white mb-3">🎬 How To Use For Demo:</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">1. Test the 3 demo prompts above</strong> - Make sure they generate beautiful infographics
              </li>
              <li>
                <strong className="text-foreground">2. During recording:</strong> Ask the system a question, then say:
                <code className="ml-2 px-2 py-1 bg-muted rounded text-yellow-400">
                  "I'm recording a demo - create an infographic of that"
                </code>
              </li>
              <li>
                <strong className="text-foreground">3. Watch it generate:</strong> 3-5 second spinner, then BOOM - beautiful hand-drawn infographic!
              </li>
              <li>
                <strong className="text-foreground">4. META MOMENT:</strong> Say to your audience:
                <em className="ml-2 text-muted-foreground">
                  "The system just created its own demo slide. That's meta, right?"
                </em>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}


