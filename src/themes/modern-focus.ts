import { createTheme } from "./theme-factory";

export const modernFocusTheme = createTheme("modern-focus", "Modern Focus", {
  "neutral-50": "#F5F7FA", "neutral-100": "#E9EDF2", "neutral-300": "#B8C0CC", "neutral-600": "#525D6C", "neutral-900": "#151B24",
  "primary-100": "#DDF5F1", "primary-500": "#168678", "primary-700": "#086157", "accent-100": "#E8E7FF", "accent-500": "#5A54B5"
}, { card: "crisp", icon: { style: "line", strokeWidth: 1.75, containerShape: "rounded-square", decorativeTreatment: "precise geometry" }, illustration: "geometric", background: { treatment: "gradient", pattern: "geometry", patternOpacity: 0.04, patternScale: "40px" }, reveal: "fade", toastEntrance: "slide", pointShape: "rounded-square", lineStyle: "straight", emptyTone: "direct", emptyFrame: "open", checkbox: "snap", streak: "pulse", cardHover: "border" });
