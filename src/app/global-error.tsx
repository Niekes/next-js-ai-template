"use client";

import "@/app/globals.css";

import ErrorPage from "@/app/error";

// Replaces the root layout when it fails, so it brings its own <html> and styles
const GlobalError = ({ retry }: { retry: () => void }) => (
  <html lang="en">
    <body className="flex min-h-dvh flex-col antialiased">
      <title>Something went wrong</title>
      <ErrorPage retry={retry} />
    </body>
  </html>
);

export default GlobalError;
