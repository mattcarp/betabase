"use client";

import { ChatPage } from "@/components/ui/pages/ChatPage";
import { AuthGuard } from "@/components/AuthGuard";

export default function Home() {
  return (
    <AuthGuard>
      <ChatPage />
    </AuthGuard>
  );
}
