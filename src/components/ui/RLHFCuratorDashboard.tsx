"use client";

/**
 * RLHF Curator Dashboard
 *
 * Real RLHF implementation with:
 * - Live feedback from Supabase
 * - Preference pair collection (the KEY for DPO)
 * - Export to JSONL for fine-tuning
 * - Metrics visualization
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";
import { Textarea } from "./textarea";
import { Input } from "./input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Database,
  TrendingUp,
  Clock,
  Filter,
  Search,
  ChevronRight,
  Edit3,
  Save,
  X,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { createBrowserClient } from "@supabase/ssr";

// Types
interface FeedbackRecord {
  id: string;
  session_id: string;
  conversation_id: string;
  query: string;
  response: string;
  retrieved_contexts: any[];
  rating: number | null;
  thumbs_up: boolean | null;
  feedback_text: string | null;
  correction: string | null;
  curator_approved: boolean;
  model_used: string;
  created_at: string;
  updated_at: string;
}

interface PreferencePair {
  id: string;
  prompt: string;
  chosen: string;
  rejected: string;
  source_type: string;
  confidence: number;
  curator_verified: boolean;
  created_at: string;
  exported_at: string | null;
}

interface DashboardStats {
  totalFeedback: number;
  pendingReview: number;
  positiveRate: number;
  correctionRate: number;
  preferencePairs: number;
  verifiedPairs: number;
  exportReady: number;
}

// Main Dashboard Component
export function RLHFCuratorDashboard() {
  const [activeTab, setActiveTab] = useState("queue");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadStats = useCallback(async () => {
    try {
      // Get total feedback count
      const { count: totalFeedback } = await supabase
        .from("rlhf_feedback")
        .select("*", { count: "exact", head: true });

      // Get pending review count (no curator_approved or low rating without correction)
      const { count: pendingReview } = await supabase
        .from("rlhf_feedback")
        .select("*", { count: "exact", head: true })
        .or("curator_approved.is.null,curator_approved.eq.false")
        .or("rating.lt.4,thumbs_up.eq.false");

      // Get positive feedback rate
      const { data: positiveData } = await supabase
        .from("rlhf_feedback")
        .select("thumbs_up, rating")
        .not("thumbs_up", "is", null);

      const positiveCount = positiveData?.filter(
        (r) => r.thumbs_up === true || (r.rating && r.rating >= 4)
      ).length || 0;
      const positiveRate = positiveData && positiveData.length > 0
        ? (positiveCount / positiveData.length) * 100
        : 0;

      // Get correction rate (negative feedback with corrections)
      const { count: negativeWithCorrection } = await supabase
        .from("rlhf_feedback")
        .select("*", { count: "exact", head: true })
        .or("thumbs_up.eq.false,rating.lt.3")
        .not("correction", "is", null);

      const { count: totalNegative } = await supabase
        .from("rlhf_feedback")
        .select("*", { count: "exact", head: true })
        .or("thumbs_up.eq.false,rating.lt.3");

      const correctionRate = totalNegative && totalNegative > 0
        ? ((negativeWithCorrection || 0) / totalNegative) * 100
        : 0;

      // Get preference pairs stats
      const { count: preferencePairs } = await supabase
        .from("preference_pairs")
        .select("*", { count: "exact", head: true });

      const { count: verifiedPairs } = await supabase
        .from("preference_pairs")
        .select("*", { count: "exact", head: true })
        .eq("curator_verified", true);

      const { count: exportReady } = await supabase
        .from("preference_pairs")
        .select("*", { count: "exact", head: true })
        .eq("curator_verified", true)
        .is("exported_at", null);

      setStats({
        totalFeedback: totalFeedback || 0,
        pendingReview: pendingReview || 0,
        positiveRate,
        correctionRate,
        preferencePairs: preferencePairs || 0,
        verifiedPairs: verifiedPairs || 0,
        exportReady: exportReady || 0,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
              <Database className="h-7 w-7 text-purple-400" />
              RLHF Curator Dashboard
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Collect preference data for DPO fine-tuning
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              loadStats();
            }}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-7 gap-4 mt-6">
            <StatCard
              label="Total Feedback"
              value={stats.totalFeedback}
              icon={<Database className="h-4 w-4" />}
              color="blue"
            />
            <StatCard
              label="Pending Review"
              value={stats.pendingReview}
              icon={<Clock className="h-4 w-4" />}
              color="amber"
            />
            <StatCard
              label="Positive Rate"
              value={`${stats.positiveRate.toFixed(1)}%`}
              icon={<ThumbsUp className="h-4 w-4" />}
              color="green"
            />
            <StatCard
              label="Correction Rate"
              value={`${stats.correctionRate.toFixed(1)}%`}
              icon={<Edit3 className="h-4 w-4" />}
              color="purple"
            />
            <StatCard
              label="Preference Pairs"
              value={stats.preferencePairs}
              icon={<FileText className="h-4 w-4" />}
              color="cyan"
            />
            <StatCard
              label="Verified Pairs"
              value={stats.verifiedPairs}
              icon={<CheckCircle className="h-4 w-4" />}
              color="emerald"
            />
            <StatCard
              label="Export Ready"
              value={stats.exportReady}
              icon={<Download className="h-4 w-4" />}
              color="rose"
              highlight
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-6 mt-4 bg-zinc-900/50 border border-zinc-800/50">
          <TabsTrigger value="queue" className="data-[state=active]:bg-purple-500/20">
            Review Queue
          </TabsTrigger>
          <TabsTrigger value="pairs" className="data-[state=active]:bg-purple-500/20">
            Preference Pairs
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-purple-500/20">
            Export Training Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="flex-1 p-6">
          <ReviewQueue supabase={supabase} onUpdate={loadStats} />
        </TabsContent>

        <TabsContent value="pairs" className="flex-1 p-6">
          <PreferencePairsView supabase={supabase} onUpdate={loadStats} />
        </TabsContent>

        <TabsContent value="export" className="flex-1 p-6">
          <ExportPanel supabase={supabase} stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  color,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  return (
    <Card className={cn(
      "border",
      colorClasses[color],
      highlight && "ring-2 ring-rose-500/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={colorClasses[color].split(" ")[0]}>{icon}</span>
          <span className="text-xs text-zinc-400">{label}</span>
        </div>
        <div className="text-2xl font-bold text-zinc-100">{value}</div>
      </CardContent>
    </Card>
  );
}

// Review Queue Component
function ReviewQueue({
  supabase,
  onUpdate,
}: {
  supabase: any;
  onUpdate: () => void;
}) {
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [selectedItem, setSelectedItem] = useState<FeedbackRecord | null>(null);
  const [correction, setCorrection] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "negative" | "no-correction">("negative");

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("rlhf_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter === "negative") {
        query = query.or("thumbs_up.eq.false,rating.lt.3");
      } else if (filter === "no-correction") {
        query = query.or("thumbs_up.eq.false,rating.lt.3").is("correction", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Failed to load review queue:", error);
      toast.error("Failed to load review queue");
    } finally {
      setLoading(false);
    }
  }, [supabase, filter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (selectedItem) {
      setCorrection(selectedItem.correction || "");
    }
  }, [selectedItem]);

  const handleSaveCorrection = async () => {
    if (!selectedItem || !correction.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("rlhf_feedback")
        .update({
          correction: correction.trim(),
          curator_approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedItem.id);

      if (error) throw error;

      toast.success("Correction saved! Preference pair created automatically.");
      setSelectedItem(null);
      setCorrection("");
      loadItems();
      onUpdate();
    } catch (error) {
      console.error("Failed to save correction:", error);
      toast.error("Failed to save correction");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAsIs = async () => {
    if (!selectedItem) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("rlhf_feedback")
        .update({
          curator_approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedItem.id);

      if (error) throw error;

      toast.success("Response approved as-is");
      setSelectedItem(null);
      loadItems();
      onUpdate();
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error("Failed to approve");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Queue List */}
      <Card className="border-zinc-800/50 bg-zinc-900/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Feedback Needing Review
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "negative" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter("negative")}
              >
                Negative
              </Button>
              <Button
                variant={filter === "no-correction" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter("no-correction")}
              >
                No Correction
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                <CheckCircle className="h-8 w-8 mb-2" />
                <p>No items to review</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      selectedItem?.id === item.id
                        ? "bg-purple-500/10 border-purple-500/30"
                        : "bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {item.thumbs_up === false ? (
                          <ThumbsDown className="h-4 w-4 text-rose-400" />
                        ) : item.rating && item.rating < 3 ? (
                          <Star className="h-4 w-4 text-amber-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                        )}
                        <span className="text-xs text-zinc-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {item.correction && (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                            Has Correction
                          </Badge>
                        )}
                        {item.curator_approved && (
                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                            Approved
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300 line-clamp-2 mb-1">
                      Q: {item.query}
                    </p>
                    <p className="text-xs text-zinc-500 line-clamp-1">
                      A: {item.response?.substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Panel */}
      <Card className="border-zinc-800/50 bg-zinc-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-purple-400" />
            Provide Correction
          </CardTitle>
          <CardDescription>
            Enter what the response SHOULD have been. This creates a preference pair for DPO training.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedItem ? (
            <div className="space-y-4">
              {/* Original Query */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">
                  User Query
                </label>
                <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <p className="text-sm text-zinc-200">{selectedItem.query}</p>
                </div>
              </div>

              {/* Original Response (Rejected) */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block flex items-center gap-2">
                  <XCircle className="h-3 w-3 text-rose-400" />
                  Original Response (will be rejected)
                </label>
                <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                  <p className="text-sm text-zinc-300">{selectedItem.response}</p>
                </div>
              </div>

              {/* Correction (Chosen) */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  Correct Response (will be chosen)
                </label>
                <Textarea
                  value={correction}
                  onChange={(e) => setCorrection(e.target.value)}
                  placeholder="Enter what the response SHOULD have been..."
                  className="min-h-[150px] bg-green-500/5 border-green-500/20 focus:border-green-500/50"
                />
              </div>

              {/* User Feedback Context */}
              {selectedItem.feedback_text && (
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">
                    User's Feedback
                  </label>
                  <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                    <p className="text-sm text-zinc-400 italic">"{selectedItem.feedback_text}"</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800/50">
                <Button
                  onClick={handleSaveCorrection}
                  disabled={saving || !correction.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Correction & Create Pair
                </Button>
                <Button
                  variant="outline"
                  onClick={handleApproveAsIs}
                  disabled={saving}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve As-Is
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedItem(null);
                    setCorrection("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-zinc-500">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p>Select an item to review</p>
              <p className="text-xs mt-1">Click on any feedback item to provide a correction</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Preference Pairs View
function PreferencePairsView({
  supabase,
  onUpdate,
}: {
  supabase: any;
  onUpdate: () => void;
}) {
  const [pairs, setPairs] = useState<PreferencePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");

  const loadPairs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("preference_pairs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter === "verified") {
        query = query.eq("curator_verified", true);
      } else if (filter === "unverified") {
        query = query.eq("curator_verified", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPairs(data || []);
    } catch (error) {
      console.error("Failed to load preference pairs:", error);
      toast.error("Failed to load preference pairs");
    } finally {
      setLoading(false);
    }
  }, [supabase, filter]);

  useEffect(() => {
    loadPairs();
  }, [loadPairs]);

  const handleVerify = async (pairId: string) => {
    try {
      const { error } = await supabase
        .from("preference_pairs")
        .update({ curator_verified: true })
        .eq("id", pairId);

      if (error) throw error;

      toast.success("Pair verified for training");
      loadPairs();
      onUpdate();
    } catch (error) {
      console.error("Failed to verify pair:", error);
      toast.error("Failed to verify pair");
    }
  };

  const handleDelete = async (pairId: string) => {
    try {
      const { error } = await supabase
        .from("preference_pairs")
        .delete()
        .eq("id", pairId);

      if (error) throw error;

      toast.success("Pair deleted");
      loadPairs();
      onUpdate();
    } catch (error) {
      console.error("Failed to delete pair:", error);
      toast.error("Failed to delete pair");
    }
  };

  return (
    <Card className="border-zinc-800/50 bg-zinc-900/30 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            Preference Pairs for DPO Training
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "verified" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("verified")}
            >
              Verified
            </Button>
            <Button
              variant={filter === "unverified" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("unverified")}
            >
              Unverified
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : pairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
              <Database className="h-8 w-8 mb-2" />
              <p>No preference pairs yet</p>
              <p className="text-xs mt-1">Add corrections to create training data</p>
            </div>
          ) : (
            <div className="p-3 space-y-4">
              {pairs.map((pair) => (
                <div
                  key={pair.id}
                  className="p-4 rounded-lg border border-zinc-800/50 bg-zinc-900/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {pair.source_type}
                      </Badge>
                      <span className="text-xs text-zinc-500">
                        Confidence: {(pair.confidence * 100).toFixed(0)}%
                      </span>
                      {pair.curator_verified && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {pair.exported_at && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          <Download className="h-3 w-3 mr-1" />
                          Exported
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500">
                      {new Date(pair.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Prompt */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Prompt</label>
                    <p className="text-sm text-zinc-200 bg-zinc-800/50 p-2 rounded">{pair.prompt}</p>
                  </div>

                  {/* Chosen vs Rejected */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-green-400 mb-1 block flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Chosen (Correct)
                      </label>
                      <p className="text-xs text-zinc-300 bg-green-500/5 border border-green-500/20 p-2 rounded line-clamp-4">
                        {pair.chosen}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-rose-400 mb-1 block flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Rejected (Original)
                      </label>
                      <p className="text-xs text-zinc-300 bg-rose-500/5 border border-rose-500/20 p-2 rounded line-clamp-4">
                        {pair.rejected}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800/50">
                    {!pair.curator_verified && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                        onClick={() => handleVerify(pair.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verify for Training
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-400 hover:bg-rose-500/10"
                      onClick={() => handleDelete(pair.id)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Export Panel
function ExportPanel({
  supabase,
  stats,
}: {
  supabase: any;
  stats: DashboardStats | null;
}) {
  const [exporting, setExporting] = useState(false);
  const [exportedData, setExportedData] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all verified, unexported pairs
      const { data: pairs, error } = await supabase
        .from("preference_pairs")
        .select("id, prompt, chosen, rejected")
        .eq("curator_verified", true)
        .is("exported_at", null);

      if (error) throw error;

      if (!pairs || pairs.length === 0) {
        toast.info("No new pairs to export");
        setExporting(false);
        return;
      }

      // Convert to JSONL format
      const jsonl = pairs
        .map((p: any) =>
          JSON.stringify({
            prompt: p.prompt,
            chosen: p.chosen,
            rejected: p.rejected,
          })
        )
        .join("\n");

      setExportedData(jsonl);

      // Mark as exported
      const { error: updateError } = await supabase
        .from("preference_pairs")
        .update({ exported_at: new Date().toISOString() })
        .in(
          "id",
          pairs.map((p: any) => p.id)
        );

      if (updateError) {
        console.error("Failed to mark as exported:", updateError);
      }

      toast.success(`Exported ${pairs.length} preference pairs`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportedData) return;

    const blob = new Blob([exportedData], { type: "application/jsonl" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `siam-dpo-training-${new Date().toISOString().split("T")[0]}.jsonl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!exportedData) return;
    navigator.clipboard.writeText(exportedData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Export Controls */}
      <Card className="border-zinc-800/50 bg-zinc-900/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-rose-400" />
            Export DPO Training Data
          </CardTitle>
          <CardDescription>
            Export verified preference pairs in JSONL format for fine-tuning Llama, Mistral, or other open models.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
              <p className="text-xs text-zinc-400 mb-1">Export Ready</p>
              <p className="text-2xl font-bold text-rose-400">{stats?.exportReady || 0}</p>
              <p className="text-xs text-zinc-500">verified pairs</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
              <p className="text-xs text-zinc-400 mb-1">Total Collected</p>
              <p className="text-2xl font-bold text-zinc-100">{stats?.preferencePairs || 0}</p>
              <p className="text-xs text-zinc-500">preference pairs</p>
            </div>
          </div>

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={exporting || (stats?.exportReady || 0) === 0}
            className="w-full bg-rose-600 hover:bg-rose-700"
          >
            {exporting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export {stats?.exportReady || 0} Pairs to JSONL
          </Button>

          {/* Format Info */}
          <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
            <h4 className="text-sm font-medium text-zinc-300 mb-2">JSONL Format</h4>
            <pre className="text-xs text-zinc-400 overflow-x-auto">
{`{"prompt": "...", "chosen": "...", "rejected": "..."}
{"prompt": "...", "chosen": "...", "rejected": "..."}`}
            </pre>
            <p className="text-xs text-zinc-500 mt-2">
              Compatible with: Hugging Face TRL, Axolotl, LLaMA-Factory
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export Preview */}
      <Card className="border-zinc-800/50 bg-zinc-900/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" />
              Export Preview
            </CardTitle>
            {exportedData && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {exportedData ? (
            <ScrollArea className="h-[400px]">
              <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap break-all">
                {exportedData}
              </pre>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-zinc-500">
              <Database className="h-12 w-12 mb-4 opacity-50" />
              <p>No export data yet</p>
              <p className="text-xs mt-1">Click export to generate training data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RLHFCuratorDashboard;
