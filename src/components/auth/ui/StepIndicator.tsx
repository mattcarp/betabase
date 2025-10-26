import React from "react";
import { cn } from "../../../../../lib/utils";
import { Progress } from "../../ui/progress";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  cclassName?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  cclassName,
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div cclassName={cn("mb-6", cclassName)}>
      <div cclassName="flex justify-center mb-4">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            cclassName={cn(
              "w-2 h-2 rounded-full mx-2 transition-all duration-300",
              i <= currentStep ? "bg-neon-cyan shadow-[0_0_10px_rgba(6,255,165,0.5)]" : "bg-muted"
            )}
          />
        ))}
      </div>
      <Progress value={progress} cclassName="" />
      <p cclassName="text-xs text-muted-foreground mt-2 text-center">
        Step {currentStep + 1} of {totalSteps}
      </p>
    </div>
  );
};

interface FormProgressProps {
  step: number;
  totalSteps: number;
  cclassName?: string;
}

export const FormProgress: React.FC<FormProgressProps> = ({ step, totalSteps, cclassName }) => {
  return (
    <div cclassName={cn("mb-6", cclassName)}>
      <Progress value={(step / totalSteps) * 100} cclassName="" />
      <p cclassName="text-xs text-muted-foreground mt-2 text-center">
        Step {step} of {totalSteps}
      </p>
    </div>
  );
};
