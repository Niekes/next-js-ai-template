"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { AppButton } from "@/components/app-button";
import { ROUTES } from "@/const/routes";
import { authClient } from "@/lib/auth-client";

export const SignOutButton = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const signOut = async () => {
    await authClient.signOut();
    // cache keys are not per user, so the next user on this browser must not see this one's data
    queryClient.clear();
    router.push(ROUTES.home);
  };
  return (
    <AppButton
      variant="outline"
      size="sm"
      onClick={() => {
        void signOut();
      }}
    >
      Sign out
    </AppButton>
  );
};
