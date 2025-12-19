"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { 
  Activity, 
  ShieldCheck,
  Zap,
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
        <Card className="mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)] lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-light text-xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[var(--mac-primary-blue-400)]" />
              Document Processing Velocity
            </CardTitle>
            <CardDescription className="font-light text-xs uppercase tracking-widest opacity-60">Daily indexing volume vs average quality</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
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
                <Bar dataKey="processed" fill="var(--mac-data-coral)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
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

