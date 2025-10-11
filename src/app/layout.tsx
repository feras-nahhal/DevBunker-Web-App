import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "My App",
  description: "Next.js App with Login + Dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}

