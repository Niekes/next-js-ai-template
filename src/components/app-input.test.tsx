// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";

import { AppInput } from "./app-input";

describe("AppInput", () => {
  it("labels the input with a generated id", () => {
    render(<AppInput label="Email" name="email" />);

    expect(screen.getByLabelText("Email").getAttribute("name")).toBe("email");
  });

  it("keeps a given id", () => {
    render(<AppInput label="Email" id="email-field" />);

    expect(screen.getByLabelText("Email").id).toBe("email-field");
  });
});
