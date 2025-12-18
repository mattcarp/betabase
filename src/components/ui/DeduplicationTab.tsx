"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";
import { Progress } from "./progress";
import { 
  Database, 
  Search, 
  Trash2, 
  RefreshCw, 
  ShieldCheck, 
  Cpu, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

interface DuplicateItem {
  id: string;
  source_id: string;
  content_preview: string;
  created_at: string;
  similarity?: number;
  filename?: string;
  size?: number;
}

interface DuplicateGroup {
  keep: DuplicateItem;
  duplicates: DuplicateItem[];
  reason: string;
}

export function DeduplicationTab() {
  const [loading, setLoading] = useState(false);
  const [deduplicating, setDeduplicating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [stats, setStats] = useState({
    before: 201.3,
    after: 150.8,
    saved: 50.5,
    percent: 25.1,
    filesRemoved: 0
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Mock data for demo if API returns empty
  const mockGroups: DuplicateGroup[] = [
    {
      keep: {
        id: "1",
        source_id: "kb:sacd-spec-v1",
        content_preview: "SACD Specification - Layer 1: Physical Parameters. Sector size: 2048 bytes...",
        created_at: new Date().toISOString(),
        filename: "sacd-physical-spec.pdf",
        size: 2.4
      },
      duplicates: [
        {
          id: "2",
          source_id: "kb:sacd-spec-copy",
          content_preview: "SACD Specification - Layer 1: Physical Parameters. Sector size: 2048 bytes...",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          similarity: 0.98,
          filename: "sacd_copy_final.pdf",
          size: 2.3
        }
      ],
      reason: "Semantic Similarity (98%)"
    },
    {
      keep: {
        id: "3",
        source_id: "jira:ITSM-55968",
        content_preview: "Error: Asset Upload Sorting Failed. Root cause: race condition in reducer...",
        created_at: new Date().toISOString(),
        filename: "Jira Ticket ITSM-55968",
        size: 0.1
      },
      duplicates: [
        {
          id: "4",
          source_id: "jira:ITSM-55968-dup",
          content_preview: "Error: Asset Upload Sorting Failed. Root cause: race condition in reducer...",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          similarity: 1.0,
          filename: "Jira Ticket (Duplicate Import)",
          size: 0.1
        }
      ],
      reason: "Exact Hash Match"
    }
  ];

  const fetchDuplicates = async (dryRun = true) => {
    setLoading(true);
    try {
      // In a real implementation, we'd fetch from:
      // const response = await fetch("/api/knowledge/deduplicate", {
      //   method: "POST",
      //   body: JSON.stringify({ dryRun })
      // });
      
      // For demo purposes, we'll use our mock groups if it's a dry run
      await new Promise(resolve => setTimeout(resolve, 1500));
      setGroups(mockGroups);
      
      if (!dryRun) {
        toast.success("Deduplication complete! 50.5 MB saved.");
      }
    } catch (error) {
      console.error("Failed to fetch duplicates:", error);
      toast.error("Failed to analyze duplicates");
    } finally {
      setLoading(false);
    }
  };

  const runDeduplication = async () => {
    setConfirmOpen(false);
    setDeduplicating(true);
    setProgress(0);
    
    // Simulate progress for demo
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDeduplicating(false);
          fetchDuplicates(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  useEffect(() => {
    fetchDuplicates(true);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)] col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-light text-2xl flex items-center gap-2">
                  <Cpu className="h-6 w-6 text-[var(--mac-primary-blue-400)]" />
                  Deduplication Intelligence
                </CardTitle>
                <CardDescription className="font-light text-[var(--mac-text-secondary)] mt-1">
                  Multi-layered detection using SHA-256 hashing and vector semantic similarity.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="mac-button-outline"
                  onClick={() => fetchDuplicates(true)}
                  disabled={loading || deduplicating}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Scan
                </Button>
                <Button 
                  className="bg-[var(--mac-primary-blue-600)] hover:bg-[var(--mac-primary-blue-400)] text-white transition-all duration-200"
                  onClick={() => setConfirmOpen(true)}
                  disabled={loading || deduplicating || groups.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Optimize
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <StatItem label="Before" value={`${stats.before} MB`} icon={<Database className="h-4 w-4" />} />
              <StatItem label="After" value={`${stats.after} MB`} icon={<CheckCircle2 className="h-4 w-4 text-[var(--mac-status-connected)]" />} />
              <StatItem label="Saved" value={`${stats.saved} MB`} icon={<div className="h-2 w-2 rounded-full bg-[var(--mac-status-connected)]" />} />
              <StatItem label="Reduction" value={`${stats.percent}%`} highlight />
            </div>
            
            <div className="mt-6 p-3 rounded-lg bg-[var(--mac-primary-blue-400)]/5 border border-[var(--mac-primary-blue-400)]/20 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[var(--mac-primary-blue-400)]" />
              <span className="text-sm font-light text-[var(--mac-text-primary)]">
                <strong className="font-normal">Tenant-Safe Isolation:</strong> sony-music / mso / aoma. 
                Intelligence never crosses organization boundaries.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal uppercase tracking-wider text-[var(--mac-text-secondary)]">Detection Layers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetectionLayer label="Source ID" status="active" />
            <DetectionLayer label="Content Hash" status="active" />
            <DetectionLayer label="URL Normalized" status="active" />
            <DetectionLayer label="Semantic Vector" status="active" />
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar (Visible during deduplication) */}
      {deduplicating && (
        <div className="space-y-2 px-1">
          <div className="flex justify-between text-xs font-light text-[var(--mac-text-secondary)]">
            <span>Analyzing vector store...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1 bg-[var(--mac-utility-border)] [&>div]:bg-[var(--mac-primary-blue-400)]" />
        </div>
      )}

      {/* Duplicate Groups */}
      <div className="space-y-4">
        <h3 className="text-lg font-light text-[var(--mac-text-primary)] flex items-center gap-2 px-1">
          Duplicate Groups Found ({groups.length})
        </h3>
        
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : groups.length > 0 ? (
              groups.map((group, idx) => (
                <div key={idx} className="group-card mac-glass bg-[var(--mac-surface-card)] border border-[var(--mac-utility-border)] rounded-xl overflow-hidden hover:border-[var(--mac-utility-border-elevated)] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--mac-utility-shadow)]">
                  <div className="p-4 border-b border-[var(--mac-utility-border)] bg-[var(--mac-surface-elevated)]/50 flex justify-between items-center">
                    <Badge className="bg-[var(--mac-primary-blue-400)]/10 text-[var(--mac-primary-blue-400)] border-[var(--mac-primary-blue-400)]/20 font-light px-2 py-0.5">
                      {group.reason}
                    </Badge>
                    <span className="text-xs font-light text-[var(--mac-text-secondary)]">
                      Detected 2 days ago
                    </span>
                  </div>
                  
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Kept Item */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[var(--mac-status-connected)]" />
                        <span className="text-xs font-normal uppercase tracking-wider text-[var(--mac-status-connected)]">Version to Keep</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--mac-surface-elevated)] border border-[var(--mac-utility-border)] space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-normal text-[var(--mac-text-primary)] line-clamp-1">{group.keep.filename || group.keep.source_id}</h4>
                          <span className="text-[10px] font-light text-[var(--mac-text-secondary)]">{group.keep.size} MB</span>
                        </div>
                        <p className="text-xs font-light text-[var(--mac-text-secondary)] line-clamp-2 italic">
                          "{group.keep.content_preview}"
                        </p>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[10px] font-light text-[var(--mac-text-muted)]">ID: {group.keep.source_id}</span>
                          <span className="text-[10px] font-light text-[var(--mac-text-muted)]">{new Date(group.keep.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Duplicate Items */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-[var(--mac-status-warning-text)]" />
                        <span className="text-xs font-normal uppercase tracking-wider text-[var(--mac-status-warning-text)]">Redundant Copies ({group.duplicates.length})</span>
                      </div>
                      <div className="space-y-2">
                        {group.duplicates.map((dup, dIdx) => (
                          <div key={dIdx} className="p-3 rounded-lg bg-[var(--mac-surface-elevated)]/30 border border-[var(--mac-utility-border)] border-dashed space-y-2 relative">
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-light text-[var(--mac-text-secondary)] line-clamp-1">{dup.filename || dup.source_id}</h4>
                              <span className="text-[10px] font-light text-[var(--mac-text-muted)]">{dup.size} MB</span>
                            </div>
                            <p className="text-[11px] font-light text-[var(--mac-text-muted)] line-clamp-1">
                              "{dup.content_preview}"
                            </p>
                            <div className="flex gap-2 pt-1">
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] font-light hover:text-[var(--mac-primary-blue-400)] p-0 flex items-center gap-1">
                                <Info className="h-3 w-3" /> Compare Diff
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] font-light hover:text-[var(--mac-primary-blue-400)] p-0 flex items-center gap-1">
                                <ChevronRight className="h-3 w-3" /> Keep This Version
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--mac-text-secondary)] font-light mac-glass border border-dashed border-[var(--mac-utility-border)] rounded-xl">
                <Search className="h-12 w-12 mb-4 opacity-20" />
                <p>No duplicates detected in your current tenant.</p>
                <p className="text-sm opacity-60">Knowledge base is healthy and optimized.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border-elevated)]">
          <DialogHeader>
            <DialogTitle className="font-light flex items-center gap-2">
              <AlertCircle className="text-[var(--mac-status-error-text)]" />
              Run Deduplication Optimization
            </DialogTitle>
            <DialogDescription className="font-light">
              This will permanently remove {groups.reduce((sum, g) => sum + g.duplicates.length, 0)} redundant document chunks from the <strong>sony-music/mso/aoma</strong> vector store. 
              Approx. 50.5 MB will be recovered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" className="mac-button-outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[var(--mac-status-error-bg)] border border-[var(--mac-status-error-border)] text-[var(--mac-status-error-text)] hover:bg-[var(--mac-status-error-bg)]/80 transition-all duration-200"
              onClick={runDeduplication}
            >
              Confirm & Optimize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatItem({ label, value, icon, highlight = false }: { label: string, value: string, icon?: React.ReactNode, highlight?: boolean }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-normal uppercase tracking-wider text-[var(--mac-text-secondary)] flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <div className={cn(
        "text-xl font-light",
        highlight ? "text-[var(--mac-primary-blue-400)]" : "text-[var(--mac-text-primary)]"
      )}>
        {value}
      </div>
    </div>
  );
}

function DetectionLayer({ label, status }: { label: string, status: "active" | "inactive" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-light text-[var(--mac-text-primary)]">{label}</span>
      <Badge className={cn(
        "text-[9px] font-normal uppercase tracking-tighter px-1.5 py-0.5",
        status === "active" 
          ? "bg-[var(--mac-status-connected-bg)] text-[var(--mac-status-connected-text)] border-[var(--mac-status-connected-border)]"
          : "bg-[var(--mac-surface-elevated)] text-[var(--mac-text-muted)] border-[var(--mac-utility-border)]"
      )}>
        {status}
      </Badge>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="mac-glass bg-[var(--mac-surface-card)] border border-[var(--mac-utility-border)] rounded-xl h-48 animate-pulse" />
  );
}

