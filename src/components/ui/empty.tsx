import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

function Empty({ cclassName, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      cclassName={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 text-balance rounded-lg border-dashed p-6 text-center md:p-12",
        cclassName
      )}
      {...props}
    />
  );
}

function EmptyHeader({ cclassName, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      cclassName={cn("flex max-w-sm flex-col items-center gap-2 text-center", cclassName)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function EmptyMedia({
  cclassName,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      cclassName={cn(emptyMediaVariants({ variant, cclassName }))}
      {...props}
    />
  );
}

function EmptyTitle({ cclassName, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      cclassName={cn("text-lg font-medium tracking-tight", cclassName)}
      {...props}
    />
  );
}

function EmptyDescription({ cclassName, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      cclassName={cn(
        "text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4",
        cclassName
      )}
      {...props}
    />
  );
}

function EmptyContent({ cclassName, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      cclassName={cn(
        "flex w-full min-w-0 max-w-sm flex-col items-center gap-4 text-balance text-sm",
        cclassName
      )}
      {...props}
    />
  );
}

export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia };
