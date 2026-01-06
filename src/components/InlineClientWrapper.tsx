"use client";

/**
 * InlineClientWrapper - Minimal client wrapper that CANNOT fail
 *
 * This is intentionally minimal with NO imports except React.
 * Theme management is handled by inline scripts in layout.tsx.
 * This component exists ONLY to mark the boundary as "use client".
 */

import type { ReactNode } from "react";

export function InlineClientWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default InlineClientWrapper;
