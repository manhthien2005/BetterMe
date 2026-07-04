import type { MotivationMessage } from "@/types";

export const MOTIVATION_MESSAGES: readonly MotivationMessage[] = [
  {
    id: "good-steady",
    body: "Nice. Stack one more calm day on top of this one.",
    tone: "focused",
    applicableStatuses: ["Good"],
    illustrationKey: "spark",
    active: true,
    weight: 1
  },
  {
    id: "okay-tiny-promises",
    body: "Keep the promise tiny; tiny promises compound.",
    tone: "gentle",
    applicableStatuses: ["Okay"],
    illustrationKey: "tiny-promise",
    active: true,
    weight: 1
  },
  {
    id: "bad-reset",
    body: "A reset day still counts as practice. Pick one small win.",
    tone: "reflective",
    applicableStatuses: ["Bad"],
    illustrationKey: "reset",
    active: true,
    weight: 1
  },
  {
    id: "planned-preview",
    body: "Future you gets a softer start when today you names the next step.",
    tone: "playful",
    applicableStatuses: ["Planned"],
    illustrationKey: "calendar",
    active: true,
    weight: 1
  }
];
