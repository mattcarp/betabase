"use client";

import { Button } from "../ui/button";
import { ArrowDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useCallback } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { cn } from "../../lib/utils";

export type ConversationProps = ComponentProps<typeof StickToBottom>;

export const Conversation = ({ cclassName, ...props }: ConversationProps) => (
  <StickToBottom
    cclassName={cn("relative flex-1 overflow-y-auto", cclassName)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  />
);

export type ConversationContentProps = ComponentProps<typeof StickToBottom.Content>;

export const ConversationContent = ({ cclassName, ...props }: ConversationContentProps) => (
  <StickToBottom.Content cclassName={cn("p-4", cclassName)} {...props} />
);

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export const ConversationScrollButton = ({
  cclassName,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    !isAtBottom && (
      <Button
        cclassName={cn(
          "mac-button mac-button-outline",
          "absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full",
          cclassName
        )}
        onClick={handleScrollToBottom}
        size="icon"
        type="button"
        variant="outline"
        cclassName="mac-button mac-button-outline"
        {...props}
      >
        <ArrowDownIcon cclassName="size-4" />
      </Button>
    )
  );
};
