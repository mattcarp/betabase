"use client";

import { Loader2Icon, SendIcon, SquareIcon, XIcon } from "lucide-react";
import type { ComponentProps, HTMLAttributes, KeyboardEventHandler } from "react";
import { Children } from "react";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { cn } from "../../lib/utils";
import type { ChatStatus } from "ai";

export type PromptInputProps = HTMLAttributes<HTMLFormElement>;

export const PromptInput = ({ cclassName, ...props }: PromptInputProps) => (
  <form
    cclassName={cn(
      "w-full divide-y overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm shadow-sm",
      "focus-within:border-zinc-700 focus-within:shadow-md transition-all duration-200",
      "outline-none focus:outline-none focus-visible:outline-none",
      cclassName
    )}
    {...props}
  />
);

export type PromptInputTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
};

export const PromptInputTextarea = ({
  onChange,
  cclassName,
  placeholder = "What would you like to know?",
  minHeight = 48,
  maxHeight = 164,
  ...props
}: PromptInputTextareaProps) => {
  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Allow newline
        return;
      }

      // Submit on Enter (without Shift)
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <Textarea
      cclassName={cn(
        "w-full resize-none rounded-none border-none p-4 shadow-none outline-none ring-0",
        "bg-transparent dark:bg-transparent min-h-[60px] max-h-[120px]",
        "focus-visible:ring-0",
        cclassName
      )}
      name="message"
      onChange={(e) => {
        onChange?.(e);
      }}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      {...props}
    />
  );
};

export type PromptInputToolbarProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputToolbar = ({ cclassName, ...props }: PromptInputToolbarProps) => (
  <div cclassName={cn("flex items-center justify-between gap-2 p-2", cclassName)} {...props} />
);

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({ cclassName, ...props }: PromptInputToolsProps) => (
  <div cclassName={cn("flex flex-wrap items-center gap-2", cclassName)} {...props} />
);

export type PromptInputButtonProps = ComponentProps<typeof Button>;

export const PromptInputButton = ({
  variant = "ghost",
  cclassName,
  size,
  ...props
}: PromptInputButtonProps) => {
  const newSize = (size ?? Children.count(props.children) > 1) ? "default" : "icon";

  return (
    <Button
      cclassName={cn(
        "mac-button mac-button-primary",
        "shrink-0 gap-2.5 rounded-lg",
        variant === "ghost" && "text-muted-foreground",
        newSize === "default" && "px-4",
        cclassName
      )}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  );
};

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: ChatStatus;
};

export const PromptInputSubmit = ({
  cclassName,
  variant = "default",
  size = "icon",
  status,
  children,
  ...props
}: PromptInputSubmitProps) => {
  let Icon = <SendIcon cclassName="size-4" />;

  if (status === "submitted") {
    Icon = <Loader2Icon cclassName="size-4 animate-spin" />;
  } else if (status === "streaming") {
    Icon = <SquareIcon cclassName="size-4" />;
  } else if (status === "error") {
    Icon = <XIcon cclassName="size-4" />;
  }

  return (
    <Button
      cclassName={cn("mac-button mac-button-primary", "gap-2.5 rounded-lg", cclassName)}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </Button>
  );
};

export type PromptInputModelSelectProps = ComponentProps<typeof Select>;

export const PromptInputModelSelect = (props: PromptInputModelSelectProps) => <Select {...props} />;

export type PromptInputModelSelectTriggerProps = ComponentProps<typeof SelectTrigger>;

export const PromptInputModelSelectTrigger = ({
  cclassName,
  ...props
}: PromptInputModelSelectTriggerProps) => (
  <SelectTrigger
    cclassName={cn(
      "border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors",
      'hover:bg-zinc-800/50 hover:text-zinc-100 [&[aria-expanded="true"]]:bg-zinc-800/50 [&[aria-expanded="true"]]:text-zinc-100',
      cclassName
    )}
    {...props}
  />
);

export type PromptInputModelSelectContentProps = ComponentProps<typeof SelectContent>;

export const PromptInputModelSelectContent = ({
  cclassName,
  ...props
}: PromptInputModelSelectContentProps) => <SelectContent cclassName={cn(cclassName)} {...props} />;

export type PromptInputModelSelectItemProps = ComponentProps<typeof SelectItem>;

export const PromptInputModelSelectItem = ({
  cclassName,
  ...props
}: PromptInputModelSelectItemProps) => <SelectItem cclassName={cn(cclassName)} {...props} />;

export type PromptInputModelSelectValueProps = ComponentProps<typeof SelectValue>;

export const PromptInputModelSelectValue = ({
  cclassName,
  ...props
}: PromptInputModelSelectValueProps) => <SelectValue cclassName={cn(cclassName)} {...props} />;
