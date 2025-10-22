// app/login/page.tsx
"use client";

import { MagicLinkLoginForm } from "../../src/components/auth/MagicLinkLoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
      <div className="w-full max-w-md p-8">
        <MagicLinkLoginForm onLoginSuccess={() => (window.location.href = "/")} />
      </div>
    </div>
  );
}
