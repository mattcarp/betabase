"use client";

import { SelfHealingTestViewer } from "@/components/test-dashboard/SelfHealingTestViewer";

export default function SelfHealingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a1f] to-black">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="mac-heading text-3xl font-light text-white mb-2">Self-Healing Test Intelligence</h1>
          <p className="mac-body text-muted-foreground">
            AI-powered test maintenance with human-in-the-loop approval workflow
          </p>
        </div>
        <SelfHealingTestViewer />
      </div>
    </div>
  );
}
