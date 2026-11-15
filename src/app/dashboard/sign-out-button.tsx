"use client";

import { useRouter } from "next/navigation";

import { AppButton } from "@/components/app-button";
import { ROUTES } from "@/const/routes";
import { authClient } from "@/lib/auth-client";

export const SignOutButton = () => {
  const router = useRouter();
  const signOut = async () => {
    await authClient.signOut();
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
