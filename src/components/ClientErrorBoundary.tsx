"use client";

/**
 * Client-side Error Boundary wrapper for Next.js App Router.
 * This component can be imported into server components (like layout.tsx)
 * and will handle client-side errors.
 */

import { ErrorBoundary } from "./ErrorBoundary";

export { ErrorBoundary as ClientErrorBoundary };
