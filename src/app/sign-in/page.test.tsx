// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { push, signIn, signUp } = vi.hoisted(() => ({
  push: vi.fn<(path: string) => void>(),
  signIn: vi.fn<(input: unknown) => Promise<{ error: { message?: string } | null }>>(),
  signUp: vi.fn<(input: unknown) => Promise<{ error: { message?: string } | null }>>(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/auth-client", () => ({
  authClient: { signIn: { email: signIn }, signUp: { email: signUp } },
}));

const { default: SignInPage } = await import("@/app/sign-in/page");

const fill = (label: string, value: string) => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

const submit = (name: string) => {
  fill("Email", "a@example.com");
  fill("Password", "password123");
  fireEvent.click(screen.getByRole("button", { name }));
};

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/sign-in?next=/dashboard/x");
});

describe("SignInPage", () => {
  it("signs in and returns to the requested page", async () => {
    signIn.mockResolvedValue({ error: null });
    render(<SignInPage />);

    submit("Sign in");

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/dashboard/x");
    });
    expect(signIn).toHaveBeenCalledWith({ email: "a@example.com", password: "password123" });
  });

  it("shows the server's error and keeps what the user typed", async () => {
    signIn.mockResolvedValue({ error: { message: "Invalid email or password" } });
    render(<SignInPage />);

    submit("Sign in");

    expect((await screen.findByRole("alert")).textContent).toBe("Invalid email or password");
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByLabelText<HTMLInputElement>("Email").value).toBe("a@example.com");
  });

  it("falls back to a generic error without a message", async () => {
    signIn.mockResolvedValue({ error: {} });
    render(<SignInPage />);

    submit("Sign in");

    expect((await screen.findByRole("alert")).textContent).toBe("Sign-in failed");
  });

  it("creates an account with a name, and can switch back", async () => {
    signUp.mockResolvedValue({ error: null });
    render(<SignInPage />);

    fireEvent.click(screen.getByRole("button", { name: "No account yet? Create one" }));
    fill("Name", "Ada");
    submit("Create account");

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        email: "a@example.com",
        password: "password123",
        name: "Ada",
      });
    });
    fireEvent.click(screen.getByRole("button", { name: "Have an account? Sign in" }));
    expect(screen.queryByLabelText("Name")).toBeNull();
  });
});

describe("SignInPage while a request runs", () => {
  it("keeps the submit button disabled until it navigates, so a double click sends one request", async () => {
    let finish = (_value: { error: null }) => {};
    signUp.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(<SignInPage />);
    fireEvent.click(screen.getByRole("button", { name: "No account yet? Create one" }));
    fill("Name", "Ada");

    submit("Create account");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    finish({ error: null });

    await waitFor(() => {
      expect(push).toHaveBeenCalled();
    });
    expect(signUp).toHaveBeenCalledTimes(1);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Create account" }).disabled).toBe(
      true,
    );
  });
});
