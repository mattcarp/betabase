"use client";

import { useState, useEffect } from 'react';
import { Download, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface NanoBananaInfographicProps {
  prompt: string;
  diagramType?: 'erd' | 'process' | 'cycle' | 'comparison';
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2' | '9:16';
  imageSize?: '1K' | '2K' | '4K';
  className?: string;
  autoGenerate?: boolean;
}

/**
 * Nano Banana Pro Infographic Component
 * 
 * Generates beautiful hand-drawn style infographics using Gemini's image generation.
 * Perfect for META DEMOS where the system creates its own demo slides!
 */
export function NanoBananaInfographic({
  prompt,
  diagramType,
  aspectRatio = '16:9',
  imageSize = '2K',
  className,
  autoGenerate = true
}: NanoBananaInfographicProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sizeKB, setSizeKB] = useState<number>(0);

  const generateInfographic = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('🍌 Nano Banana: Generating infographic...', { diagramType });
      
      const response = await fetch('/api/generate-infographic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, diagramType, aspectRatio, imageSize })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate infographic');
      }

      const data = await response.json();
      setImageUrl(data.imageDataUrl);
      setSizeKB(data.sizeKB);
      console.log('🍌 Nano Banana: Success!', data.sizeKB, 'KB');
      
    } catch (err: any) {
      console.error('🍌 Nano Banana: Error:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate on mount if enabled
  useEffect(() => {
    if (autoGenerate && !imageUrl) {
      generateInfographic();
    }
  }, [autoGenerate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `nano-banana-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-end mb-4">
        {imageUrl && (
          <Button onClick={handleDownload}
            variant="outline"
            size="sm"
            className="mac-button mac-button-outline gap-2"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </Button>
        )}
      </div>

      {/* Loading State - Enhanced with progress info */}
      {isGenerating && (
        <div className="w-full aspect-video bg-gradient-to-br from-card/80 to-background/80 rounded-xl border border-yellow-500/20 flex flex-col items-center justify-center gap-5 p-8">
          {/* Animated spinner */}
          <div className="relative">
            {/* Outer ring */}
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-yellow-400 border-r-primary-400" />
            {/* Inner pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-4 w-4 animate-pulse rounded-full bg-yellow-400/60" />
            </div>
          </div>
          
          {/* Status messages */}
          <div className="text-center space-y-3">
            <p className="text-base text-foreground font-normal flex items-center gap-2 justify-center">
              <span className="text-2xl">🍌</span>
              <span>The Betabase is creating your infographic...</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Gemini 3 Pro • Hand-drawn editorial style • 2K resolution
            </p>
            
            {/* 40-second warning */}
            <div className="flex items-center justify-center gap-2 text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg py-2 px-4 mx-auto w-fit mt-4">
              <span className="animate-pulse text-base">⏱️</span>
              <span>This typically takes 30-50 seconds • Hang tight, beauty is worth the wait!</span>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isGenerating && (
        <div className="w-full aspect-video bg-red-900/10 rounded-lg border border-red-500/30 flex flex-col items-center justify-center gap-4 p-6">
          <p className="text-sm text-red-400">Failed to generate infographic</p>
          <p className="text-xs text-red-300/70">{error}</p>
          <Button
            className="mac-button mac-button-outline"
            onClick={generateInfographic}
            variant="outline"
            size="sm"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Generated Image */}
      {imageUrl && !isGenerating && (
        <div className="relative w-full aspect-video bg-card/30 rounded-lg border border-border overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Generated infographic"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Manual Generate Button (if auto-generate disabled) */}
      {!autoGenerate && !imageUrl && !isGenerating && (
        <div className="w-full aspect-video bg-card/50 rounded-lg border border-dashed border-border flex items-center justify-center">
          <Button onClick={generateInfographic} variant="outline" className="mac-button gap-2">
            <ImageIcon className="w-4 h-4" />
            Generate Infographic
          </Button>
        </div>
      )}
    </div>
  );
}

