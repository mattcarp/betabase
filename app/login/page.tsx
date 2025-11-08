// app/login/page.tsx
"use client";

import { MagicLinkLoginForm } from "../../src/components/auth/MagicLinkLoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[var(--mac-surface-bg)]">
      <div className="w-full max-w-md mx-auto p-8">
        <MagicLinkLoginForm onLoginSuccess={() => (window.location.href = "/")} />
      </div>
    </div>
  );
}
