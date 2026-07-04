import { createTheme } from "./theme-factory";

export const minimalCalmTheme = createTheme("minimal-calm", "Minimal Calm", {
  "neutral-50": "#FAF9F5", "neutral-100": "#EFEEE8", "neutral-300": "#C5C4BA", "neutral-600": "#5B5C55", "neutral-900": "#242621",
  "primary-100": "#E5EDE5", "primary-500": "#647D68", "primary-700": "#425D47", "accent-100": "#E5ECF1", "accent-500": "#516F82"
}, { card: "quiet", icon: { style: "line", strokeWidth: 1.5, containerShape: "none", decorativeTreatment: "quiet thin line" }, illustration: "calm-botanical", background: { treatment: "wash", pattern: "botanical", patternOpacity: 0.03, patternScale: "64px" }, reveal: "fade", toastEntrance: "fade", pointShape: "circle", lineStyle: "smooth", emptyTone: "reflective", emptyFrame: "open", checkbox: "fade", streak: "none", cardHover: "none" });
