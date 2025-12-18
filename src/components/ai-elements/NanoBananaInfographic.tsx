"use client";

import { useState, useEffect } from 'react';
import { Download, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface NanoBananaInfographicProps {
  prompt: string;
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
      console.log('🍌 Nano Banana: Generating infographic...');
      
      const response = await fetch('/api/generate-infographic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio, imageSize })
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-yellow-400" />
          <h3 className="text-sm font-medium text-zinc-300">
            🍌 Nano Banana Pro Infographic
          </h3>
          {sizeKB > 0 && (
            <span className="text-xs text-zinc-500">
              {sizeKB} KB • {imageSize} • {aspectRatio}
            </span>
          )}
        </div>
        
        {imageUrl && (
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="w-full aspect-video bg-zinc-900/50 rounded-lg border border-zinc-800 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
          <div className="text-center">
            <p className="text-sm text-zinc-300 font-medium">Generating infographic...</p>
            <p className="text-xs text-zinc-500 mt-1">Gemini 3 Pro is drawing your visualization</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isGenerating && (
        <div className="w-full aspect-video bg-red-900/10 rounded-lg border border-red-500/30 flex flex-col items-center justify-center gap-4 p-6">
          <p className="text-sm text-red-400">Failed to generate infographic</p>
          <p className="text-xs text-red-300/70">{error}</p>
          <Button onClick={generateInfographic} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      )}

      {/* Generated Image */}
      {imageUrl && !isGenerating && (
        <div className="relative w-full aspect-video bg-zinc-900/30 rounded-lg border border-zinc-800 overflow-hidden group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Generated infographic"
            className="w-full h-full object-contain"
          />
          
          {/* Hover overlay with prompt */}
          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-6">
            <div className="text-center max-w-2xl">
              <p className="text-xs text-zinc-400 mb-2">Prompt used:</p>
              <p className="text-sm text-zinc-200">{prompt}</p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Generate Button (if auto-generate disabled) */}
      {!autoGenerate && !imageUrl && !isGenerating && (
        <div className="w-full aspect-video bg-zinc-900/50 rounded-lg border border-dashed border-zinc-700 flex items-center justify-center">
          <Button onClick={generateInfographic} variant="outline" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            Generate Infographic
          </Button>
        </div>
      )}
    </div>
  );
}

