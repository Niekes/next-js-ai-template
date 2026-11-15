"use client";

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
  return mode === "sign-in"
    ? authClient.signIn.email({ email, password })
    : authClient.signUp.email({ email, password, name: formText(form, "name") });
};

const SignInPage = () => {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (form: FormData) => {
    setError(null);
    setPending(true);
    // better-fetch throws (not returns) on network errors, so both paths re-enable the button
    const result = await submitCredentials(mode, form).catch(() => ({
      error: { message: undefined },
    }));
    if (result.error) {
      setPending(false);
      setError(result.error.message ?? "Sign-in failed");
      return;
    }
    router.push(returnPath(window.location.search));
  };

  return (
    <AppPage title={mode === "sign-in" ? "Sign in" : "Create account"}>
      {/* onSubmit, not action: React resets an action form even when sign-in fails */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(new FormData(event.currentTarget));
        }}
        className="grid max-w-sm gap-4"
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
