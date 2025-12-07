/**
 * Quick Fix Panel Component
 *
 * Allows curators to edit and save response corrections as training examples
 * Part of Fix tab in Phase 5.2
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Input } from "./input";
import { Badge } from "./badge";
import { Edit3, Save, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface QuickFixPanelProps {
  messageId?: string;
}

export function QuickFixPanel({ messageId }: QuickFixPanelProps) {
  const [searchId, setSearchId] = useState(messageId || "");
  const [original, setOriginal] = useState("");
  const [corrected, setCorrected] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClientComponentClient();

  const loadMessage = async () => {
    if (!searchId.trim()) {
      toast.error("Please enter a message ID");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("rlhf_feedback")
        .select("ai_response, feedback_text")
        .eq("id", searchId)
        .single();

      if (error) {
        console.error("Failed to load message:", error);
        toast.error("Message not found");
        return;
      }

      setOriginal(data.ai_response || "");
      setCorrected(data.feedback_text || data.ai_response || "");
      setLoaded(true);
      toast.success("Message loaded for editing");
    } catch (error) {
      console.error("Error loading message:", error);
      toast.error("Failed to load message");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!corrected.trim() || corrected === original) {
      toast.error("Please make changes before saving");
      return;
    }

    setSaving(true);

    try {
      // Save as training example with high rating
      const { error } = await supabase
        .from("rlhf_feedback")
        .update({
          feedback_text: corrected,
          rating: 5, // Mark as high-quality training example
          thumbs_up: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", searchId);

      if (error) {
        console.error("Failed to save correction:", error);
        throw error;
      }

      toast.success("Correction saved as training example! 💜", {
        description: "This correction will influence future responses",
      });

      // Reset for next edit
      setOriginal(corrected);
    } catch (error) {
      console.error("Error saving correction:", error);
      toast.error("Failed to save correction");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCorrected(original);
    toast.info("Reverted to original response");
  };

  return (
    <Card className="h-full flex flex-col bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100">
          <Edit3 className="h-5 w-5 text-blue-400" />
          Quick Fix Panel
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Edit AI responses and save corrections as training data
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Search for message */}
        {!loaded && (
          <div className="flex gap-2">
            <Input
              placeholder="Enter message or feedback ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1 bg-zinc-900/50 border-zinc-800"
            />
            <Button onClick={loadMessage} disabled={loading || !searchId.trim()} className="gap-2">
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4" />
                  Load
                </>
              )}
            </Button>
          </div>
        )}

        {/* Edit interface */}
        {loaded && (
          <>
            <div className="flex-1 grid grid-cols-2 gap-4">
              {/* Original response */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-400" />
                  Original Response
                </label>
                <Textarea
                  value={original}
                  disabled
                  className="flex-1 bg-zinc-900/30 border-zinc-800 text-zinc-400 font-mono text-xs resize-none"
                />
              </div>

              {/* Corrected response */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Corrected Response
                </label>
                <Textarea
                  value={corrected}
                  onChange={(e) => setCorrected(e.target.value)}
                  placeholder="Edit the response to improve it..."
                  className={cn(
                    "flex-1 bg-zinc-900/50 border-zinc-700 text-zinc-200 font-mono text-xs resize-none",
                    corrected !== original && "border-green-500/50 bg-green-500/5"
                  )}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-4 border-t border-zinc-800">
              <Button
                onClick={handleSaveCorrection}
                disabled={saving || !corrected.trim() || corrected === original}
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save as Training Example
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={corrected === original}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setLoaded(false);
                  setSearchId("");
                  setOriginal("");
                  setCorrected("");
                }}
                className="gap-2"
              >
                New
              </Button>
            </div>

            {/* Change indicator */}
            {corrected !== original && (
              <Badge className="self-start bg-green-500/20 text-green-300 border-green-500/30">
                ✨ Changes detected - ready to save
              </Badge>
            )}
          </>
        )}

        {/* Empty state */}
        {!loaded && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500">
            <Edit3 className="h-16 w-16 mb-4 text-zinc-700" />
            <p className="text-lg mb-2">No message loaded</p>
            <p className="text-sm">Enter a message ID above to start editing</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
