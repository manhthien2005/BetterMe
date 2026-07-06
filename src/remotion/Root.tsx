import { Composition } from "remotion";
import { BetterMeLogo } from "./LogoComposition";

export const RemotionRoot = () => {
  return (
    <Composition
      component={BetterMeLogo}
      durationInFrames={90}
      fps={30}
      height={720}
      id="BetterMeLogo"
      width={1280}
    />
  );
};
