"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../card";
import { Badge } from "../badge";
import { Button } from "../button";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { 
  Lightbulb, 
  TrendingUp, 
  Zap, 
  Target, 
  Users, 
  Shield, 
  Clock,
  ArrowUpRight,
  Sparkles,
  Info
} from "lucide-react";
import { cn } from "../../../lib/utils";

// Mock data for the learning curve
const qualityData = [
  { date: "Dec 01", quality: 72 },
  { date: "Dec 03", quality: 74 },
  { date: "Dec 05", quality: 73 },
  { date: "Dec 07", quality: 76 },
  { date: "Dec 09", quality: 78 },
  { date: "Dec 11", quality: 77 },
  { date: "Dec 13", quality: 81 },
  { date: "Dec 15", quality: 83 },
  { date: "Dec 17", quality: 82 },
  { date: "Dec 18", quality: 85 },
];

const topicData = [
  { topic: "Auth Flow", improvement: 28 },
  { topic: "DDP Specs", improvement: 22 },
  { topic: "Asset Sorting", improvement: 18 },
  { topic: "Permissions", improvement: 15 },
  { topic: "API Errors", improvement: 12 },
];

const sourceWeights = [
  { source: "Knowledge", weight: 15, color: "var(--mac-primary-blue-400)" },
  { source: "Jira", weight: 8, color: "var(--mac-accent-primary-400)" },
  { source: "Git", weight: -3, color: "var(--mac-status-error-text)" },
  { source: "Email", weight: 2, color: "var(--mac-text-secondary)" },
];

