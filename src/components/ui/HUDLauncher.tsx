import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import {
  Zap,
  Mic,
  Languages,
  Brain,
  Eye,
  EyeOff,
  Monitor,
  Keyboard,
  CheckCircle2,
  Circle,
  ExternalLink,
  Play,
  Info,
} from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status?: "ready" | "coming-soon";
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  status = "ready",
}) => (
  <div className="relative p-4 rounded-xl border border-mac-border bg-mac-surface-elevated/50 hover:bg-mac-surface-elevated transition-all duration-300 group">
    {status === "coming-soon" && (
      <Badge className="absolute -top-2 -right-2 text-xs bg-mac-accent-purple-400/20 text-mac-accent-purple-400 border-mac-accent-purple-400/30">
        Coming Soon
      </Badge>
    )}
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-mac-primary-blue-400/10 text-mac-primary-blue-400 group-hover:bg-mac-primary-blue-400/20 transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-mac-text-primary mb-1">{title}</h3>
        <p className="text-sm text-mac-text-secondary">{description}</p>
      </div>
    </div>
  </div>
);

interface ShortcutRowProps {
  keys: string[];
  description: string;
}

const ShortcutRow: React.FC<ShortcutRowProps> = ({ keys, description }) => (
  <div className="flex items-center justify-between py-2 border-b border-mac-border/50 last:border-0">
    <span className="text-sm text-mac-text-secondary">{description}</span>
    <div className="flex gap-1">
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="px-2 py-1 text-xs rounded bg-mac-surface-bg border border-mac-border text-mac-text-primary font-mono"
        >
          {key}
        </kbd>
      ))}
    </div>
  </div>
);

interface HUDLauncherProps {
  className?: string;
}

