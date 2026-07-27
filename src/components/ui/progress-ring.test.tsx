import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressRing } from "./progress-ring";

describe("ProgressRing", () => {
  it("reports progress to assistive tech, not just to the eye", () => {
    render(<ProgressRing label="Tiến độ hôm nay" target={4} value={2} />);

    const ring = screen.getByRole("progressbar", { name: "Tiến độ hôm nay" });

    expect(ring.getAttribute("aria-valuenow")).toBe("2");
    expect(ring.getAttribute("aria-valuemax")).toBe("4");
  });

  it("never renders a ratio outside 0–100%", () => {
    // A count habit can overshoot its target (10 glasses of an 8-glass goal)
    // and a corrupt cell can go negative; neither may produce a broken ring.
    const { container: over } = render(<ProgressRing label="a" target={8} value={99} />);
    const { container: under } = render(<ProgressRing label="b" target={8} value={-5} />);

    expect(over.querySelector("[data-ratio]")?.getAttribute("data-ratio")).toBe("100");
    expect(under.querySelector("[data-ratio]")?.getAttribute("data-ratio")).toBe("0");
  });

  it("a zero target is a full ring, not a division by zero", () => {
    const { container } = render(<ProgressRing label="a" target={0} value={0} />);

    expect(container.querySelector("[data-ratio]")?.getAttribute("data-ratio")).toBe("100");
  });

  it("renders whatever it is given in the middle", () => {
    render(
      <ProgressRing label="Tiến độ" target={4} value={2}>
        <span>2/4</span>
      </ProgressRing>
    );

    expect(screen.getByText("2/4")).toBeTruthy();
  });
});
