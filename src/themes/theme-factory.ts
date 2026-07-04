import type { RawColorToken, ThemeDefinition, ThemeId } from "@/types";

type Personality = {
  card: ThemeDefinition["semantic"]["cardFrame"]["style"];
  icon: ThemeDefinition["semantic"]["icon"];
  illustration: ThemeDefinition["semantic"]["illustration"]["style"];
  background: ThemeDefinition["semantic"]["background"];
  reveal: ThemeDefinition["semantic"]["motion"]["reveal"];
  toastEntrance: ThemeDefinition["semantic"]["toast"]["entrance"];
  pointShape: ThemeDefinition["semantic"]["chart"]["pointShape"];
  lineStyle: ThemeDefinition["semantic"]["chart"]["lineStyle"];
  emptyTone: ThemeDefinition["semantic"]["emptyState"]["tone"];
  emptyFrame: ThemeDefinition["semantic"]["emptyState"]["frame"];
  checkbox: ThemeDefinition["semantic"]["microInteractions"]["checkbox"];
  streak: ThemeDefinition["semantic"]["microInteractions"]["streak"];
  cardHover: ThemeDefinition["semantic"]["microInteractions"]["cardHover"];
};

const BASE_COLORS: Record<RawColorToken, string> = {
  "neutral-0": "#FFFFFF", "neutral-50": "#FAF8F5", "neutral-100": "#F1ECE6", "neutral-300": "#C8BEB5", "neutral-600": "#5D554F", "neutral-900": "#251F1B",
  "primary-100": "#E4F2EC", "primary-500": "#39755A", "primary-700": "#24503C", "accent-100": "#E8EDF8", "accent-500": "#536D9E",
  "good-100": "#DDF3E5", "good-700": "#195C35", "okay-100": "#FFF0C2", "okay-700": "#6D4A00", "bad-100": "#FFE0DE", "bad-700": "#8A2424", "planned-100": "#E9E5F4", "planned-700": "#4C416D"
};

export function createTheme(id: ThemeId, name: string, colors: Partial<Record<RawColorToken, string>>, personality: Personality): ThemeDefinition {
  return {
    id, name, mode: "light",
    raw: {
      colors: { ...BASE_COLORS, ...colors },
      fontFamilies: { body: "var(--font-body, ui-sans-serif, system-ui)", display: "var(--font-display, ui-sans-serif, system-ui)", mono: "ui-monospace, SFMono-Regular, monospace" },
      fontSizes: { xs: "0.75rem", sm: "0.875rem", md: "1rem", lg: "1.125rem", xl: "1.5rem", "2xl": "2.25rem" },
      fontWeights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
      spacing: { "0": "0", "1": "0.25rem", "2": "0.5rem", "3": "0.75rem", "4": "1rem", "6": "1.5rem", "8": "2rem", "12": "3rem" },
      radii: { none: "0", sm: "0.375rem", md: "0.625rem", lg: "0.875rem", xl: "1.25rem", full: "9999px" },
      shadows: { none: "none", soft: "0 8px 24px rgb(37 31 27 / 0.08)", raised: "0 14px 36px rgb(37 31 27 / 0.12)", floating: "0 20px 50px rgb(37 31 27 / 0.18)" },
      durations: { instant: "0ms", fast: "120ms", normal: "220ms", slow: "420ms" },
      easing: { standard: "cubic-bezier(.2,.8,.2,1)", emphasized: "cubic-bezier(.2,1.4,.4,1)", gentle: "cubic-bezier(.3,.7,.3,1)" }
    },
    semantic: {
      colors: { background: "neutral-50", backgroundAccent: "primary-100", surface: "neutral-0", surfaceMuted: "neutral-100", text: "neutral-900", textMuted: "neutral-600", textOnPrimary: "neutral-0", primary: "primary-700", primaryHover: "primary-500", accent: "accent-500", border: "neutral-300", focus: "accent-500", disabled: "neutral-300", selection: "primary-100", statusGoodSurface: "good-100", statusGoodText: "good-700", statusOkaySurface: "okay-100", statusOkayText: "okay-700", statusBadSurface: "bad-100", statusBadText: "bad-700", statusPlannedSurface: "planned-100", statusPlannedText: "planned-700" },
      typography: { bodyFamily: "body", displayFamily: "display", monoFamily: "mono", bodySize: "md", labelSize: "sm", headingSize: "xl", metricSize: "2xl", bodyWeight: "regular", labelWeight: "semibold", headingWeight: "bold", lineHeightBody: 1.6, lineHeightHeading: 1.2, letterSpacingLabel: "0.02em" },
      radius: { control: "md", card: id === "modern-focus" ? "md" : "xl", panel: "lg", pill: "full", illustration: "xl" },
      cardFrame: { style: personality.card, borderWidth: "1px", shadow: id === "minimal-calm" ? "soft" : "raised", highlight: id === "study-corner" ? "edge" : id === "cute-cat" ? "inset" : "none" },
      icon: personality.icon,
      illustration: { style: personality.illustration, density: id === "minimal-calm" ? "sparse" : "balanced", emptyStateKey: `${id}-empty` },
      background: personality.background,
      motion: { fast: "fast", normal: "normal", slow: "slow", easing: id === "cute-cat" ? "emphasized" : "gentle", hoverLift: id === "minimal-calm" ? "0" : "-2px", pressScale: 0.98, reveal: personality.reveal },
      toast: { radius: id === "modern-focus" ? "md" : "lg", shadow: "floating", entrance: personality.toastEntrance, iconContainer: id === "cute-cat" ? "sticker" : id === "minimal-calm" ? "circle" : "rounded-square" },
      chart: { gridColor: "neutral-300", axisColor: "neutral-600", tooltipSurface: "neutral-0", cursorColor: "primary-100", seriesColors: ["primary-700", "accent-500", "primary-500"], lineStyle: personality.lineStyle, pointShape: personality.pointShape, barRadius: id === "modern-focus" ? "sm" : "lg" },
      emptyState: { frame: personality.emptyFrame, actionStyle: id === "minimal-calm" ? "quiet" : "primary", tone: personality.emptyTone },
      microInteractions: { checkbox: personality.checkbox, streak: personality.streak, cardHover: personality.cardHover, saveConfirmation: id === "minimal-calm" ? "inline" : "toast", themeSwitch: id === "modern-focus" ? "instant" : "crossfade" }
    }
  };
}
