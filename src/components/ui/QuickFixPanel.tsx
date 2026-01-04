/**
 * Quick Fix Panel Component
 *
 * Allows curators to edit and save response corrections as training examples
 * Part of Fix tab in Phase 5.2
 * 
 * Enhanced 2025-12-16: Added recent items dropdown for demo
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Input } from "./input";
import { Badge } from "./badge";
import { Edit3, Save, RefreshCw, CheckCircle, AlertCircle, ChevronDown, Clock, ThumbsDown, AlertTriangle } from "lucide-react";
import { useSupabaseClient } from "../../hooks/useSupabaseClient";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface RecentFeedback {
  id: string;
  query: string;
  thumbs_up: boolean | null;
  rating: number | null;
  created_at: string;
  status: string;
  severity: string | null;
}

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
  const [queryText, setQueryText] = useState("");
  const [recentItems, setRecentItems] = useState<RecentFeedback[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const supabase = useSupabaseClient();

  // Load recent items that need fixing (negative feedback)
  useEffect(() => {
    loadRecentItems();
  }, []);

  const loadRecentItems = async () => {
    setLoadingRecent(true);
    try {
      const { data, error } = await supabase
        .from("rlhf_feedback")
        .select("id, query, user_query, feedback_type, feedback_value, created_at, status, feedback_metadata")
        .or("feedback_type.eq.thumbs_down,status.eq.rejected")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Failed to load recent items:", error);
      } else {
        setRecentItems(data?.map(item => ({
          ...item,
          query: item.query || item.user_query || "Unknown query",
          thumbs_up: item.feedback_type === "thumbs_up",
          rating: item.feedback_value?.score ?? null,
          severity: item.feedback_metadata?.severity ?? null
        })) || []);
      }
    } catch (error) {
      console.error("Error loading recent items:", error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const loadMessage = async (idToLoad?: string) => {
    const targetId = idToLoad || searchId;
    if (!targetId.trim()) {
      toast.error("Please enter a message ID");
      return;
    }

    setLoading(true);
    setSearchId(targetId);

    try {
      const { data, error } = await supabase
        .from("rlhf_feedback")
        .select("response, query, user_query, feedback_metadata")
        .eq("id", targetId)
        .single();

      if (error) {
        console.error("Failed to load message:", error);
        toast.error("Message not found");
        return;
      }

      const responseText = data.response || "";
      setOriginal(responseText);
      setCorrected(data.feedback_metadata?.correction || data.feedback_metadata?.text || responseText);
      setQueryText(data.query || data.user_query || "");
      setLoaded(true);
      setShowRecent(false);
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
          feedback_type: "correction",
          feedback_value: { score: 5 },
          feedback_metadata: { 
            correction: corrected,
            original_response: original,
            severity: "resolved"
          },
          status: "approved",
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
    <Card className="h-full flex flex-col bg-card/50 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Edit3 className="h-5 w-5 text-blue-400" />
          Quick Fix Panel
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Edit AI responses and save corrections as training data
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Search for message */}
        {!loaded && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Enter message or feedback ID..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onFocus={() => setShowRecent(true)}
                  className="bg-card/50 border-border pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => {
                    setShowRecent(!showRecent);
                    if (!showRecent) loadRecentItems();
                  }}
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showRecent && "rotate-180")} />
                </Button>

                {/* Recent items dropdown - only shows negative feedback */}
                {showRecent && recentItems.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                    <div className="p-2 border-b border-border text-xs text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-orange-400" />
                      Responses Needing Correction
                      {loadingRecent && <RefreshCw className="h-3 w-3 animate-spin ml-auto" />}
                    </div>
                    {recentItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadMessage(item.id)}
                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <ThumbsDown className="h-3 w-3 text-red-400" />
                          {item.severity === "critical" && <AlertTriangle className="h-3 w-3 text-red-400" />}
                          <span className="text-xs text-foreground truncate flex-1">
                            {item.query?.substring(0, 60)}...
                          </span>
                          <span className="text-xs text-muted-foreground">{formatTimeAgo(item.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-[10px] text-muted-foreground font-mono">{item.id.substring(0, 8)}...</code>
                          {item.rating && (
                            <Badge variant="outline" className="text-[10px] h-4 border-red-500/50 text-red-400">
                              {item.rating}/5
                            </Badge>
                          )}
                          {item.severity && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] h-4",
                                item.severity === "critical" && "border-red-500/50 text-red-400",
                                item.severity === "major" && "border-orange-500/50 text-orange-400",
                                item.severity === "minor" && "border-yellow-500/50 text-yellow-400"
                              )}
                            >
                              {item.severity}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={() => loadMessage()} disabled={loading || !searchId.trim()} className="gap-2">
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
            
            {/* Quick access hint */}
            {recentItems.length > 0 && !showRecent && (
              <p className="text-xs text-muted-foreground">
                {recentItems.length} responses need correction. Click the dropdown to view them.
              </p>
            )}
          </div>
        )}

        {/* Edit interface */}
        {loaded && (
          <>
            {/* Show the original query */}
            {queryText && (
              <Card className="bg-card/30 border-border">
                <CardContent className="py-3">
                  <div className="text-xs text-muted-foreground mb-1">Original Query:</div>
                  <p className="text-sm text-foreground">{queryText}</p>
                </CardContent>
              </Card>
            )}

            <div className="flex-1 grid grid-cols-2 gap-4">
              {/* Original response */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-400" />
                  Original Response
                </label>
                <Textarea
                  value={original}
                  disabled
                  className="flex-1 bg-card/30 border-border text-muted-foreground font-mono text-xs resize-none"
                />
              </div>

              {/* Corrected response */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Corrected Response
                </label>
                <Textarea
                  value={corrected}
                  onChange={(e) => setCorrected(e.target.value)}
                  placeholder="Edit the response to improve it..."
                  className={cn(
                    "flex-1 bg-card/50 border-border text-foreground font-mono text-xs resize-none",
                    corrected !== original && "border-green-500/50 bg-green-500/5"
                  )}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-4 border-t border-border">
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
                  setQueryText("");
                  loadRecentItems(); // Refresh the list
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
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
            <Edit3 className="h-16 w-16 mb-4 text-muted" />
            <p className="text-lg mb-2">No message loaded</p>
            <p className="text-sm">Enter a message ID above to start editing</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
