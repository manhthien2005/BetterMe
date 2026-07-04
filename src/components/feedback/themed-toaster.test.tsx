import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemedToaster } from "./themed-toaster";

describe("ThemedToaster", () => {
  it("exposes a theme-aware polite feedback region", () => {
    render(<ThemedToaster />);
    expect(screen.getByTestId("themed-toaster").getAttribute("data-theme-aware")).toBe("true");
  });
});
