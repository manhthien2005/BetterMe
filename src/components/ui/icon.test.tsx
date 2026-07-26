import { render } from "@testing-library/react";
import { Pencil } from "lucide-react";
import { describe, expect, it } from "vitest";

import { Icon } from "@/components/ui/icon";

describe("Icon", () => {
  it("hides decorative icons from assistive tech", () => {
    const { container } = render(<Icon as={Pencil} />);
    const svg = container.querySelector("svg");

    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("aria-label")).toBeNull();
  });

  it("exposes a labelled icon as an image", () => {
    const { container } = render(<Icon as={Pencil} label="Sửa thói quen" />);
    const svg = container.querySelector("svg");

    expect(svg?.getAttribute("aria-label")).toBe("Sửa thói quen");
    expect(svg?.getAttribute("aria-hidden")).toBeNull();
    expect(svg?.getAttribute("role")).toBe("img");
  });

  it("defaults to the medium size and accepts overrides", () => {
    const { container } = render(<Icon as={Pencil} className="text-action" />);
    const svg = container.querySelector("svg");

    expect(svg?.getAttribute("class")).toContain("h-[18px]");
    expect(svg?.getAttribute("class")).toContain("text-action");
  });
});
