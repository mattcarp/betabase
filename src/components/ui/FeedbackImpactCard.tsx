/**
 * FeedbackImpactCard - Displays the virtuous cycle of human feedback
 *
 * Shows how user corrections translate into:
 * - Test cases generated
 * - Accuracy improvements
 * - Model fine-tuning data
 *
 * This is a key "wow moment" for the demo showing the feedback loop.
 */

import { cn } from "../../lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { Badge } from "./badge";
import { Progress } from "./progress";
import {
  ArrowRight,
  TrendingUp,
  FileCheck,
  BrainCircuit,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";

interface FeedbackImpactCardProps {
  className?: string;
}

// Demo data showing the feedback impact
const impactData = {
  totalCorrections: 23,
  testCasesGenerated: 89,
  accuracyImprovement: 11,
  currentAccuracy: 94,
  finetuningBatches: 3,
  recentCorrections: [
    {
      id: "c1",
      correction: "Added mandatory AOMA 9.1 section reference",
      testsGenerated: 4,
      timestamp: "2 hours ago",
    },
    {
      id: "c2",
      correction: "Fixed classification hierarchy for rights management",
      testsGenerated: 6,
      timestamp: "5 hours ago",
    },
    {
      id: "c3",
      correction: "Clarified royalty calculation formula",
      testsGenerated: 3,
      timestamp: "Yesterday",
    },
  ],
};

export function FeedbackImpactCard({ className }: FeedbackImpactCardProps) {
  return (
    <Card
      className={cn(
        "mac-glass",
        "border-[var(--mac-utility-border)]",
        "bg-[var(--mac-surface-card)]",
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-light text-[var(--mac-text-primary)]">
              Feedback Impact
            </CardTitle>
            <CardDescription className="text-[var(--mac-text-secondary)]">
              Your corrections drive continuous improvement
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="border-[var(--mac-accent-green-400)] text-[var(--mac-accent-green-400)] bg-[var(--mac-accent-green-400)]/10"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            +{impactData.accuracyImprovement}% this month
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-3 gap-4">
          <MetricBox
            icon={<MessageSquareQuote className="h-5 w-5" />}
            value={impactData.totalCorrections}
            label="Corrections"
            color="orange"
          />
          <MetricBox
            icon={<FileCheck className="h-5 w-5" />}
            value={impactData.testCasesGenerated}
            label="Tests Created"
            color="blue"
          />
          <MetricBox
            icon={<BrainCircuit className="h-5 w-5" />}
            value={impactData.finetuningBatches}
            label="Training Batches"
            color="purple"
          />
        </div>

        {/* Accuracy Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--mac-text-secondary)]">
              Current Accuracy
            </span>
            <span className="text-sm font-medium text-[var(--mac-text-primary)]">
              {impactData.currentAccuracy}%
            </span>
          </div>
          <Progress
            value={impactData.currentAccuracy}
            className="h-2"
          />
          <p className="text-xs text-[var(--mac-text-tertiary)]">
            Improved from 83% to {impactData.currentAccuracy}% based on your
            feedback
          </p>
        </div>

        {/* Virtuous Cycle Visualization */}
        <div className="flex items-center justify-center gap-2 py-4 bg-[var(--mac-surface-elevated)] rounded-lg">
          <CycleStep icon={<MessageSquareQuote />} label="Correction" />
          <ArrowRight className="h-4 w-4 text-[var(--mac-text-tertiary)]" />
          <CycleStep icon={<FileCheck />} label="Test Case" />
          <ArrowRight className="h-4 w-4 text-[var(--mac-text-tertiary)]" />
          <CycleStep icon={<BrainCircuit />} label="Training" />
          <ArrowRight className="h-4 w-4 text-[var(--mac-text-tertiary)]" />
          <CycleStep icon={<Sparkles />} label="Better AI" />
        </div>

        {/* Recent Corrections with Impact */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[var(--mac-text-primary)]">
            Recent Corrections
          </h4>
          {impactData.recentCorrections.map((correction) => (
            <div
              key={correction.id}
              className="flex items-start justify-between p-3 rounded-lg bg-[var(--mac-surface-elevated)] border border-[var(--mac-utility-border)]"
            >
              <div className="space-y-1 flex-1">
                <p className="text-sm text-[var(--mac-text-primary)]">
                  {correction.correction}
                </p>
                <p className="text-xs text-[var(--mac-text-tertiary)]">
                  {correction.timestamp}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="ml-2 bg-[var(--mac-accent-blue-400)]/10 text-[var(--mac-accent-blue-400)]"
              >
                {correction.testsGenerated} tests
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper Components

function MetricBox({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: "orange" | "blue" | "purple";
}) {
  const colorClasses = {
    orange:
      "text-[var(--mac-accent-orange-400)] bg-[var(--mac-accent-orange-400)]/10",
    blue: "text-[var(--mac-accent-blue-400)] bg-[var(--mac-accent-blue-400)]/10",
    purple:
      "text-[var(--mac-accent-purple-400)] bg-[var(--mac-accent-purple-400)]/10",
  };

  return (
    <div className="text-center p-4 rounded-lg bg-[var(--mac-surface-elevated)] border border-[var(--mac-utility-border)]">
      <div
        className={cn(
          "inline-flex items-center justify-center w-10 h-10 rounded-full mb-2",
          colorClasses[color]
        )}
      >
        {icon}
      </div>
      <div className="text-2xl font-light text-[var(--mac-text-primary)]">
        {value}
      </div>
      <div className="text-xs text-[var(--mac-text-secondary)]">{label}</div>
    </div>
  );
}

function CycleStep({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 h-8 rounded-full bg-[var(--mac-accent-blue-400)]/10 flex items-center justify-center text-[var(--mac-accent-blue-400)]">
        {icon}
      </div>
      <span className="text-xs text-[var(--mac-text-tertiary)]">{label}</span>
    </div>
  );
}

export default FeedbackImpactCard;
