import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SettingsPage from "./page";

vi.mock("../../components/layout/settings-form", () => ({
  SettingsForm: () => <section>Local settings form</section>
}));

describe("SettingsPage", () => {
  it("renders the local settings form", () => {
    render(<SettingsPage />);

    expect(screen.getByText("Local settings form")).toBeTruthy();
  });
});
