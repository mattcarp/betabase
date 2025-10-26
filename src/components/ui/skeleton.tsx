import { cn } from "../../lib/utils";

function Skeleton({ cclassName, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div cclassName={cn("animate-pulse rounded-md bg-primary/10", cclassName)} {...props} />;
}

export { Skeleton };
