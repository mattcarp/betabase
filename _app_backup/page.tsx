"use client";

import { ChatPage } from "@/components/ui/pages/ChatPage";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function Home() {
  return <ChatPage />;
}
