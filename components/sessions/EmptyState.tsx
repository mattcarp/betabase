"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Play, FileVideo, BookOpen } from "lucide-react";

interface EmptyStateProps {
  onGetStarted?: () => void;
}

export function EmptyState({ onGetStarted }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="mac-card max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center">
            <FileVideo className="h-8 w-8 text-purple-400" />
          </div>
          <CardTitle className="mac-heading text-2xl">No Sessions Yet</CardTitle>
          <CardDescription className="mac-body text-base mt-2">
            Start recording test sessions to see them here
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Getting Started Guide */}
          <div className="space-y-4">
            <h3 className="mac-title text-lg font-light flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-400" />
              Getting Started
            </h3>

            <div className="space-y-3">
              <Step
                number={1}
                title="Install TestSprite Browser Extension"
                description="Install the TestSprite extension for Chrome, Firefox, or Edge"
              />
              <Step
                number={2}
                title="Start Recording"
                description="Navigate to your application and click the TestSprite icon to start recording"
              />
              <Step
                number={3}
                title="Interact with Your Application"
                description="Perform actions you want to test - clicks, typing, navigation, etc."
              />
              <Step
                number={4}
                title="Stop Recording"
                description="Click stop when done. Your session will automatically sync to SIAM"
              />
              <Step
                number={5}
                title="Review & Playback"
                description="View your recorded sessions here and play them back to analyze behavior"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center pt-4">
            {onGetStarted && (
              <Button onClick={onGetStarted} className="mac-button-primary gap-2">
                <Play className="h-4 w-4" />
                Get Started
              </Button>
            )}
            <Button variant="outline" className="mac-button-outline gap-2" asChild>
              <a href="https://docs.testsprite.com" target="_blank" rel="noopener noreferrer">
                <BookOpen className="h-4 w-4" />
                View Documentation
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm font-light text-purple-300">
        {number}
      </div>
      <div className="flex-1 pt-0.5">
        <h4 className="text-sm font-light text-white">{title}</h4>
        <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
