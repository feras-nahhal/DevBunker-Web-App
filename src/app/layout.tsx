// app/layout.tsx
"use client";

import { AuthProvider } from "@/hooks/AuthProvider";
import "./globals.css";
import type { ReactNode } from "react";
 // adjust path


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
