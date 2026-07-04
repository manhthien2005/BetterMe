import { createTheme } from "./theme-factory";

export const studyCornerTheme = createTheme("study-corner", "Study Corner", {
  "neutral-50": "#FFFBEF", "neutral-100": "#F5ECD5", "neutral-300": "#CBBE9F", "neutral-600": "#625A48", "neutral-900": "#242A35",
  "primary-100": "#E4F0E5", "primary-500": "#477B55", "primary-700": "#2E583A", "accent-100": "#FFF0B8", "accent-500": "#8A5B12"
}, { card: "notebook", icon: { style: "line", strokeWidth: 1.9, containerShape: "rounded-square", decorativeTreatment: "hand-drawn ink" }, illustration: "hand-drawn-study", background: { treatment: "pattern", pattern: "notebook-grid", patternOpacity: 0.08, patternScale: "24px" }, reveal: "fade-slide", toastEntrance: "slide", pointShape: "circle", lineStyle: "straight", emptyTone: "encouraging", emptyFrame: "note", checkbox: "highlight", streak: "underline", cardHover: "border" });
