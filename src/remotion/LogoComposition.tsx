import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

const palette = {
  background: "#f8faf9",
  charcoal: "#18201f",
  mint: "#6ec8a6",
  coral: "#f36f5b",
  sky: "#6aa8ff",
  cream: "#fff7e8"
};

export const BetterMeLogo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = spring({
    frame,
    fps,
    config: {
      damping: 16,
      mass: 0.9,
      stiffness: 130
    }
  });

  const wordReveal = interpolate(frame, [14, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  const pulse = interpolate(Math.sin(frame / 7), [-1, 1], [0.96, 1.04]);
  const underline = interpolate(frame, [34, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background: palette.background,
        color: palette.charcoal,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        justifyContent: "center"
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 34,
          transform: `translateY(${interpolate(intro, [0, 1], [42, 0])}px)`,
          opacity: intro
        }}
      >
        <div
          style={{
            height: 210,
            position: "relative",
            transform: `scale(${intro * pulse})`,
            width: 210
          }}
        >
          <div
            style={{
              background: palette.cream,
              border: `8px solid ${palette.charcoal}`,
              borderRadius: 54,
              height: 156,
              left: 27,
              position: "absolute",
              top: 27,
              transform: `rotate(${interpolate(intro, [0, 1], [-18, 0])}deg)`,
              width: 156
            }}
          />
          <div
            style={{
              background: palette.mint,
              border: `7px solid ${palette.charcoal}`,
              borderRadius: 36,
              height: 82,
              left: 37,
              position: "absolute",
              top: 52,
              transform: `rotate(${interpolate(intro, [0, 1], [24, -10])}deg)`,
              width: 82
            }}
          />
          <div
            style={{
              background: palette.sky,
              border: `7px solid ${palette.charcoal}`,
              borderRadius: 999,
              height: 76,
              position: "absolute",
              right: 36,
              top: 42,
              transform: `scale(${interpolate(frame, [8, 28], [0.2, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp"
              })})`,
              width: 76
            }}
          />
          <div
            style={{
              background: palette.coral,
              border: `7px solid ${palette.charcoal}`,
              borderRadius: 999,
              bottom: 34,
              height: 58,
              position: "absolute",
              right: 54,
              transform: `translateY(${interpolate(frame, [18, 38], [42, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp"
              })}px)`,
              width: 58
            }}
          />
        </div>

        <div style={{ alignItems: "center", display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 104,
              fontWeight: 850,
              letterSpacing: 0,
              lineHeight: 1,
              opacity: wordReveal,
              transform: `translateY(${interpolate(wordReveal, [0, 1], [24, 0])}px)`
            }}
          >
            BetterMe
          </div>
          <div
            style={{
              background: palette.mint,
              border: `5px solid ${palette.charcoal}`,
              borderRadius: 999,
              height: 18,
              marginTop: 24,
              transform: `scaleX(${underline})`,
              transformOrigin: "left center",
              width: 420
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
