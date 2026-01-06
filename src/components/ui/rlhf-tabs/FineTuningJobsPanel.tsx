/**
 * Fine-Tuning Jobs Panel
 *
 * Manages and monitors model fine-tuning jobs across providers
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../card";
import { Button } from "../button";
import { Badge } from "../badge";
import { ScrollArea } from "../scroll-area";
import { Progress } from "../progress";
import {
  Cpu,
  Play,
  Pause,
  XCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Activity,
  Zap,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";

interface FineTuningJob {
  id: string;
  dataset_id: string;
  dataset_name: string;
  provider: "openai" | "anthropic" | "huggingface" | "bedrock" | "vertex" | "custom";
  base_model: string;
  provider_job_id: string | null;
  status: "pending" | "validating" | "queued" | "training" | "completed" | "failed" | "cancelled";
  hyperparameters: {
    n_epochs?: number;
    learning_rate?: number;
    batch_size?: number;
  };
  training_metrics: {
    current_epoch?: number;
    total_epochs?: number;
    loss?: number;
    progress?: number;
  };
  estimated_cost: number | null;
  actual_cost: number | null;
  resulting_model_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_by: string;
  created_at: string;
}

const STATUS_CONFIG = {
  pending: { color: "bg-muted-foreground", label: "Pending", icon: Clock },
  validating: { color: "bg-blue-500", label: "Validating", icon: RefreshCw },
  queued: { color: "bg-yellow-500", label: "Queued", icon: Clock },
  training: { color: "bg-primary-500", label: "Training", icon: Activity },
  completed: { color: "bg-green-500", label: "Completed", icon: CheckCircle2 },
  failed: { color: "bg-red-500", label: "Failed", icon: XCircle },
  cancelled: { color: "bg-muted", label: "Cancelled", icon: XCircle },
};

const PROVIDER_CONFIG = {
  openai: { label: "OpenAI", color: "text-emerald-400" },
  anthropic: { label: "Anthropic", color: "text-orange-400" },
  huggingface: { label: "HuggingFace", color: "text-yellow-400" },
  bedrock: { label: "AWS Bedrock", color: "text-orange-500" },
  vertex: { label: "Vertex AI", color: "text-blue-400" },
  custom: { label: "Custom", color: "text-primary-400" },
};

export function FineTuningJobsPanel() {
  const [jobs, setJobs] = useState<FineTuningJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");

  useEffect(() => {
    loadJobs();
    // Poll for updates every 10 seconds for active jobs
    const interval = setInterval(() => {
      if (jobs.some((j) => ["training", "validating", "queued"].includes(j.status))) {
        loadJobs();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from("fine_tuning_jobs")
        .select(
          `
          *,
          training_datasets(name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        // Tables may not exist yet - use mock data
        console.warn("⚠️ FINE-TUNING JOBS: Using MOCK DATA - table not available:", error.message);
        // Use mock data for demo
        setJobs([
          {
            id: "demo-job-1",
            dataset_id: "demo-1",
            dataset_name: "AOMA Support Q4 2025",
            provider: "openai",
            base_model: "gpt-4o-mini-2024-07-18",
            provider_job_id: "ftjob-abc123xyz",
            status: "training",
            hyperparameters: { n_epochs: 3, learning_rate: 0.0001, batch_size: 4 },
            training_metrics: { current_epoch: 2, total_epochs: 3, loss: 0.342, progress: 67 },
            estimated_cost: 47.5,
            actual_cost: 32.15,
            resulting_model_id: null,
            started_at: new Date(Date.now() - 3600000).toISOString(),
            completed_at: null,
            error_message: null,
            created_by: "demo@example.com",
            created_at: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            id: "demo-job-2",
            dataset_id: "demo-2",
            dataset_name: "Jira Triage Training",
            provider: "anthropic",
            base_model: "claude-3-haiku-20240307",
            provider_job_id: "ft_claude_def456",
            status: "completed",
            hyperparameters: { n_epochs: 2, learning_rate: 0.00005 },
            training_metrics: { current_epoch: 2, total_epochs: 2, loss: 0.198, progress: 100 },
            estimated_cost: 23.0,
            actual_cost: 21.47,
            resulting_model_id: "ft:claude-3-haiku:jira-triage:v1",
            started_at: new Date(Date.now() - 86400000).toISOString(),
            completed_at: new Date(Date.now() - 82800000).toISOString(),
            error_message: null,
            created_by: "demo@example.com",
            created_at: new Date(Date.now() - 90000000).toISOString(),
          },
          {
            id: "demo-job-3",
            dataset_id: "demo-3",
            dataset_name: "KB Preferences v1",
            provider: "openai",
            base_model: "gpt-4o-2024-08-06",
            provider_job_id: null,
            status: "pending",
            hyperparameters: { n_epochs: 4 },
            training_metrics: {},
            estimated_cost: 125.0,
            actual_cost: null,
            resulting_model_id: null,
            started_at: null,
            completed_at: null,
            error_message: null,
            created_by: "demo@example.com",
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        const mappedJobs = (data || []).map((j: any) => ({
          ...j,
          dataset_name: j.training_datasets?.name || "Unknown Dataset",
        }));
        setJobs(mappedJobs);
      }
    } catch (error) {
      console.debug("Failed to load jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    toast.loading("Cancelling job...");
    // Simulate cancel
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "cancelled" as const } : j))
      );
      toast.dismiss();
      toast.success("Job cancelled");
    }, 1000);
  };

  const filteredJobs =
    selectedProvider === "all" ? jobs : jobs.filter((j) => j.provider === selectedProvider);

  const activeJobs = jobs.filter((j) => ["training", "validating", "queued"].includes(j.status));
  const totalCost = jobs.reduce((sum, j) => sum + (j.actual_cost || j.estimated_cost || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--mac-text-muted)] font-light">Loading fine-tuning jobs...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="mac-heading">Fine-Tuning Jobs</h2>
          <p className="text-sm text-[var(--mac-text-muted)] font-light">
            Monitor and manage model training across providers
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="huggingface">HuggingFace</SelectItem>
              <SelectItem value="bedrock">AWS Bedrock</SelectItem>
            </SelectContent>
          </Select>
          <Button className="mac-button gap-2">
            <Zap className="h-4 w-4" />
            Launch Job
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="mac-card-elevated border-[var(--mac-utility-border)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Cpu className="h-8 w-8 text-primary-400" />
              <div>
                <p className="mac-body text-2xl font-normal">{jobs.length}</p>
                <p className="text-xs text-[var(--mac-text-muted)]">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mac-card-elevated border-[var(--mac-utility-border)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-green-400 animate-pulse" />
              <div>
                <p className="mac-body text-2xl font-normal">{activeJobs.length}</p>
                <p className="text-xs text-[var(--mac-text-muted)]">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mac-card-elevated border-[var(--mac-utility-border)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-blue-400" />
              <div>
                <p className="mac-body text-2xl font-normal">
                  {jobs.filter((j) => j.status === "completed").length}
                </p>
                <p className="text-xs text-[var(--mac-text-muted)]">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mac-card-elevated border-[var(--mac-utility-border)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="mac-body text-2xl font-normal">${totalCost.toFixed(2)}</p>
                <p className="text-xs text-[var(--mac-text-muted)]">Total Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Job Progress */}
      {activeJobs.length > 0 && (
        <Card className="mac-card-elevated border-primary-500/30 bg-primary-500/5">
          <CardHeader className="mac-card pb-2">
            <CardTitle className="text-sm font-normal flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary-400 animate-pulse" />
              Active Training
            </CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            {activeJobs.map((job) => (
              <div key={job.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-normal">{job.dataset_name}</span>
                  <span className="text-xs text-[var(--mac-text-muted)]">{job.base_model}</span>
                </div>
                <Progress value={job.training_metrics.progress || 0} className="h-2" />
                <div className="flex justify-between text-xs text-[var(--mac-text-muted)]">
                  <span>
                    Epoch {job.training_metrics.current_epoch || 0}/
                    {job.training_metrics.total_epochs || "-"}
                  </span>
                  <span>Loss: {job.training_metrics.loss?.toFixed(4) || "-"}</span>
                  <span>{job.training_metrics.progress || 0}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Job List */}
      <ScrollArea className="flex-1">
        <div className="space-y-3">
          <AnimatePresence>
            {filteredJobs.map((job) => {
              const StatusIcon = STATUS_CONFIG[job.status].icon;
              const providerConfig = PROVIDER_CONFIG[job.provider];
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card
                    className={cn(
                      "mac-card-elevated",
                      "border-[var(--mac-utility-border)]",
                      job.status === "training" && "border-primary-500/50",
                      "hover:border-primary-500/30 transition-colors"
                    )}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center",
                              job.status === "training" ? "bg-primary-500/20" : "bg-muted"
                            )}
                          >
                            <Cpu
                              className={cn(
                                "h-5 w-5",
                                job.status === "training"
                                  ? "text-primary-400 animate-pulse"
                                  : "text-muted-foreground"
                              )}
                            />
                          </div>
                          <div>
                            <h3 className="mac-title">
                              {job.dataset_name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-[var(--mac-text-muted)]">
                              <span className={providerConfig.color}>{providerConfig.label}</span>
                              <span>/</span>
                              <span className="font-mono text-xs">{job.base_model}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          {/* Hyperparameters */}
                          <div className="text-right text-xs text-[var(--mac-text-muted)]">
                            <p>Epochs: {job.hyperparameters.n_epochs || "-"}</p>
                            <p>LR: {job.hyperparameters.learning_rate || "-"}</p>
                          </div>

                          {/* Cost */}
                          <div className="text-right">
                            <p className="text-sm font-normal text-[var(--mac-text-primary)]">
                              ${(job.actual_cost || job.estimated_cost || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-[var(--mac-text-muted)]">
                              {job.actual_cost ? "actual" : "estimated"}
                            </p>
                          </div>

                          {/* Status */}
                          <Badge
                            className={cn(
                              "text-xs text-white min-w-[100px] justify-center",
                              STATUS_CONFIG[job.status].color
                            )}
                          >
                            <StatusIcon
                              className={cn(
                                "h-3 w-3 mr-1",
                                job.status === "training" && "animate-spin"
                              )}
                            />
                            {STATUS_CONFIG[job.status].label}
                          </Badge>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {job.provider_job_id && (
                              <Button className="mac-button" size="sm" variant="ghost" className="mac-button mac-button-outline" title="View on provider">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            {["training", "queued", "validating"].includes(job.status) && (
                              <Button size="sm"
                                variant="ghost" className="mac-button mac-button-outline"
                                onClick={() => handleCancelJob(job.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Error message */}
                      {job.error_message && (
                        <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/30">
                          <p className="text-xs text-red-400 flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" />
                            {job.error_message}
                          </p>
                        </div>
                      )}

                      {/* Resulting model */}
                      {job.resulting_model_id && (
                        <div className="mt-3 p-2 rounded bg-green-500/10 border border-green-500/30">
                          <p className="text-xs text-green-400 flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" />
                            Model: <code className="font-mono">{job.resulting_model_id}</code>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredJobs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-[var(--mac-text-muted)]">
              <Cpu className="h-12 w-12 mb-4" />
              <p className="mac-body font-light">No fine-tuning jobs</p>
              <p className="text-sm">Launch a job from a ready training dataset</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
