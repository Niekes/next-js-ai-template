// @vitest-environment jsdom
import { useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";

import { Providers } from "@/app/providers";

const StaleTime = () => (
  <p>{String(useQueryClient().getDefaultOptions().queries?.staleTime ?? "none")}</p>
);

describe("Providers", () => {
  it("gives children a query client that keeps data fresh for a minute", () => {
    render(
      <Providers>
        <StaleTime />
      </Providers>,
    );

    expect(screen.getByText("60000")).toBeTruthy();
  });
});
