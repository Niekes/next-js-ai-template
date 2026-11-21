// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

import ErrorPage from "@/app/error";
import GlobalError from "@/app/global-error";
import NotFoundPage from "@/app/not-found";

describe("error pages", () => {
  it.each([
    ["error", ErrorPage],
    ["global-error", GlobalError],
  ])("%s retries on click", (_name, Page) => {
    const retry = vi.fn<() => void>();
    render(<Page retry={retry} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it("not-found links home", () => {
    render(<NotFoundPage />);

    expect(screen.getByRole("link").getAttribute("href")).toBe("/");
  });
});
