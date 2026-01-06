"use client";

import React, { useState, useRef } from "react";
import { Bug, X, Camera, Send } from "lucide-react";
import { toPng } from "html-to-image";

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // In a real app, this would submit to an API
  onSubmit: (data: any) => void;
}

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [issueType, setIssueType] = useState<"bug" | "blocker" | "feature">("bug");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isTakingScreenshot, setIsTakingScreenshot] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleTakeScreenshot = async () => {
    setIsTakingScreenshot(true);
    // Hide the dialog momentarily
    if (dialogRef.current) dialogRef.current.style.opacity = "0";

    // Wait for the render to update (hiding dialog)
    setTimeout(async () => {
      try {
        const dataUrl = await toPng(document.body, { cacheBust: true });
        setScreenshot(dataUrl);
      } catch (error) {
        console.error("Failed to take screenshot:", error);
      } finally {
        // Show dialog again
        if (dialogRef.current) dialogRef.current.style.opacity = "1";
        setIsTakingScreenshot(false);
      }
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      issueType,
      description,
      screenshot,
      timestamp: new Date().toISOString(),
    });
    // Reset and close
    setDescription("");
    setScreenshot(null);
    onClose();
  };

  if (isTakingScreenshot) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        ref={dialogRef}
        className="mac-card w-full max-w-md mx-4 bg-mac-surface-elevated border-mac-border shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between p-4 border-b border-mac-border">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-orange-500" />
            <h3 className="mac-title text-base font-semibold">Report Issue</h3>
          </div>
          <button
            onClick={onClose}
            className="text-mac-text-muted hover:text-mac-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-mac-text-secondary">Type</label>
            <div className="flex gap-2">
              {(["bug", "blocker", "feature"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setIssueType(type)}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium capitalize border transition-all
                    ${
                      issueType === type
                        ? "bg-mac-accent-primary-400/20 text-mac-accent-primary-400 border-mac-accent-primary-400"
                        : "bg-mac-surface-bg text-mac-text-secondary border-mac-border hover:border-mac-text-muted"
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-mac-text-secondary">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What went wrong?"
              className="w-full h-24 mac-input p-3 text-sm resize-none rounded-md bg-mac-surface-bg border-mac-border focus:border-mac-accent-primary-400 focus:ring-1 focus:ring-mac-accent-primary-400 outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-mac-text-secondary">Screenshot</label>
              {screenshot && (
                <button
                  type="button"
                  onClick={() => setScreenshot(null)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            
            {!screenshot ? (
              <button
                type="button"
                onClick={handleTakeScreenshot}
                className="w-full py-8 border-2 border-dashed border-mac-border rounded-lg text-mac-text-muted hover:text-mac-text-primary hover:border-mac-text-muted hover:bg-mac-surface-bg/50 transition-all flex flex-col items-center gap-2"
              >
                <Camera className="h-8 w-8 opacity-50" />
                <span className="text-sm">Capture Screenshot</span>
              </button>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-mac-border">
                <img src={screenshot} alt="Preview" className="w-full h-32 object-cover" />
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="mac-button-ghost px-4 py-2 text-sm text-mac-text-secondary hover:text-mac-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
            >
              Submit Report
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
