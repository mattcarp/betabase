import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import type { ComponentProps, HTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import type { UIMessage } from "ai";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ cclassName, from, ...props }: MessageProps) => (
  <div
    cclassName={cn(
      "group flex w-full items-end gap-2 py-4",
      from === "user" ? "is-user justify-end" : "is-assistant justify-start",
      "[&>div]:max-w-[80%] [&>div]:break-words",
      cclassName
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({ children, cclassName, ...props }: MessageContentProps) => (
  <div
    cclassName={cn(
      "flex flex-col gap-2 rounded-lg text-sm text-foreground px-4 py-4",
      "overflow-hidden break-words word-wrap min-w-0",
      "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground",
      "group-[.is-assistant]:bg-secondary group-[.is-assistant]:text-foreground",
      cclassName
    )}
    {...props}
  >
    <div cclassName="is-user:dark min-w-0 break-words">{children}</div>
  </div>
);

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src: string;
  name?: string;
};

export const MessageAvatar = ({ src, name, cclassName, ...props }: MessageAvatarProps) => (
  <Avatar cclassName={cn("size-8 ring ring-1 ring-border", cclassName)} {...props}>
    <AvatarImage alt="" cclassName="mt-0 mb-0" src={src} />
    <AvatarFallback>{name?.slice(0, 2) || "ME"}</AvatarFallback>
  </Avatar>
);
