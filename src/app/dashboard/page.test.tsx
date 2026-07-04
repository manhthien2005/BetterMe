import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DashboardPage from "./page";

vi.mock("../../components/dashboard/dashboard-overview", () => ({
  DashboardOverview: () => <section>Local dashboard overview</section>
}));

describe("DashboardPage", () => {
  it("renders the local-first dashboard without auth routing", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Local dashboard overview")).toBeTruthy();
  });
});
