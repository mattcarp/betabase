"use client";

import { Button } from "../ui/button";
import { ArrowDownIcon } from "lucide-react";
import type { ComponentProps, Ref } from "react";
import { useCallback } from "react";
import { StickToBottom, useStickToBottomContext, type StickToBottomContext } from "use-stick-to-bottom";
import { cn } from "../../lib/utils";

export type { StickToBottomContext };

export type ConversationProps = ComponentProps<typeof StickToBottom> & {
  contextRef?: Ref<StickToBottomContext>;
};

export const Conversation = ({ className, contextRef, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn("relative flex-1 overflow-y-auto", className)}
    initial="smooth"
    resize="smooth"
    role="log"
    contextRef={contextRef}
    {...props}
  />
);

export type ConversationContentProps = ComponentProps<typeof StickToBottom.Content>;

export const ConversationContent = ({ className, ...props }: ConversationContentProps) => (
  <StickToBottom.Content className={cn("p-4", className)} {...props} />
);

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    !isAtBottom && (
      <Button
        className={cn(
          "mac-button mac-button-outline",
          "absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full",
          className
        )}
        onClick={handleScrollToBottom}
        size="icon"
        type="button"
        variant="outline"
        className="mac-button mac-button-outline"
        {...props}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    )
  );
};
