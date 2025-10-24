import { redirect } from "next/navigation";

/**
 * Dashboard redirect
 *
 * SIAM is a Single Page Application - all functionality is on the root route.
 * Redirect /dashboard to / for better UX.
 */
export default function DashboardPage() {
  redirect("/");
}
