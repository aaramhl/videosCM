import "./index.css";
import { Composition } from "remotion";
import { Showcase, SHOWCASE_DURATION } from "./Microscope/Showcase";
import { DURATION, FPS, HEIGHT, WIDTH } from "./shared/theme";
import { Teaser } from "./Teaser/Teaser";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="CanonTeaser" component={Teaser} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition
        id="MicroscopeShowcase"
        component={Showcase}
        durationInFrames={SHOWCASE_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
