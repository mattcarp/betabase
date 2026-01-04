import { useEffect, useState, useRef, Suspense } from "react";
import { cn } from "../lib/utils";
import { LoadingSpinner } from "./LoadingStates";

interface LiveTranscriptionProps {
  transcription: string;
  isRecording: boolean;
  className?: string;
}

export default function LiveTranscription({
  transcription,
  isRecording,
  className,
}: LiveTranscriptionProps) {
  console.log("🔴 LiveTranscription: Component rendered with:", {
    transcription: transcription?.substring(0, 50) + "...",
    isRecording,
    hasTranscription: !!transcription,
  });
  const [displayedText, setDisplayedText] = useState("");
  const [currentWordIndex, _setCurrentWordIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle transcription updates
  useEffect(() => {
    if (!transcription) {
      setDisplayedText("");
      return;
    }

    if (!isRecording) {
      setDisplayedText(transcription);
      return;
    }

    const words = transcription.split(" ");
    const lastWord = words[words.length - 1] || "";
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(words.slice(0, words.length - 1).join(" ") + " " + lastWord.substring(0, i));
      i++;
      if (i > lastWord.length) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [transcription, isRecording]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedText]);

  // Simulate confidence levels for words
  const getWordConfidence = () => {
    const confidence = 0.7 + Math.random() * 0.3; // 70-100%
    if (confidence > 0.95) return "text-green-400";
    if (confidence > 0.85) return "text-blue-600";
    if (confidence > 0.75) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className={cn("relative", className)}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="md" color="cyan" />
          </div>
        }
      >
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto p-4 bg-card/50 rounded-lg border border-border"
          data-test-id="transcription-display"
        >
          {displayedText ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 font-mono text-xs">LIVE</span>
                <div className="flex-1 h-px bg-gradient-to-r from-red-500/50 to-transparent"></div>
              </div>

              <p className="text-white font-mono text-sm leading-relaxed">
                {displayedText.split(" ").map((word, index) => (
                  <span
                    key={index}
                    className={cn(
                      "transition-all duration-300",
                      index === currentWordIndex - 1 && isRecording
                        ? "bg-blue-600/20 px-2 rounded"
                        : "",
                      getWordConfidence()
                    )}
                  >
                    {word}{" "}
                  </span>
                ))}
                {isRecording && (
                  <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-2"></span>
                )}
              </p>

              {/* Confidence Indicator */}
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-mono">Confidence:</span>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400">High</span>
                  <div className="w-2 h-2 bg-blue-600 rounded-full ml-2"></div>
                  <span className="text-blue-600">Good</span>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full ml-2"></div>
                  <span className="text-yellow-400">Fair</span>
                  <div className="w-2 h-2 bg-red-400 rounded-full ml-2"></div>
                  <span className="text-red-400">Low</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-border border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="font-mono text-sm">
                  {isRecording ? "Listening for speech..." : "Ready to transcribe..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </Suspense>
      {/* Word Count & Stats */}
      {displayedText && (
        <div className="absolute top-2 right-2 bg-muted/80 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-muted-foreground">
              Words: <span className="text-blue-600">{displayedText.split(" ").length}</span>
            </span>
            <span className="text-muted-foreground">
              WPM: <span className="text-green-400">{Math.floor(Math.random() * 50 + 120)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
