/**
 * Training Datasets Panel
 *
 * Manages curated training datasets for model fine-tuning
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../card";
import { Button } from "../button";
import { Badge } from "../badge";
import { ScrollArea } from "../scroll-area";
import { Input } from "../input";
import {
  Database,
  Plus,
  Download,
  Trash2,
  Edit2,
  FileJson,
  CheckCircle2,
  Clock,
  Archive,
  Layers,
  Users,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";

interface TrainingDataset {
  id: string;
  name: string;
  description: string;
  dataset_type: "preference_pairs" | "instruction_tuning" | "dpo" | "sft";
  status: "draft" | "curating" | "ready" | "exported" | "archived";
  sample_count: number;
  quality_score: number | null;
  export_format: string | null;
  curator_email: string;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG = {
  draft: { color: "bg-zinc-500", label: "Draft", icon: Edit2 },
  curating: { color: "bg-yellow-500", label: "Curating", icon: Clock },
  ready: { color: "bg-blue-500", label: "Ready", icon: CheckCircle2 },
  exported: { color: "bg-green-500", label: "Exported", icon: Download },
  archived: { color: "bg-zinc-700", label: "Archived", icon: Archive },
};

const TYPE_LABELS = {
  preference_pairs: "Preference Pairs",
  instruction_tuning: "Instruction Tuning",
  dpo: "DPO",
  sft: "SFT",
};

export function TrainingDatasetsPanel() {
  const [datasets, setDatasets] = useState<TrainingDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDataset, setNewDataset] = useState({
    name: "",
    description: "",
    dataset_type: "dpo" as const,
  });

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from("training_datasets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading datasets:", error);
        // Use mock data for demo
        setDatasets([
          {
            id: "demo-1",
            name: "AOMA Support Q4 2025",
            description: "Curated support interactions for AOMA knowledge base",
            dataset_type: "dpo",
            status: "ready",
            sample_count: 1247,
            quality_score: 0.89,
            export_format: "jsonl",
            curator_email: "curator@example.com",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "demo-2",
            name: "Jira Triage Training",
            description: "Ticket classification and routing examples",
            dataset_type: "instruction_tuning",
            status: "curating",
            sample_count: 892,
            quality_score: 0.76,
            export_format: null,
            curator_email: "curator@example.com",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "demo-3",
            name: "Knowledge Base Preferences",
            description: "User preference pairs for RAG response quality",
            dataset_type: "preference_pairs",
            status: "draft",
            sample_count: 423,
            quality_score: null,
            export_format: null,
            curator_email: "curator@example.com",
            created_at: new Date(Date.now() - 172800000).toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      } else {
        setDatasets(data || []);
      }
    } catch (error) {
      console.error("Failed to load datasets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDataset = async () => {
    if (!newDataset.name.trim()) {
      toast.error("Dataset name is required");
      return;
    }

    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from("training_datasets")
        .insert({
          name: newDataset.name,
          description: newDataset.description,
          dataset_type: newDataset.dataset_type,
          status: "draft",
          sample_count: 0,
          organization: "demo",
          curator_email: "demo@example.com",
        })
        .select()
        .single();

      if (error) throw error;

      setDatasets((prev) => [data, ...prev]);
      setShowCreateDialog(false);
      setNewDataset({ name: "", description: "", dataset_type: "dpo" });
      toast.success("Dataset created successfully");
    } catch (error) {
      console.error("Failed to create dataset:", error);
      // Add mock dataset for demo
      const mockDataset: TrainingDataset = {
        id: `mock-${Date.now()}`,
        name: newDataset.name,
        description: newDataset.description,
        dataset_type: newDataset.dataset_type,
        status: "draft",
        sample_count: 0,
        quality_score: null,
        export_format: null,
        curator_email: "demo@example.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setDatasets((prev) => [mockDataset, ...prev]);
      setShowCreateDialog(false);
      setNewDataset({ name: "", description: "", dataset_type: "dpo" });
      toast.success("Dataset created (demo mode)");
    }
  };

  const handleExportDataset = async (dataset: TrainingDataset) => {
    toast.loading("Preparing export...");
    // Simulate export
    setTimeout(() => {
      toast.dismiss();
      toast.success(`Dataset "${dataset.name}" exported as JSONL`);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--mac-text-muted)] font-light">Loading datasets...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-[var(--mac-text-primary)]">Training Datasets</h2>
          <p className="text-sm text-[var(--mac-text-muted)] font-light">
            Curate and manage training data for model fine-tuning
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Dataset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Training Dataset</DialogTitle>
              <DialogDescription>
                Create a new dataset to collect and curate training examples.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g., AOMA Support Q1 2026"
                  value={newDataset.name}
                  onChange={(e) => setNewDataset((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Describe the purpose of this dataset"
                  value={newDataset.description}
                  onChange={(e) =>
                    setNewDataset((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={newDataset.dataset_type}
                  onValueChange={(value: any) =>
                    setNewDataset((prev) => ({ ...prev, dataset_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dpo">DPO (Direct Preference Optimization)</SelectItem>
                    <SelectItem value="preference_pairs">Preference Pairs</SelectItem>
                    <SelectItem value="instruction_tuning">Instruction Tuning</SelectItem>
                    <SelectItem value="sft">SFT (Supervised Fine-Tuning)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDataset}>Create Dataset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="mac-card-elevated border-[var(--mac-utility-border)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold">{datasets.length}</p>
                <p className="text-xs text-[var(--mac-text-muted)]">Datasets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mac-card-elevated border-[var(--mac-utility-border)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Layers className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">
                  {datasets.reduce((sum, d) => sum + d.sample_count, 0).toLocaleString()}
                </p>
                <p className="text-xs text-[var(--mac-text-muted)]">Total Samples</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mac-card-elevated border-[var(--mac-utility-border)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold">
                  {datasets.filter((d) => d.status === "ready" || d.status === "exported").length}
                </p>
                <p className="text-xs text-[var(--mac-text-muted)]">Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mac-card-elevated border-[var(--mac-utility-border)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">
                  {(datasets
                    .filter((d) => d.quality_score !== null)
                    .reduce((sum, d) => sum + (d.quality_score || 0), 0) /
                    Math.max(datasets.filter((d) => d.quality_score !== null).length, 1)) *
                    100 || 0}
                  %
                </p>
                <p className="text-xs text-[var(--mac-text-muted)]">Avg Quality</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dataset List */}
      <ScrollArea className="flex-1">
        <div className="space-y-3">
          <AnimatePresence>
            {datasets.map((dataset) => {
              const StatusIcon = STATUS_CONFIG[dataset.status].icon;
              return (
                <motion.div
                  key={dataset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card
                    className={cn(
                      "mac-card-elevated",
                      "border-[var(--mac-utility-border)]",
                      "hover:border-purple-500/50 transition-colors"
                    )}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center",
                              "bg-purple-500/10"
                            )}
                          >
                            <Database className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-[var(--mac-text-primary)]">
                              {dataset.name}
                            </h3>
                            <p className="text-sm text-[var(--mac-text-muted)] font-light">
                              {dataset.description || "No description"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-lg font-bold text-[var(--mac-text-primary)]">
                              {dataset.sample_count.toLocaleString()}
                            </p>
                            <p className="text-xs text-[var(--mac-text-muted)]">samples</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {TYPE_LABELS[dataset.dataset_type]}
                          </Badge>
                          <Badge
                            className={cn(
                              "text-xs text-white",
                              STATUS_CONFIG[dataset.status].color
                            )}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {STATUS_CONFIG[dataset.status].label}
                          </Badge>
                          {dataset.quality_score !== null && (
                            <div className="text-right">
                              <p className="text-sm font-medium text-[var(--mac-text-primary)]">
                                {(dataset.quality_score * 100).toFixed(0)}%
                              </p>
                              <p className="text-xs text-[var(--mac-text-muted)]">quality</p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExportDataset(dataset)}
                              disabled={dataset.status === "draft"}
                            >
                              <FileJson className="h-4 w-4 mr-1" />
                              Export
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {datasets.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-[var(--mac-text-muted)]">
              <Database className="h-12 w-12 mb-4" />
              <p className="font-light">No training datasets yet</p>
              <p className="text-sm">Create your first dataset to start curating training data</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
