// @vitest-environment jsdom
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const refresh = vi.fn<() => void>();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const { Providers } = await import("@/app/providers");

const StaleTime = () => (
  <p>{String(useQueryClient().getDefaultOptions().queries?.staleTime ?? "none")}</p>
);

const Failing = ({ status }: { status: number }) => {
  const query = useQuery({
    queryKey: ["failing", status],
    queryFn: () => Promise.reject(Object.assign(new Error("failed"), { status })),
    retry: false,
  });
  return <p>{query.isError ? "error" : "loading"}</p>;
};

beforeEach(() => {
  refresh.mockClear();
});

describe("Providers", () => {
  it("gives children a query client that keeps data fresh for a minute", () => {
    render(
      <Providers>
        <StaleTime />
      </Providers>,
    );

    expect(screen.getByText("60000")).toBeTruthy();
  });

  it("refreshes the page when the session has expired, so the proxy sends the user to sign-in", async () => {
    render(
      <Providers>
        <Failing status={401} />
      </Providers>,
    );

    await waitFor(() => {
      expect(refresh).toHaveBeenCalledOnce();
    });
  });

  it("leaves other errors to the component", async () => {
    render(
      <Providers>
        <Failing status={500} />
      </Providers>,
    );

    await screen.findByText("error");
    expect(refresh).not.toHaveBeenCalled();
  });
});
