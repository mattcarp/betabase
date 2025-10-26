"use client";

import type { ComponentProps } from "react";
import { Button } from "../ui/button";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { cn } from "../../lib/utils";

export type SuggestionsProps = ComponentProps<typeof ScrollArea>;

export const Suggestions = ({ cclassName, children, ...props }: SuggestionsProps) => (
  <ScrollArea cclassName="w-full overflow-x-auto whitespace-nowrap" {...props}>
    <div cclassName={cn("flex w-max flex-nowrap items-center gap-2", cclassName)}>{children}</div>
    <ScrollBar cclassName="hidden" orientation="horizontal" />
  </ScrollArea>
);

export type SuggestionProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  cclassName,
  variant = "outline",
  size = "sm",
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = () => {
    onClick?.(suggestion);
  };

  return (
    <Button
      cclassName={cn(
        "mac-button mac-button-primary",
        "cursor-pointer rounded-lg px-4 w-full !text-left !justify-start items-start",
        cclassName
      )}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      <span cclassName="text-left w-full">{children || suggestion}</span>
    </Button>
  );
};
