"use client";

import { LoginForm } from "../../components/auth/LoginForm-Production";

export default function TestLoginPage() {
  return <LoginForm onLoginSuccess={() => console.log("Login successful!")} />;
}
