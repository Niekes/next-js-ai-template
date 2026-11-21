"use client";

import { AppButton } from "@/components/app-button";
import { AppPage } from "@/components/app-page";

// Server errors are logged by onRequestError in src/instrumentation.ts.
// shortcut: browser errors are not tracked, add Sentry (or similar) before production
const ErrorPage = ({ retry }: { retry: () => void }) => (
  <AppPage title="Something went wrong">
    <AppButton onClick={retry}>Try again</AppButton>
  </AppPage>
);

export default ErrorPage;