export const HUDLauncher: React.FC<HUDLauncherProps> = ({ className }) => {
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [isLaunching, setIsLaunching] = useState(false);

  // Check if mc-siam API is running
  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch("http://localhost:3000/health", {
          method: "GET",
        });
        setApiStatus(response.ok ? "online" : "offline");
      } catch {
        setApiStatus("offline");
      }
    };

    checkApi();
    const interval = setInterval(checkApi, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunch = async () => {
    setIsLaunching(true);

    // Attempt to launch Electron app via custom protocol or shell
    // For now, show instructions
    try {
      // Try custom URL scheme (would need to be registered)
      window.open("siam://launch", "_blank");
    } catch {
      // Fallback: show terminal command
      alert(
        "To launch MC-SIAM HUD:\n\n" +
          "1. Open Terminal\n" +
          "2. cd ~/Documents/projects/mc-siam/siam-electron\n" +
          "3. npm start\n\n" +
          "The transparent overlay will appear over your screen."
      );
    }

    setTimeout(() => setIsLaunching(false), 2000);
  };

  return (
    <div className={cn("relative w-full h-full overflow-auto mac-background p-8", className)}>
      {/* Background Effects */}
      <div className="mac-floating-background" />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(51, 133, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(51, 133, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mac-primary-blue-400/10 border border-mac-primary-blue-400/20">
            <Zap className="h-4 w-4 text-mac-primary-blue-400" />
            <span className="text-sm text-mac-primary-blue-400 font-medium">MC-SIAM</span>
          </div>

          <h1 className="text-4xl font-light text-mac-text-primary">Heads-Up Display</h1>

          <p className="text-lg text-mac-text-secondary max-w-2xl mx-auto">
            Your personal J.A.R.V.I.S. for meetings. A transparent overlay that provides real-time
            transcription, AI insights, and knowledge base queries — all without anyone knowing you
            have superpowers.
          </p>
        </div>

        {/* Status & Launch */}
        <Card className="mac-card-elevated border-mac-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    apiStatus === "online" && "bg-green-400 animate-pulse",
                    apiStatus === "offline" && "bg-red-400",
                    apiStatus === "checking" && "bg-yellow-400 animate-pulse"
                  )}
                />
                <div>
                  <p className="font-medium text-mac-text-primary">MC-SIAM API Server</p>
                  <p className="text-sm text-mac-text-secondary">
                    {apiStatus === "online" && "Running on localhost:3000"}
                    {apiStatus === "offline" && "Not running — start with: bun run dev"}
                    {apiStatus === "checking" && "Checking connection..."}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleLaunch}
                disabled={apiStatus !== "online" || isLaunching}
                className="mac-button mac-button-primary gap-2"
              >
                {isLaunching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Launch HUD
                  </>
                )}
              </Button>
            </div>

            {apiStatus === "offline" && (
              <div className="mt-4 p-4 rounded-lg bg-mac-surface-bg border border-mac-border">
                <p className="text-sm text-mac-text-secondary mb-2">To start the API server:</p>
                <code className="block p-3 rounded bg-black/50 text-green-400 font-mono text-sm">
                  cd ~/Documents/projects/mc-siam && bun run dev
                </code>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div>
          <h2 className="text-xl font-medium text-mac-text-primary mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={<Mic className="h-5 w-5" />}
              title="Real-Time Transcription"
              description="Live speech-to-text via Deepgram with speaker diarization. Captures both system audio and your microphone."
            />
            <FeatureCard
              icon={<Languages className="h-5 w-5" />}
              title="Maltese Spy Mode"
              description="Auto-detect and translate 24+ languages in real-time. Perfect for multilingual meetings or café reconnaissance."
            />
            <FeatureCard
              icon={<Brain className="h-5 w-5" />}
              title="AOMA Knowledge Base"
              description="Semantic search across your enterprise knowledge. Press / to query anything mid-meeting."
            />
            <FeatureCard
              icon={<EyeOff className="h-5 w-5" />}
              title="Stealth Mode"
              description="Transparent overlay that floats above all windows. Toggle visibility with Cmd+Shift+S."
            />
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <Card className="mac-card-elevated border-mac-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-mac-text-primary">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </CardTitle>
            <CardDescription>Control the HUD without touching your mouse</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <ShortcutRow keys={["⌘", "⇧", "S"]} description="Toggle HUD visibility" />
            <ShortcutRow keys={["⌘", "⇧", "M"]} description="Mute/unmute recording" />
            <ShortcutRow keys={["/"]} description="Open query input" />
            <ShortcutRow keys={["?"]} description="Show help overlay" />
            <ShortcutRow keys={["["]} description="Decrease opacity" />
            <ShortcutRow keys={["]"]} description="Increase opacity" />
            <ShortcutRow keys={[","]} description="Toggle settings panel" />
            <ShortcutRow keys={["⌘", "Q"]} description="Save transcript & quit" />
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="mac-card-elevated border-mac-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-mac-text-primary">
              <Info className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-mac-primary-blue-400/10 flex items-center justify-center text-mac-primary-blue-400 font-bold">
                  1
                </div>
                <h3 className="font-medium text-mac-text-primary">Capture</h3>
                <p className="text-sm text-mac-text-secondary">
                  BlackHole routes system audio (Zoom, Meet, Teams) to the HUD. Your mic is captured
                  separately.
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-mac-primary-blue-400/10 flex items-center justify-center text-mac-primary-blue-400 font-bold">
                  2
                </div>
                <h3 className="font-medium text-mac-text-primary">Process</h3>
                <p className="text-sm text-mac-text-secondary">
                  Audio streams to Deepgram for transcription. Text is analyzed, translated, and
                  matched against AOMA.
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-mac-primary-blue-400/10 flex items-center justify-center text-mac-primary-blue-400 font-bold">
                  3
                </div>
                <h3 className="font-medium text-mac-text-primary">Display</h3>
                <p className="text-sm text-mac-text-secondary">
                  Results appear in a transparent overlay. Insights surface automatically. You look
                  like a genius.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-mac-text-muted pt-4 border-t border-mac-border">
          <p>
            MC-SIAM HUD • Smart In A Meeting •
            <a
              href="https://github.com/mattcarpenter/mc-siam"
              className="text-mac-primary-blue-400 hover:underline ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HUDLauncher;
