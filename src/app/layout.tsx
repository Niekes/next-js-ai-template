import "@/app/globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "Next.js AI Template",
  description: "A Next.js starter with deterministic guardrails for AI coding agents",
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <body className="flex min-h-dvh flex-col antialiased">
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
