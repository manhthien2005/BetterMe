import { createTheme } from "./theme-factory";

export const cuteCatTheme = createTheme("cute-cat", "Cute Cat", {
  "neutral-50": "#FFF8F1", "neutral-100": "#FCECE7", "neutral-300": "#D9C1BC", "neutral-600": "#67545A", "neutral-900": "#30232B",
  "primary-100": "#FCE2EC", "primary-500": "#B8547A", "primary-700": "#873653", "accent-100": "#E7E4FA", "accent-500": "#6759A8"
}, { card: "soft", icon: { style: "duotone", strokeWidth: 2, containerShape: "sticker", decorativeTreatment: "tiny paw edge" }, illustration: "cat-sticker", background: { treatment: "pattern", pattern: "paws-stars", patternOpacity: 0.06, patternScale: "28px" }, reveal: "soft-scale", toastEntrance: "pop", pointShape: "paw", lineStyle: "smooth", emptyTone: "playful", emptyFrame: "card", checkbox: "bounce", streak: "spark", cardHover: "lift" });
