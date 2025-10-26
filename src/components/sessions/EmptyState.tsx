"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, FileVideo, BookOpen } from "lucide-react";

interface EmptyStateProps {
  onGetStarted?: () => void;
}

export function EmptyState({ onGetStarted }: EmptyStateProps) {
  return (
    <div cclassName="flex items-center justify-center min-h-[60vh]">
      <Card cclassName="mac-card max-w-2xl w-full">
        <CardHeader cclassName="text-center">
          <div cclassName="mx-auto mb-4 h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center">
            <FileVideo cclassName="h-8 w-8 text-purple-400" />
          </div>
          <CardTitle cclassName="mac-heading text-2xl">No Sessions Yet</CardTitle>
          <CardDescription cclassName="mac-body text-base mt-2">
            Start recording test sessions to see them here
          </CardDescription>
        </CardHeader>

        <CardContent cclassName="space-y-6">
          {/* Getting Started Guide */}
          <div cclassName="space-y-4">
            <h3 cclassName="mac-title text-lg font-light flex items-center gap-2">
              <BookOpen cclassName="h-5 w-5 text-purple-400" />
              Getting Started
            </h3>

            <div cclassName="space-y-3">
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
          <div cclassName="flex gap-3 justify-center pt-4">
            {onGetStarted && (
              <Button onClick={onGetStarted} cclassName="mac-button-primary gap-2">
                <Play cclassName="h-4 w-4" />
                Get Started
              </Button>
            )}
            <Button variant="outline" cclassName="mac-button-outline gap-2" asChild>
              <a href="https://docs.testsprite.com" target="_blank" rel="noopener noreferrer">
                <BookOpen cclassName="h-4 w-4" />
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
    <div cclassName="flex gap-4 items-start">
      <div cclassName="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm font-light text-purple-300">
        {number}
      </div>
      <div cclassName="flex-1 pt-0.5">
        <h4 cclassName="text-sm font-light text-white">{title}</h4>
        <p cclassName="text-xs text-zinc-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
