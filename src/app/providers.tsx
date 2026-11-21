"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

export const Providers = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [queryClient] = useState(() => {
    // An expired session answers 401; refreshing re-runs src/proxy.ts, which redirects to
    // sign-in (and sign-in clears the cache before the next user sees it).
    // shortcut: only pages in the proxy matcher (/dashboard) redirect, push to sign-in here once
    // queries run elsewhere
    const onError = (error: Error) => {
      if ("status" in error && error.status === 401) router.refresh();
    };
    return new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: { queries: { staleTime: 60 * 1000 } },
    });
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
