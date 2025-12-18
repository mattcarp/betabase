"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cognitoAuth } from "../services/cognitoAuth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  // COMPLETE BYPASS FOR DEMO
  return <>{children}</>;
}
