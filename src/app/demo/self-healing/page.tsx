/**
 * Self-Healing Demo Target App
 *
 * Server Component wrapper for the self-healing demo.
 * The actual interactive UI is in SelfHealingDemo.tsx (client component).
 */

// Force dynamic rendering to avoid SSG issues
export const dynamic = "force-dynamic";

import SelfHealingDemo from "./SelfHealingDemo";

export default function SelfHealingDemoPage() {
  return <SelfHealingDemo />;
}
