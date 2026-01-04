"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../card";
import { Button } from "../button";
import { ScrollArea } from "../scroll-area";
import { 
  Bot, 
  GitBranch, 
  Activity, 
  Target, 
  Clock,
  Zap,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "../../../lib/utils";

// Flow diagram component for agent decision paths
const FlowDiagram = ({ chart: _chart }: { chart: string }) => {
  // Static visualization of agent decision path using useMemo for derived data
  const svg = useMemo(() => `
    <div class="flow-diagram p-6 bg-card/50 rounded-xl border border-border text-[var(--mac-text-primary)] font-light text-sm w-full h-full flex flex-col items-center">
      <div class="flex flex-col items-center space-y-4">
        <div class="p-3 bg-[var(--mac-info-bg)] border border-[var(--mac-info-border)] rounded-lg text-[var(--mac-info)]">Query: "SACD Sector Specs"</div>
        <div class="h-8 w-px bg-muted"></div>
        <div class="p-3 bg-[var(--mac-purple-bg)] border border-[var(--mac-purple-border)] rounded-lg text-[var(--mac-purple)]">Intent: Knowledge Retrieval</div>
        <div class="h-8 w-px bg-muted"></div>
        <div class="flex gap-8">
          <div class="p-3 bg-muted border border-border rounded-lg text-xs text-muted-foreground">Vector Search (0.92)</div>
          <div class="p-3 bg-muted border border-border rounded-lg text-xs text-muted-foreground">Cross-Ref Jira (0.45)</div>
        </div>
        <div class="h-8 w-px bg-muted"></div>
        <div class="p-3 bg-[var(--mac-tier1-bg)] border border-[var(--mac-tier1-border)] rounded-lg text-[var(--mac-tier1)]">Reranking (Gemini 3.0)</div>
        <div class="h-8 w-px bg-muted"></div>
        <div class="p-3 bg-[var(--mac-info-bg)] border border-[var(--mac-info-border)] rounded-lg font-normal text-[var(--mac-info)]">Final Response Generation</div>
      </div>
    </div>
  `, []);

  return <div className="w-full flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />;
};

interface Decision {
  step: number;
  action: string;
  tool: string;
  confidence: number;
  reasoning: string;
  expanded?: boolean;
}

export function AgentInsightsTab() {
  const [decisions, setDecisions] = useState<Decision[]>([
    {
      step: 1,
      action: "Intent Classification",
      tool: "Gemini Intent Classifier",
      confidence: 0.98,
      reasoning: "Query specifically asks for technical specifications. Routed to Knowledge Base source.",
    },
    {
      step: 2,
      action: "Knowledge Retrieval",
      tool: "Supabase Vector Search",
      confidence: 0.92,
      reasoning: "Found 3 relevant chunks in SACD-Spec-v1.pdf. Similarity scores > 0.85.",
    },
    {
      step: 3,
      action: "Source Context Reranking",
      tool: "Gemini Reranker",
      confidence: 0.95,
      reasoning: "Re-ordered retrieved documents to prioritize physical layer parameters over logical structure.",
    },
    {
      step: 4,
      action: "Response Synthesis",
      tool: "Claude 3.5 Sonnet",
      confidence: 0.89,
      reasoning: "Generated technical explanation with inline citations from SACD physical spec.",
    }
  ]);

  const toggleDecision = (index: number) => {
    setDecisions(prev => prev.map((d, i) => i === index ? { ...d, expanded: !d.expanded } : d));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard 
          title="Avg Reasoning Steps" 
          value="4.2" 
          icon={<GitBranch className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />} 
        />
        <InsightCard 
          title="Final Confidence" 
          value="91.4%" 
          icon={<Target className="h-4 w-4 text-[var(--mac-accent-purple-400)]" />} 
        />
        <InsightCard 
          title="Execution Time" 
          value="1.8s" 
          icon={<Clock className="h-4 w-4 text-[var(--mac-text-secondary)]" />} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Decision Flowchart */}
        <Card className="mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)]">
          <CardHeader>
            <CardTitle className="font-light text-xl flex items-center gap-2 text-[var(--mac-text-primary)]">
              <Activity className="h-5 w-5 text-[var(--mac-primary-blue-400)]" />
              Agent Decision Path
            </CardTitle>
            <CardDescription className="font-light text-[var(--mac-text-secondary)]">Visual flowchart of AI's logical progression</CardDescription>
          </CardHeader>
          <CardContent>
            <FlowDiagram chart="graph TD; A-->B; B-->C; C-->D;" />
            <div className="mt-6 flex justify-between items-center px-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-[var(--mac-text-secondary)]">
                  <div className="h-2 w-2 rounded-full bg-[var(--mac-info)]"></div> Search
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--mac-text-secondary)]">
                  <div className="h-2 w-2 rounded-full bg-[var(--mac-purple)]"></div> Logic
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--mac-text-secondary)]">
                  <div className="h-2 w-2 rounded-full bg-[var(--mac-tier1)]"></div> Model
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-normal tracking-tighter opacity-60 hover:opacity-100 text-[var(--mac-text-secondary)]">
                Export Decision Log
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Decision Logs */}
        <Card className="mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)]">
          <CardHeader>
            <CardTitle className="font-light text-xl flex items-center gap-2 text-[var(--mac-text-primary)]">
              <Bot className="h-5 w-5 text-[var(--mac-accent-purple-400)]" />
              Reasoning Chains
            </CardTitle>
            <CardDescription className="font-light text-[var(--mac-text-secondary)]">Step-by-step breakdown of decisions</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {decisions.map((d, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "decision-step mac-glass border border-[var(--mac-utility-border)] rounded-xl overflow-hidden transition-all duration-300",
                      d.expanded ? "border-[var(--mac-primary-blue-400)]/40 bg-[var(--mac-primary-blue-400)]/5" : "hover:border-[var(--mac-utility-border-elevated)]"
                    )}
                  >
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleDecision(i)}
                    >
                      <div className="flex items-center gap-4 text-[var(--mac-text-primary)]">
                        <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-light text-[var(--mac-text-secondary)]">
                          {d.step}
                        </div>
                        <div>
                          <h4 className="text-sm font-normal">{d.action}</h4>
                          <p className="text-[10px] text-[var(--mac-text-secondary)]">{d.tool}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] uppercase text-[var(--mac-text-muted)] tracking-tighter">Confidence</p>
                          <p className={cn(
                            "text-xs font-normal",
                            d.confidence > 0.9 ? "text-[var(--mac-status-connected)]" : "text-[var(--mac-status-warning-text)]"
                          )}>{Math.round(d.confidence * 100)}%</p>
                        </div>
                        {d.expanded ? <ChevronUp className="h-4 w-4 opacity-40 text-[var(--mac-text-primary)]" /> : <ChevronDown className="h-4 w-4 opacity-40 text-[var(--mac-text-primary)]" />}
                      </div>
                    </div>
                    {d.expanded && (
                      <div className="p-4 pt-0 border-t border-[var(--mac-utility-border)] animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
                          <div className="flex items-center gap-2 text-[10px] uppercase text-[var(--mac-text-muted)] tracking-widest">
                            <Info className="h-3 w-3" /> AI Reasoning
                          </div>
                          <p className="text-xs font-light leading-relaxed text-foreground italic">
                            "{d.reasoning}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Tool Usage Breakdown */}
      <Card className="mac-glass bg-[var(--mac-surface-card)] border-[var(--mac-utility-border)]">
        <CardHeader>
          <CardTitle className="font-light text-lg flex items-center gap-2 text-[var(--mac-text-primary)]">
            <Zap className="h-5 w-5 text-[var(--mac-warning-yellow)]" />
            Tool Orchestration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <ToolIcon label="Search" count={124} />
            <ToolIcon label="Rerank" count={89} />
            <ToolIcon label="Git" count={42} />
            <ToolIcon label="Jira" count={31} />
            <ToolIcon label="Slack" count={12} />
            <ToolIcon label="Schema" count={56} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InsightCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card className="mac-glass bg-[var(--mac-surface-card)] border border-[var(--mac-utility-border)]">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-normal uppercase tracking-wider text-[var(--mac-text-secondary)]">{title}</p>
          <h4 className="text-xl font-light text-[var(--mac-text-primary)]">{value}</h4>
        </div>
        <div className="p-2 rounded-lg bg-[var(--mac-surface-elevated)] border border-[var(--mac-utility-border)]">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function ToolIcon({ label, count }: { label: string, count: number }) {
  return (
    <div className="text-center p-3 rounded-xl bg-[var(--mac-surface-elevated)] border border-[var(--mac-utility-border)] hover:border-[var(--mac-primary-blue-400)]/30 transition-all duration-300">
      <p className="text-[10px] font-normal text-[var(--mac-text-secondary)] uppercase mb-1">{label}</p>
      <p className="text-lg font-light text-[var(--mac-text-primary)]">{count}</p>
    </div>
  );
}

