"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppButton } from "@/components/app-button";
import { AppInput } from "@/components/app-input";
import { AppPage } from "@/components/app-page";
import { authClient } from "@/lib/auth-client";
import { formText, returnPath } from "@/lib/forms";

type Mode = "sign-in" | "sign-up";

const submitCredentials = (mode: Mode, form: FormData) => {
  const email = formText(form, "email");
  const password = formText(form, "password");
  const request =
    mode === "sign-in"
      ? authClient.signIn.email({ email, password })
      : authClient.signUp.email({ email, password, name: formText(form, "name") });
  // better-fetch throws (not returns) on network errors, so both paths re-enable the button
  return request.catch(() => ({ error: { message: undefined } }));
};

const SignInPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (form: FormData) => {
    setError(null);
    setPending(true);
    const result = await submitCredentials(mode, form);
    if (result.error) {
      setPending(false);
      setError(result.error.message ?? "Sign-in failed");
      return;
    }
    // cache keys are not per user; drop what an expired session left behind
    queryClient.clear();
    router.push(returnPath(window.location.search));
  };

  return (
    <AppPage
      title={mode === "sign-in" ? "Sign in" : "Create account"}
      // safe: a tall sign-up form on a short screen top-aligns instead of clipping
      className="flex max-w-sm flex-col justify-center-safe"
    >
      {/* onSubmit, not action: React resets an action form even when sign-in fails */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(new FormData(event.currentTarget));
        }}
        className="grid gap-4"
      >
        {mode === "sign-up" && <AppInput label="Name" name="name" required autoComplete="name" />}
        <AppInput label="Email" name="email" type="email" required autoComplete="email" />
        <AppInput label="Password" name="password" type="password" required minLength={8} />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AppButton type="submit" disabled={pending}>
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </AppButton>
        <AppButton
          type="button"
          variant="ghost"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          }}
        >
          {mode === "sign-in" ? "No account yet? Create one" : "Have an account? Sign in"}
        </AppButton>
      </form>
    </AppPage>
  );
};

export default SignInPage;
