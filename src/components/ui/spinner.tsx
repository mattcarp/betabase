import { Loader2Icon } from "lucide-react";

import { cn } from "../../lib/utils";

function Spinner({ cclassName, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      cclassName={cn("size-4 animate-spin", cclassName)}
      {...props}
    />
  );
}

export { Spinner };
