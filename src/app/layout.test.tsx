import { isValidElement, type ReactElement } from "react";
import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("@/app/globals.css", () => ({}));

const { default: RootLayout, metadata } = await import("@/app/layout");

describe("RootLayout", () => {
  it("wraps the page in the providers inside an English document", () => {
    const html = RootLayout({ children: "page" }) as ReactElement<{
      lang: string;
      children: ReactElement<{ children: ReactElement<{ children: string }> }>;
    }>;

    expect(html.props.lang).toBe("en");
    const providers = html.props.children.props.children;
    expect(isValidElement(providers)).toBe(true);
    expect(providers.props.children).toBe("page");
    expect(metadata.title).toBe("Next.js AI Template");
  });
});
