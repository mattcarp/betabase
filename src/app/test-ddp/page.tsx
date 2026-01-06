"use client";

/**
 * DDP Parser Demo Page - Enhanced Visual Experience
 *
 * Interactive demo showcasing DDP parsing and MusicBrainz integration
 * with animated progress indicators and visual feedback.
 */

import React, { useState } from 'react';
import { DDPUploader, type ParsedDDP, type DDPProcessingStage } from '@/components/ddp';
import { Disc3, Database, Sparkles, CheckCircle2, Loader2, Music2, Hash, Clock, FileSearch, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DDPTestPage() {
  const [stage, setStage] = useState<DDPProcessingStage>('idle');
  const [parsedData, setParsedData] = useState<ParsedDDP | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParsed = (result: ParsedDDP) => {
    setParsedData(result);
    setError(null);
  };

  const handleStageChange = (newStage: DDPProcessingStage) => {
    setStage(newStage);
    if (newStage === 'idle' || newStage === 'error') {
      setParsedData(null);
    }
  };

  const handleError = (err: string) => {
    setError(err);
  };

  const stageInfo: Record<DDPProcessingStage, {
    icon: LucideIcon;
    label: string;
    color: string;
    bgColor: string;
    animate?: boolean;
  }> = {
    idle: {
      icon: Disc3,
      label: 'Ready to Parse',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
    },
    uploading: {
      icon: Loader2,
      label: 'Uploading Files',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      animate: true,
    },
    detecting: {
      icon: FileSearch,
      label: 'Detecting DDP Structure',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      animate: true,
    },
    parsing: {
      icon: Sparkles,
      label: 'Parsing DDP Files',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      animate: true,
    },
    musicbrainz: {
      icon: Database,
      label: 'Looking up MusicBrainz',
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
      animate: true,
    },
    complete: {
      icon: CheckCircle2,
      label: 'Complete',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    error: {
      icon: Disc3,
      label: 'Error',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
  };

  const currentStageInfo = stageInfo[stage];
  const StageIcon = currentStageInfo.icon;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Disc3 className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">DDP Master Parser</span>
          </div>
          <h1 className="mac-heading text-4xl font-normal text-foreground">
            CD Master Analysis Demo
          </h1>
          <p className="mac-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload a DDP folder to extract metadata, track listings, and enrich with
            official release information from MusicBrainz.
          </p>
        </div>

        {/* Processing Stage Indicator */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${currentStageInfo.bgColor} transition-all duration-300`}>
                <StageIcon
                  className={`h-6 w-6 ${currentStageInfo.color} ${currentStageInfo.animate ? 'animate-spin' : ''}`}
                />
              </div>
              <div>
                <h3 className="mac-title text-foreground">{currentStageInfo.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {stage === 'idle' && 'Drop a DDP folder or select files to begin'}
                  {stage === 'uploading' && 'Reading DDP component files...'}
                  {stage === 'detecting' && 'Analyzing folder structure and identifying DDP files...'}
                  {stage === 'parsing' && 'Extracting tracks, CD-TEXT, and metadata...'}
                  {stage === 'musicbrainz' && 'Querying MusicBrainz database...'}
                  {stage === 'complete' && 'All data extracted successfully'}
                  {stage === 'error' && (error || 'An error occurred during processing')}
                </p>
              </div>
            </div>
            {stage !== 'idle' && (
              <Badge
                variant={stage === 'complete' ? 'default' : 'secondary'}
                className="animate-pulse"
              >
                {stage === 'complete' ? 'Done' : 'Processing...'}
              </Badge>
            )}
          </div>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center gap-2">
            {(['detecting', 'parsing', 'musicbrainz', 'complete'] as DDPProcessingStage[]).map((s, idx) => {
              const progressStages: DDPProcessingStage[] = ['detecting', 'parsing', 'musicbrainz', 'complete'];
              const currentIdx = progressStages.indexOf(stage);
              const stepIdx = progressStages.indexOf(s);

              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                      stage === s
                        ? 'bg-primary animate-pulse'
                        : currentIdx > stepIdx
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-4 bg-red-500/10 border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </Card>
        )}

        {/* Quick Stats (shown when parsed) */}
        {parsedData && stage === 'complete' && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-card border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Music2 className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground">
                    {parsedData.tracks.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Tracks</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Clock className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground">
                    {Math.floor(parsedData.tracks.reduce((sum, t) => sum + (t.duration || 0), 0) / 60)}min
                  </div>
                  <div className="text-xs text-muted-foreground">Total Duration</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10">
                  <Hash className="h-4 w-4 text-teal-400" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground">
                    {parsedData.upc ? 'Yes' : 'No'}
                  </div>
                  <div className="text-xs text-muted-foreground">UPC Barcode</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Info Card */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Disc3 className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="mac-title font-normal text-foreground">What is DDP?</h3>
              <p className="text-sm text-muted-foreground">
                DDP (Disc Description Protocol) is the industry standard for CD mastering.
                A DDP image contains all the data needed to manufacture CDs, including:
              </p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>DDPMS - Map Stream (TOC)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>DDPID - Disc Identification</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>DDPPQ - Subcode & Timing</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>CD-TEXT - Metadata</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Uploader Component */}
        <DDPUploader
          onParsed={handleParsed}
          onStageChange={handleStageChange}
          onError={handleError}
        />
      </div>
    </div>
  );
}
