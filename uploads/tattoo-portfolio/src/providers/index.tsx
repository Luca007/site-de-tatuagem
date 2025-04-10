"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { ToastProvider } from "./toast-provider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
      <ToastProvider />
    </AuthProvider>
  );
}
