"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { 
  Activity, 
  Database, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  ShieldCheck,
  Zap,
  Clock,
  Layers,
  BarChart3
} from "lucide-react";
import { cn } from "../../lib/utils";

// Mock data for executive dashboard
const processingTrends = [
  { day: "Mon", processed: 42, quality: 82 },
  { day: "Tue", processed: 56, quality: 84 },
  { day: "Wed", processed: 38, quality: 83 },
  { day: "Thu", processed: 64, quality: 86 },
  { day: "Fri", processed: 51, quality: 85 },
  { day: "Sat", processed: 22, quality: 88 },
  { day: "Sun", processed: 18, quality: 87 },
];

// MAC Data Storytelling: muted professional colors (not bright/garish)
const categoryHealth = [
  { name: "Legal", value: 92, count: 450, color: "var(--mac-data-teal)" },
  { name: "Technical", value: 85, count: 1200, color: "var(--mac-data-purple)" },
  { name: "Marketing", value: 78, count: 320, color: "var(--mac-data-coral)" },
  { name: "Finance", value: 88, count: 280, color: "var(--mac-data-success)" },
];

export function DashboardTab() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Executive KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="KB Health" 
          value="88.4%" 
          description="Avg document quality" 
          icon={<Activity className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />} 
          trend="+2.1%"
        />
        <KPICard 
          title="Optimization" 
          value="25.1%" 
          description="Storage saved by dedupe" 
          icon={<Zap className="h-4 w-4" style={{ color: 'var(--mac-data-warning)' }} />} 
          trend="+5.4%"
        />
        <KPICard 
          title="Processing" 
          value="482" 
          description="Chunks indexed today" 
          icon={<Layers className="h-4 w-4 text-[var(--mac-accent-purple-400)]" />} 
          trend="+12%"
        />
        <KPICard 
          title="Coverage" 
          value="94.2%" 
          description="Requirement mapping" 
          icon={<ShieldCheck className="h-4 w-4 text-[var(--mac-status-connected)]" />} 
          trend="Stable"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Processing Velocity */}
        <Card className="mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)] lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-light text-xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[var(--mac-primary-blue-400)]" />
              Document Processing Velocity
            </CardTitle>
            <CardDescription className="font-light text-xs uppercase tracking-widest opacity-60">Daily indexing volume vs average quality</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processingTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--mac-utility-border)" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "var(--mac-text-secondary)" }} 
                />
                <YAxis 
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
                <Bar dataKey="processed" fill="var(--mac-data-coral)" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Health Heatmap */}
        <Card className="mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)]">
          <CardHeader>
            <CardTitle className="font-light text-xl flex items-center gap-2">
              <Database className="h-5 w-5 text-[var(--mac-accent-purple-400)]" />
              Category Health
            </CardTitle>
            <CardDescription className="font-light text-xs opacity-60 uppercase tracking-widest">Document quality by department</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col justify-center">
            <div className="space-y-5">
              {categoryHealth.map((cat, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-light">
                    <span className="text-[var(--mac-text-primary)]">{cat.name} ({cat.count} docs)</span>
                    <span className="text-[var(--mac-text-secondary)]">{cat.value}% Health</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--mac-utility-border)] rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ 
                        width: `${cat.value}%`, 
                        backgroundColor: cat.color 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-[var(--mac-utility-border)]">
              <div className="flex justify-between items-center px-2">
                <div className="text-center">
                  <p className="text-[10px] uppercase text-[var(--mac-text-muted)] tracking-tighter">Total Assets</p>
                  <p className="text-lg font-light">2,250</p>
                </div>
                <div className="h-8 w-px bg-[var(--mac-utility-border)]" />
                <div className="text-center">
                  <p className="text-[10px] uppercase text-[var(--mac-text-muted)] tracking-tighter">Unique Chunks</p>
                  <p className="text-lg font-light">12,482</p>
                </div>
                <div className="h-8 w-px bg-[var(--mac-utility-border)]" />
                <div className="text-center">
                  <p className="text-[10px] uppercase text-[var(--mac-text-muted)] tracking-tighter">Verified</p>
                  <p className="text-lg font-light text-[var(--mac-status-connected)]">82%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ title, value, description, icon, trend }: { title: string, value: string, description: string, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="mac-glass bg-[var(--mac-surface-card)] border border-[var(--mac-utility-border)] hover:border-[var(--mac-utility-border-elevated)] transition-all duration-300 group shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-[var(--mac-surface-elevated)] border border-[var(--mac-utility-border)] group-hover:border-[var(--mac-primary-blue-400)]/30 transition-colors">
            {icon}
          </div>
          <span className={cn(
            "text-[10px] font-normal px-1.5 py-0.5 rounded-full border",
            trend.startsWith("+") ? "bg-[var(--mac-status-connected-bg)] text-[var(--mac-status-connected-text)] border-[var(--mac-status-connected-border)]" : "bg-zinc-800 text-zinc-400 border-zinc-700"
          )}>
            {trend}
          </span>
        </div>
        <div className="space-y-0.5">
          <h4 className="text-2xl font-light text-[var(--mac-text-primary)]">{value}</h4>
          <p className="text-[10px] font-normal uppercase tracking-wider text-[var(--mac-text-secondary)]">{title}</p>
          <p className="text-[10px] text-[var(--mac-text-muted)] font-light mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

