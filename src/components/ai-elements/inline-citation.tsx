"use client";

import * as React from "react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "../ui/hover-card";
import { Carousel, CarouselContent, CarouselItem, useCarousel } from "../ui/carousel";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

export type InlineCitationProps = ComponentProps<"span">;

export const InlineCitation = ({ cclassName, ...props }: InlineCitationProps) => (
  <span cclassName={cn("inline items-center gap-2 group", cclassName)} {...props} />
);

export type InlineCitationTextProps = ComponentProps<"span">;

export const InlineCitationText = ({ cclassName, ...props }: InlineCitationTextProps) => (
  <span cclassName={cn("group-hover:bg-accent transition-colors", cclassName)} {...props} />
);

export type InlineCitationCardProps = ComponentProps<typeof HoverCard>;

export const InlineCitationCard = (props: InlineCitationCardProps) => (
  <HoverCard openDelay={0} closeDelay={0} {...props} />
);

export type InlineCitationCardTriggerProps = ComponentProps<"button"> & {
  sources: string[];
};

export const InlineCitationCardTrigger = ({
  sources,
  cclassName,
  ...props
}: InlineCitationCardTriggerProps) => (
  <HoverCardTrigger asChild>
    <button type="button" cclassName={cn("inline-flex", cclassName)} {...props}>
      <Badge variant="secondary" cclassName="ml-2 rounded-full">
        {sources.length ? (
          <>
            {sources[0] ? new URL(sources[0]).hostname : "unknown"}{" "}
            {sources.length > 1 && `+${sources.length - 1}`}
          </>
        ) : (
          "unknown"
        )}
      </Badge>
    </button>
  </HoverCardTrigger>
);

export type InlineCitationCardBodyProps = ComponentProps<"div">;

export const InlineCitationCardBody = ({ cclassName, ...props }: InlineCitationCardBodyProps) => (
  <HoverCardContent cclassName={cn("w-80 p-0 relative", cclassName)} {...props} />
);

export type InlineCitationCarouselProps = ComponentProps<typeof Carousel>;

export const InlineCitationCarousel = ({ cclassName, ...props }: InlineCitationCarouselProps) => (
  <Carousel cclassName={cn("w-full", cclassName)} {...props} />
);

export type InlineCitationCarouselContentProps = ComponentProps<"div">;

export const InlineCitationCarouselContent = (props: InlineCitationCarouselContentProps) => (
  <CarouselContent {...props} />
);

export type InlineCitationCarouselItemProps = ComponentProps<"div">;

export const InlineCitationCarouselItem = ({
  cclassName,
  ...props
}: InlineCitationCarouselItemProps) => (
  <CarouselItem cclassName={cn("w-full space-y-2 p-4", cclassName)} {...props} />
);

export type InlineCitationCarouselHeaderProps = ComponentProps<"div">;

export const InlineCitationCarouselHeader = ({
  cclassName,
  ...props
}: InlineCitationCarouselHeaderProps) => (
  <div
    cclassName={cn(
      "flex items-center justify-between p-2 gap-2 bg-secondary rounded-t-md",
      cclassName
    )}
    {...props}
  />
);

export type InlineCitationCarouselIndexProps = ComponentProps<"div">;

export const InlineCitationCarouselIndex = ({
  children,
  cclassName,
  ...props
}: InlineCitationCarouselIndexProps) => {
  const { api } = useCarousel();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div
      cclassName={cn(
        "flex items-center flex-1 justify-end px-4 py-2 text-xs text-muted-foreground",
        cclassName
      )}
      {...props}
    >
      {children ?? `${current}/${count}`}
    </div>
  );
};

export type InlineCitationCarouselPrevProps = ComponentProps<"button">;

export const InlineCitationCarouselPrev = ({
  cclassName,
  ...props
}: InlineCitationCarouselPrevProps) => {
  const { api } = useCarousel();

  const handleClick = React.useCallback(() => {
    if (api) {
      api.scrollPrev();
    }
  }, [api]);

  return (
    <button
      type="button"
      cclassName={cn("shrink-0", cclassName)}
      onClick={handleClick}
      aria-label="Previous"
      {...props}
    >
      <ArrowLeftIcon cclassName="size-4 text-muted-foreground" />
    </button>
  );
};

export type InlineCitationCarouselNextProps = ComponentProps<"button">;

export const InlineCitationCarouselNext = ({
  cclassName,
  ...props
}: InlineCitationCarouselNextProps) => {
  const { api } = useCarousel();

  const handleClick = React.useCallback(() => {
    if (api) {
      api.scrollNext();
    }
  }, [api]);

  return (
    <button
      type="button"
      cclassName={cn("shrink-0", cclassName)}
      onClick={handleClick}
      aria-label="Next"
      {...props}
    >
      <ArrowRightIcon cclassName="size-4 text-muted-foreground" />
    </button>
  );
};

export type InlineCitationSourceProps = ComponentProps<"div"> & {
  title?: string;
  url?: string;
  description?: string;
};

export const InlineCitationSource = ({
  title,
  url,
  description,
  cclassName,
  children,
  ...props
}: InlineCitationSourceProps) => (
  <div cclassName={cn("space-y-1", cclassName)} {...props}>
    {title && (
      <h4 cclassName="mac-title">
        {title}
      </h4>
    )}
    {url && <p cclassName="text-xs text-muted-foreground break-all truncate">{url}</p>}
    {description && (
      <p cclassName="text-sm text-muted-foreground leading-relaxed line-clamp-3">{description}</p>
    )}
    {children}
  </div>
);

export type InlineCitationQuoteProps = ComponentProps<"blockquote">;

export const InlineCitationQuote = ({
  children,
  cclassName,
  ...props
}: InlineCitationQuoteProps) => (
  <blockquote
    cclassName={cn("border-l-2 border-muted pl-4 text-sm italic text-muted-foreground", cclassName)}
    {...props}
  >
    {children}
  </blockquote>
);
