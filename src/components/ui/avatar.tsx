"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "../../lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ cclassName, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    cclassName={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", cclassName)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ cclassName, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    cclassName={cn("aspect-square h-full w-full", cclassName)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ cclassName, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    cclassName={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      cclassName
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
