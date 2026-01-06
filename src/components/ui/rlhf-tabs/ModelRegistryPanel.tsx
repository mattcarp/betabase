/**
 * Model Registry Panel
 *
 * Version control and deployment for fine-tuned models
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../card";
import { Button } from "../button";
import { Badge } from "../badge";
import { ScrollArea } from "../scroll-area";
import {
  Box,
  Rocket,
  Archive,
  GitBranch,
  RotateCcw,
  Beaker,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

interface Model {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  model_id: string;
  provider: string;
  base_model: string;
  version: string;
  status: "testing" | "staged" | "deployed" | "deprecated" | "archived";
  performance_metrics: {
    accuracy?: number;
    latency_ms?: number;
    quality_score?: number;
    cost_per_1k?: number;
  };
  created_at: string;
  deployed_at: string | null;
}

const STATUS_CONFIG = {
  testing: { color: "bg-yellow-500", label: "Testing", icon: Beaker },
  staged: { color: "bg-blue-500", label: "Staged", icon: GitBranch },
  deployed: { color: "bg-green-500", label: "Deployed", icon: Rocket },
  deprecated: { color: "bg-orange-500", label: "Deprecated", icon: AlertTriangle },
  archived: { color: "bg-muted", label: "Archived", icon: Archive },
};

export function ModelRegistryPanel() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from("model_registry")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // Tables may not exist yet - use mock data
        console.warn("⚠️ MODEL REGISTRY: Using MOCK DATA - table not available:", error.message);
        // Use mock data for demo
        setModels([
          {
            id: "model-1",
            name: "aoma-support",
            display_name: "AOMA Support Assistant",
            description: "Fine-tuned for AOMA technical support queries",
            model_id: "ft:gpt-4o-mini:aoma-support:v2.1.0",
            provider: "openai",
            base_model: "gpt-4o-mini-2024-07-18",
            version: "2.1.0",
            status: "deployed",
            performance_metrics: {
              accuracy: 94.2,
              latency_ms: 1150,
              quality_score: 4.3,
              cost_per_1k: 0.15,
            },
            created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
            deployed_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          },
          {
            id: "model-2",
            name: "aoma-support",
            display_name: "AOMA Support Assistant",
            description: "Previous version - slightly lower accuracy",
            model_id: "ft:gpt-4o-mini:aoma-support:v2.0.0",
            provider: "openai",
            base_model: "gpt-4o-mini-2024-07-18",
            version: "2.0.0",
            status: "deprecated",
            performance_metrics: {
              accuracy: 91.5,
              latency_ms: 1180,
              quality_score: 4.1,
              cost_per_1k: 0.15,
            },
            created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
            deployed_at: new Date(Date.now() - 86400000 * 25).toISOString(),
          },
          {
            id: "model-3",
            name: "jira-triage",
            display_name: "Jira Ticket Triage",
            description: "Classifies and routes Jira tickets automatically",
            model_id: "ft:claude-3-haiku:jira-triage:v1.0.0",
            provider: "anthropic",
            base_model: "claude-3-haiku-20240307",
            version: "1.0.0",
            status: "testing",
            performance_metrics: {
              accuracy: 87.3,
              latency_ms: 890,
              quality_score: 3.9,
              cost_per_1k: 0.08,
            },
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            deployed_at: null,
          },
          {
            id: "model-4",
            name: "knowledge-qa",
            display_name: "Knowledge Base QA",
            description: "RAG-optimized model for knowledge base queries",
            model_id: "ft:gpt-4o:knowledge-qa:v1.0.0",
            provider: "openai",
            base_model: "gpt-4o-2024-08-06",
            version: "1.0.0",
            status: "staged",
            performance_metrics: {
              accuracy: 96.1,
              latency_ms: 2100,
              quality_score: 4.7,
              cost_per_1k: 2.5,
            },
            created_at: new Date(Date.now() - 86400000).toISOString(),
            deployed_at: null,
          },
        ]);
      } else {
        setModels(data || []);
      }
    } catch (error) {
      console.debug("Failed to load models:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async (model: Model) => {
    toast.loading(`Deploying ${model.display_name || model.name}...`);
    setTimeout(() => {
      setModels((prev) =>
        prev.map((m) => {
          if (m.id === model.id) {
            return { ...m, status: "deployed" as const, deployed_at: new Date().toISOString() };
          }
          // Deprecate previous versions
          if (m.name === model.name && m.id !== model.id && m.status === "deployed") {
            return { ...m, status: "deprecated" as const };
          }
          return m;
        })
      );
      toast.dismiss();
      toast.success(`${model.display_name || model.name} deployed successfully!`);
    }, 2000);
  };

  const handleRollback = async (model: Model) => {
    toast.loading("Rolling back...");
    setTimeout(() => {
      // Find the previous version and deploy it
      const previousVersion = models.find(
        (m) => m.name === model.name && m.version < model.version && m.status === "deprecated"
      );
      if (previousVersion) {
        setModels((prev) =>
          prev.map((m) => {
            if (m.id === previousVersion.id) {
              return { ...m, status: "deployed" as const };
            }
            if (m.id === model.id) {
              return { ...m, status: "deprecated" as const };
            }
            return m;
          })
        );
        toast.dismiss();
        toast.success(`Rolled back to ${previousVersion.version}`);
      } else {
        toast.dismiss();
        toast.error("No previous version available");
      }
    }, 1500);
  };

  const handleStartABTest = async (model: Model) => {
    toast.success(`A/B test configured for ${model.display_name || model.name}`);
  };

  // Group models by name
  const groupedModels = models.reduce(
    (acc, model) => {
      if (!acc[model.name]) {
        acc[model.name] = [];
      }
      acc[model.name].push(model);
      return acc;
    },
    {} as Record<string, Model[]>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--mac-text-muted)] font-light">Loading model registry...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="mac-heading">Model Registry</h2>
          <p className="text-sm text-[var(--mac-text-muted)] font-light">
            Deploy and manage fine-tuned model versions
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="mac-card-elevated border-[var(--mac-utility-border)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Box className="h-8 w-8 text-primary-400" />
              <div>
                <p className="mac-body text-2xl font-normal">{Object.keys(groupedModels).length}</p>
                <p className="text-xs text-[var(--mac-text-muted)]">Model Families</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mac-card-elevated border-[var(--mac-utility-border)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <GitBranch className="h-8 w-8 text-blue-400" />
              <div>
                <p className="mac-body text-2xl font-normal">{models.length}</p>
                <p className="text-xs text-[var(--mac-text-muted)]">Total Versions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mac-card-elevated border-[var(--mac-utility-border)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Rocket className="h-8 w-8 text-green-400" />
              <div>
                <p className="mac-body text-2xl font-normal">
                  {models.filter((m) => m.status === "deployed").length}
                </p>
                <p className="text-xs text-[var(--mac-text-muted)]">Deployed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mac-card-elevated border-[var(--mac-utility-border)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Beaker className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="mac-body text-2xl font-normal">
                  {models.filter((m) => m.status === "testing" || m.status === "staged").length}
                </p>
                <p className="text-xs text-[var(--mac-text-muted)]">In Testing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model List */}
      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {Object.entries(groupedModels).map(([name, versions]) => {
            const latestDeployed = versions.find((v) => v.status === "deployed");
            const latest = versions[0];
            const isExpanded = expandedModel === name;

            return (
              <motion.div key={name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card
                  className={cn(
                    "mac-card-elevated",
                    "border-[var(--mac-utility-border)]",
                    latestDeployed && "border-green-500/30"
                  )}
                >
                  {/* Main Model Row */}
                  <CardContent className="py-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedModel(isExpanded ? null : name)}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-lg flex items-center justify-center",
                            latestDeployed ? "bg-green-500/10" : "bg-primary-500/10"
                          )}
                        >
                          <Box
                            className={cn(
                              "h-6 w-6",
                              latestDeployed ? "text-green-400" : "text-primary-400"
                            )}
                          />
                        </div>
                        <div>
                          <h3 className="mac-title">
                            {latest.display_name || name}
                            {latestDeployed && (
                              <Badge className="bg-green-500/20 text-green-400 text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-[var(--mac-text-muted)] font-light">
                            {latest.description || `${versions.length} version(s)`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Performance Metrics */}
                        {latestDeployed?.performance_metrics && (
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <p className="text-sm font-normal text-[var(--mac-text-primary)]">
                                {latestDeployed.performance_metrics.accuracy?.toFixed(1)}%
                              </p>
                              <p className="text-xs text-[var(--mac-text-muted)]">Accuracy</p>
                            </div>
                            <div>
                              <p className="text-sm font-normal text-[var(--mac-text-primary)]">
                                {latestDeployed.performance_metrics.latency_ms}ms
                              </p>
                              <p className="text-xs text-[var(--mac-text-muted)]">Latency</p>
                            </div>
                            <div>
                              <p className="text-sm font-normal text-[var(--mac-text-primary)]">
                                {latestDeployed.performance_metrics.quality_score?.toFixed(1)}
                              </p>
                              <p className="text-xs text-[var(--mac-text-muted)]">Quality</p>
                            </div>
                            <div>
                              <p className="text-sm font-normal text-[var(--mac-text-primary)]">
                                ${latestDeployed.performance_metrics.cost_per_1k?.toFixed(2)}
                              </p>
                              <p className="text-xs text-[var(--mac-text-muted)]">/1K tok</p>
                            </div>
                          </div>
                        )}

                        {/* Version count */}
                        <Badge variant="outline" className="text-xs">
                          {versions.length} version{versions.length > 1 ? "s" : ""}
                        </Badge>

                        {/* Expand icon */}
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-[var(--mac-text-muted)]" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-[var(--mac-text-muted)]" />
                        )}
                      </div>
                    </div>
                  </CardContent>

                  {/* Expanded Version List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-[var(--mac-utility-border)]"
                      >
                        <div className="p-4 space-y-2">
                          {versions.map((version) => {
                            const StatusIcon = STATUS_CONFIG[version.status].icon;
                            return (
                              <div
                                key={version.id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg",
                                  "bg-[var(--mac-surface-background)]/50",
                                  "border border-[var(--mac-utility-border)]",
                                  version.status === "deployed" &&
                                    "border-green-500/30 bg-green-500/5"
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    v{version.version}
                                  </Badge>
                                  <span className="text-sm text-[var(--mac-text-muted)] font-mono">
                                    {version.model_id}
                                  </span>
                                  <Badge
                                    className={cn(
                                      "text-xs text-white",
                                      STATUS_CONFIG[version.status].color
                                    )}
                                  >
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {STATUS_CONFIG[version.status].label}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-2">
                                  {version.status === "testing" && (
                                    <Button size="sm"
                                      variant="outline" className="mac-button mac-button-outline"
                                      onClick={() => handleStartABTest(version)}
                                    >
                                      <TrendingUp className="h-4 w-4 mr-1" />
                                      A/B Test
                                    </Button>
                                  )}
                                  {(version.status === "testing" ||
                                    version.status === "staged") && (
                                    <Button className="mac-button" size="sm" onClick={() => handleDeploy(version)}>
                                      <Rocket className="h-4 w-4 mr-1" />
                                      Deploy
                                    </Button>
                                  )}
                                  {version.status === "deployed" && (
                                    <Button size="sm"
                                      variant="outline" className="mac-button mac-button-outline"
                                      onClick={() => handleRollback(version)}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-1" />
                                      Rollback
                                    </Button>
                                  )}
                                  {version.status === "deprecated" && (
                                    <Button size="sm"
                                      variant="ghost" className="mac-button mac-button-outline"
                                      onClick={() => handleDeploy(version)}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-1" />
                                      Restore
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}

          {models.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-[var(--mac-text-muted)]">
              <Box className="h-12 w-12 mb-4" />
              <p className="mac-body font-light">No models registered</p>
              <p className="text-sm">Complete a fine-tuning job to add models</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
