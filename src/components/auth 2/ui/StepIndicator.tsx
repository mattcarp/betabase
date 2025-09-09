import React from "react";
import { cn } from "../../../../lib/utils";
import { Progress } from "../../ui/progress";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  className,
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className={cn("mb-6", className)}>
      <div className="flex justify-center mb-3">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full mx-1 transition-all duration-300",
              i <= currentStep
                ? "bg-neon-cyan shadow-[0_0_10px_rgba(6,255,165,0.5)]"
                : "bg-muted",
            )}
          />
        ))}
      </div>
      <Progress
        value={progress}
        className="h-1 bg-gray-700/50 [&>*:first-child]:bg-gradient-to-r [&>*:first-child]:from-neon-cyan [&>*:first-child]:to-neon-blue"
      />
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Step {currentStep + 1} of {totalSteps}
      </p>
    </div>
  );
};

interface FormProgressProps {
  step: number;
  totalSteps: number;
  className?: string;
}

export const FormProgress: React.FC<FormProgressProps> = ({
  step,
  totalSteps,
  className,
}) => {
  return (
    <div className={cn("mb-6", className)}>
      <Progress
        value={(step / totalSteps) * 100}
        className="h-2 bg-gray-700/50 [&>*:first-child]:bg-gradient-to-r [&>*:first-child]:from-neon-cyan [&>*:first-child]:to-neon-blue [&>*:first-child]:shadow-[0_0_10px_rgba(6,255,165,0.3)]"
      />
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Step {step} of {totalSteps}
      </p>
    </div>
  );
};
