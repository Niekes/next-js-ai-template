import "@/app/globals.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "Next.js AI Template",
  description: "A Next.js starter with deterministic guardrails for AI coding agents",
};

// Renders <meta name="color-scheme"> so the canvas is themed before CSS loads.
export const viewport: Viewport = { colorScheme: "light dark" };

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <body className="flex min-h-dvh flex-col antialiased">
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