export function ReinforcementDashboardTab() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Avg Accuracy" 
          value="85.2%" 
          delta="+3.2%" 
          icon={<Target className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />} 
          trend="up"
        />
        <MetricCard 
          title="Training Batches" 
          value="12" 
          delta="+2" 
          icon={<Lightbulb className="h-4 w-4 text-[var(--mac-accent-primary-400)]" />} 
          trend="up"
        />
        <MetricCard 
          title="Feedback Loop" 
          value="1.2s" 
          delta="-0.3s" 
          icon={<Zap className="h-4 w-4 text-[var(--mac-status-connected)]" />} 
          trend="down"
        />
        <MetricCard 
          title="Active Curators" 
          value="8" 
          delta="Stable" 
          icon={<Users className="h-4 w-4 text-[var(--mac-text-secondary)]" />} 
          trend="stable"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Timeline */}
        <Card className="mac-card mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)] lg:col-span-2">
          <CardHeader className="mac-card">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-light text-xl flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[var(--mac-primary-blue-400)]" />
                  Quality Improvement Timeline
                </CardTitle>
                <CardDescription className="font-light text-[var(--mac-text-secondary)]">AI response accuracy tracking over last 30 days</CardDescription>
              </div>
              <Badge variant="outline" className="bg-[var(--mac-primary-blue-400)]/10 text-[var(--mac-primary-blue-400)] border-[var(--mac-primary-blue-400)]/20 font-light">
                Learning Phase: Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={qualityData}>
                <defs>
                  <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--mac-primary-blue-400)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--mac-primary-blue-400)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--mac-utility-border)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "var(--mac-text-secondary)" }} 
                />
                <YAxis 
                  domain={[60, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "var(--mac-text-secondary)" }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--mac-surface-elevated)", 
                    border: "1px solid var(--mac-utility-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--mac-text-primary)"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="quality" 
                  stroke="var(--mac-primary-blue-400)" 
                  fillOpacity={1} 
                  fill="url(#colorQuality)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Improved Topics */}
        <Card className="mac-card mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)]">
          <CardHeader className="mac-card">
            <CardTitle className="font-light text-xl flex items-center gap-2 text-[var(--mac-text-primary)]">
              <Sparkles className="h-5 w-5 text-[var(--mac-accent-primary-400)]" />
              Top Gains
            </CardTitle>
            <CardDescription className="font-light text-[var(--mac-text-secondary)]">Topics with highest quality improvement</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicData} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="topic" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: "var(--mac-text-primary)" }} 
                />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="improvement" radius={[0, 4, 4, 0]}>
                  {topicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "var(--mac-primary-blue-400)" : "var(--mac-primary-blue-400-muted, rgba(59, 130, 246, 0.25))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source Weights */}
        <Card className="mac-card mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)]">
          <CardHeader className="mac-card">
            <CardTitle className="font-light text-lg flex items-center gap-2 text-[var(--mac-text-primary)]">
              <Shield className="h-5 w-5 text-[var(--mac-text-secondary)]" />
              Source Reinforcement Weights
            </CardTitle>
            <CardDescription className="font-light text-[var(--mac-text-secondary)]">System-wide boosts/penalties based on curator feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sourceWeights.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-light">
                  <span className="text-[var(--mac-text-primary)]">{s.source}</span>
                  <span className={cn(s.weight > 0 ? "text-[var(--mac-status-connected)]" : "text-[var(--mac-status-error-text)]")}>
                    {s.weight > 0 ? "+" : ""}{s.weight}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[var(--mac-utility-border)] rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000" 
                    style={{ 
                      width: `${Math.abs(s.weight) * 2}%`, 
                      backgroundColor: s.color,
                      marginLeft: s.weight < 0 ? '0' : '0' 
                    }} 
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leaderboard & Stats */}
        <Card className="mac-card mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)]">
          <CardHeader className="mac-card">
            <CardTitle className="font-light text-lg flex items-center gap-2 text-[var(--mac-text-primary)]">
              <Users className="h-5 w-5 text-[var(--mac-text-secondary)]" />
              Curator Contributions
            </CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="space-y-3">
              <LeaderboardRow name="matt@betabase.com" count={42} badge="🏆 Master" isMe />
              <LeaderboardRow name="claudette@agent.ai" count={38} badge="🥇 Expert" />
              <LeaderboardRow name="jane.d@sony.com" count={15} badge="⭐ Rising Star" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  delta, 
  icon, 
  trend 
}: { 
  title: string, 
  value: string, 
  delta: string, 
  icon: React.ReactNode,
  trend: 'up' | 'down' | 'stable'
}) {
  const trendColor = {
    up: "text-[var(--mac-status-connected)]",
    down: "text-[var(--mac-status-error-text)]",
    stable: "text-[var(--mac-text-muted)]"
  };

  return (
    <Card className="mac-card mac-glass bg-[var(--mac-surface-card)] border-[var(--mac-utility-border)] hover:border-[var(--mac-primary-blue-400)]/30 transition-all duration-300 group">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <p className="mac-body text-[10px] font-normal uppercase tracking-wider text-[var(--mac-text-secondary)]">{title}</p>
          <div className="flex items-baseline gap-2">
            <h4 className="mac-title text-[var(--mac-text-primary)]">{value}</h4>
            <span className={cn("text-[10px] font-normal", trendColor[trend])}>
              {delta}
            </span>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-[var(--mac-surface-elevated)] border border-[var(--mac-utility-border)] group-hover:border-[var(--mac-primary-blue-400)]/40 transition-colors">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardRow({ name, count, badge, isMe = false }: { name: string, count: number, badge: string, isMe?: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-lg border transition-all duration-200",
      isMe ? "bg-[var(--mac-primary-blue-400)]/10 border-[var(--mac-primary-blue-400)]/20" : "bg-transparent border-transparent"
    )}>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-[var(--mac-surface-elevated)] border border-[var(--mac-utility-border)] flex items-center justify-center text-xs font-light">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-light text-[var(--mac-text-primary)] truncate">{name}</p>
          <p className="mac-body text-[10px] text-[var(--mac-text-secondary)]">{badge}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-light text-[var(--mac-primary-blue-400)]">{count}</p>
        <p className="mac-body text-[9px] uppercase text-[var(--mac-text-muted)] tracking-tighter">Corrections</p>
      </div>
    </div>
  );
}

