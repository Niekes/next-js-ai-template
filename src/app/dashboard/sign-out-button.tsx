"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppButton } from "@/components/app-button";
import { ROUTES } from "@/const/routes";
import { authClient } from "@/lib/auth-client";

export const SignOutButton = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [failed, setFailed] = useState(false);
  const signOut = async () => {
    setFailed(false);
    // better-fetch throws (not returns) on network errors; either way the session may still be live
    const result = await authClient.signOut().catch(() => ({ error: {} }));
    if (result.error) {
      setFailed(true);
      return;
    }
    // cache keys are not per user, so the next user on this browser must not see this one's data
    queryClient.clear();
    router.push(ROUTES.home);
  };
  return (
    <div className="flex items-center gap-3">
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          Sign-out failed. You are still signed in.
        </p>
      )}
      <AppButton
        variant="outline"
        size="sm"
        onClick={() => {
          void signOut();
        }}
      >
        Sign out
      </AppButton>
    </div>
  );
};
