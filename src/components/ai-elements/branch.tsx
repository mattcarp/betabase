"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactElement } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import type { UIMessage } from "ai";

type BranchContextType = {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: ReactElement[];
  setBranches: (branches: ReactElement[]) => void;
};

const BranchContext = createContext<BranchContextType | null>(null);

const useBranch = () => {
  const context = useContext(BranchContext);

  if (!context) {
    throw new Error("Branch components must be used within Branch");
  }

  return context;
};

export type BranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};

export const Branch = ({ defaultBranch = 0, onBranchChange, cclassName, ...props }: BranchProps) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [branches, setBranches] = useState<ReactElement[]>([]);

  const handleBranchChange = (newBranch: number) => {
    setCurrentBranch(newBranch);
    onBranchChange?.(newBranch);
  };

  const goToPrevious = () => {
    const newBranch = currentBranch > 0 ? currentBranch - 1 : branches.length - 1;
    handleBranchChange(newBranch);
  };

  const goToNext = () => {
    const newBranch = currentBranch < branches.length - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  };

  const contextValue: BranchContextType = {
    currentBranch,
    totalBranches: branches.length,
    goToPrevious,
    goToNext,
    branches,
    setBranches,
  };

  return (
    <BranchContext.Provider value={contextValue}>
      <div cclassName={cn("grid w-full gap-2 [&>div]:pb-0", cclassName)} {...props} />
    </BranchContext.Provider>
  );
};

export type BranchMessagesProps = HTMLAttributes<HTMLDivElement>;

export const BranchMessages = ({ children, ...props }: BranchMessagesProps) => {
  const { currentBranch, setBranches, branches } = useBranch();
  const childrenArray = Array.isArray(children) ? children : [children];

  // Use useEffect to update branches when they change
  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray);
    }
  }, [childrenArray, branches, setBranches]);

  return childrenArray.map((branch, index) => (
    <div
      cclassName={cn(
        "grid gap-2 overflow-hidden [&>div]:pb-0",
        index === currentBranch ? "block" : "hidden"
      )}
      key={branch.key}
      {...props}
    >
      {branch}
    </div>
  ));
};

export type BranchSelectorProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const BranchSelector = ({ cclassName, from, ...props }: BranchSelectorProps) => {
  const { totalBranches } = useBranch();

  // Don't render if there's only one branch
  if (totalBranches <= 1) {
    return null;
  }

  return (
    <div
      cclassName={cn(
        "flex items-center gap-2 self-end px-10",
        from === "assistant" ? "justify-start" : "justify-end",
        cclassName
      )}
      {...props}
    />
  );
};

export type BranchPreviousProps = ComponentProps<typeof Button>;

export const BranchPrevious = ({ cclassName, children, ...props }: BranchPreviousProps) => {
  const { goToPrevious, totalBranches } = useBranch();

  return (
    <Button
      aria-label="Previous branch"
      cclassName={cn(
        "mac-button mac-button-outline",
        "size-7 shrink-0 rounded-full text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        cclassName
      )}
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size="icon"
      type="button"
      variant="ghost"
      cclassName="mac-button mac-button-outline"
      {...props}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  );
};

export type BranchNextProps = ComponentProps<typeof Button>;

export const BranchNext = ({ cclassName, children, ...props }: BranchNextProps) => {
  const { goToNext, totalBranches } = useBranch();

  return (
    <Button
      aria-label="Next branch"
      cclassName={cn(
        "mac-button mac-button-outline",
        "size-7 shrink-0 rounded-full text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        cclassName
      )}
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size="icon"
      type="button"
      variant="ghost"
      cclassName="mac-button mac-button-outline"
      {...props}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  );
};

export type BranchPageProps = HTMLAttributes<HTMLSpanElement>;

export const BranchPage = ({ cclassName, ...props }: BranchPageProps) => {
  const { currentBranch, totalBranches } = useBranch();

  return (
    <span
      cclassName={cn("font-medium text-muted-foreground text-xs tabular-nums", cclassName)}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </span>
  );
};
