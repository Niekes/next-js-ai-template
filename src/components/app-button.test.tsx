// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";

import { AppButton } from "./app-button";

describe("AppButton", () => {
  it("renders the shadcn primitive with the primary variant by default", () => {
    render(<AppButton>Save</AppButton>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button.dataset.slot).toBe("button");
    expect(button.dataset.variant).toBe("default");
  });

  it("maps the app's variant names to shadcn's", () => {
    render(<AppButton variant="error">Delete</AppButton>);

    expect(screen.getByRole("button").dataset.variant).toBe("destructive");
  });
});
